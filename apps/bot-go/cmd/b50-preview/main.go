// b50-preview is the first production component of the Go bot migration.
// It renders a complete B50 image from live Diving-Fish data using only LXNS
// jacket art; every other visual element is drawn locally in Go.
package main

import (
	"bytes"
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"image"
	"image/color"
	_ "image/jpeg"
	"image/png"
	"io"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"sort"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/fogleman/gg"
	"golang.org/x/image/draw"
	"golang.org/x/image/font"
)

const (
	canvasWidth  = 2400
	canvasHeight = 2800
	margin       = 72
	gap          = 24
	rowGap       = 24
	cardHeight   = 190
	headerHeight = 318
	cardsPerRow  = 5
	panelInset   = 24
	panelX       = margin - panelInset
	panelWidth   = canvasWidth - panelX*2
	cardWidth    = (canvasWidth - margin*2 - gap*(cardsPerRow-1)) / cardsPerRow

	sectionHeaderHeight = 96
	gridTopPadding      = 18
	b35Rows             = 7
	b15Rows             = 3
	b35PanelY           = 300
	b35PanelHeight      = sectionHeaderHeight + gridTopPadding + b35Rows*cardHeight + (b35Rows-1)*rowGap + 36
	b15PanelY           = b35PanelY + b35PanelHeight + 28
	b15PanelHeight      = sectionHeaderHeight + gridTopPadding + b15Rows*cardHeight + (b15Rows-1)*rowGap + 36
)

type b50Response struct {
	Nickname         string `json:"nickname"`
	Plate            string `json:"plate"`
	AdditionalRating int    `json:"additional_rating"`
	Rating           int    `json:"rating"`
	Charts           struct {
		SD []song `json:"sd"`
		DX []song `json:"dx"`
	} `json:"charts"`
}

type song struct {
	Achievements float64 `json:"achievements"`
	Difficulty   float64 `json:"ds"`
	DXScore      int     `json:"dxScore"`
	DXScoreRatio float64 `json:"-"`
	FC           string  `json:"fc"`
	FS           string  `json:"fs"`
	Level        string  `json:"level"`
	LevelIndex   int     `json:"level_index"`
	Rating       int     `json:"ra"`
	Rate         string  `json:"rate"`
	ID           int     `json:"song_id"`
	Title        string  `json:"title"`
	Type         string  `json:"type"`
}

type cardSong struct {
	song
	Group string
}

type palette struct {
	bodyPath    string
	displayPath string
	faces       sync.Map
}

func main() {
	username := flag.String("username", "", "Diving-Fish username")
	out := flag.String("out", "", "PNG output path")
	fontDir := flag.String("font-dir", "../bot/static/fonts", "directory containing HanYi.ttf")
	flag.Parse()
	if *username == "" {
		fmt.Fprintln(os.Stderr, "-username is required")
		os.Exit(2)
	}
	if *out == "" {
		*out = fmt.Sprintf("%s-b50-go.png", *username)
	}
	if err := run(context.Background(), *username, *out, *fontDir); err != nil {
		fmt.Fprintln(os.Stderr, "b50 preview:", err)
		os.Exit(1)
	}
}

func run(ctx context.Context, username, out, fontDir string) error {
	data, err := fetchB50(ctx, username)
	if err != nil {
		return err
	}
	faces, err := loadFaces(fontDir)
	if err != nil {
		return err
	}
	image, err := renderB50(ctx, data, faces)
	if err != nil {
		return err
	}
	if err := os.MkdirAll(filepath.Dir(out), 0o755); err != nil && filepath.Dir(out) != "." {
		return err
	}
	file, err := os.Create(out)
	if err != nil {
		return err
	}
	defer file.Close()
	return pngEncode(file, image)
}

func fetchB50(ctx context.Context, username string) (b50Response, error) {
	body, err := json.Marshal(map[string]any{"username": username, "b50": true})
	if err != nil {
		return b50Response{}, err
	}
	request, err := http.NewRequestWithContext(ctx, http.MethodPost, "https://www.diving-fish.com/api/maimaidxprober/query/player", bytes.NewReader(body))
	if err != nil {
		return b50Response{}, err
	}
	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("User-Agent", "maimai-lab-go/0.1")
	client := &http.Client{Timeout: 20 * time.Second}
	response, err := client.Do(request)
	if err != nil {
		return b50Response{}, err
	}
	defer response.Body.Close()
	if response.StatusCode != http.StatusOK {
		return b50Response{}, fmt.Errorf("Diving-Fish returned %s", response.Status)
	}
	var result b50Response
	if err := json.NewDecoder(response.Body).Decode(&result); err != nil {
		return b50Response{}, err
	}
	if len(result.Charts.SD) != 35 || len(result.Charts.DX) != 15 {
		return b50Response{}, fmt.Errorf("expected B35 + B15, got %d + %d", len(result.Charts.SD), len(result.Charts.DX))
	}
	// Do not rely on an upstream ordering detail for the visual No. 1.  Rating
	// is the B50 primary score; achievement and DX score percentage resolve ties.
	enrichDXRatios(ctx, result.Charts.SD)
	enrichDXRatios(ctx, result.Charts.DX)
	sortSongs(result.Charts.SD)
	sortSongs(result.Charts.DX)
	return result, nil
}

func sortSongs(songs []song) {
	sort.SliceStable(songs, func(left, right int) bool {
		if songs[left].Rating != songs[right].Rating {
			return songs[left].Rating > songs[right].Rating
		}
		if songs[left].Achievements != songs[right].Achievements {
			return songs[left].Achievements > songs[right].Achievements
		}
		if songs[left].DXScoreRatio != songs[right].DXScoreRatio {
			return songs[left].DXScoreRatio > songs[right].DXScoreRatio
		}
		return songs[left].DXScore > songs[right].DXScore
	})
}

type lxnsSongMetadata struct {
	Difficulties struct {
		DX       []lxnsDifficulty `json:"dx"`
		Standard []lxnsDifficulty `json:"standard"`
	} `json:"difficulties"`
}

type lxnsDifficulty struct {
	Notes struct {
		Total int `json:"total"`
	} `json:"notes"`
}

func enrichDXRatios(ctx context.Context, songs []song) {
	tieGroups := make(map[string][]int)
	for index, item := range songs {
		key := fmt.Sprintf("%d:%.6f", item.Rating, item.Achievements)
		tieGroups[key] = append(tieGroups[key], index)
	}
	for _, indices := range tieGroups {
		if len(indices) < 2 {
			continue
		}
		for _, index := range indices {
			if ratio, err := fetchDXScoreRatio(ctx, songs[index]); err == nil {
				songs[index].DXScoreRatio = ratio
			}
		}
	}
}

func fetchDXScoreRatio(ctx context.Context, item song) (float64, error) {
	songID := item.ID
	if songID >= 10000 && songID < 100000 {
		songID %= 10000
	}
	url := fmt.Sprintf("https://maimai.lxns.net/api/v0/maimai/song/%d", songID)
	request, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return 0, err
	}
	request.Header.Set("User-Agent", "maimai-lab-go/0.1")
	response, err := (&http.Client{Timeout: 10 * time.Second}).Do(request)
	if err != nil {
		return 0, err
	}
	defer response.Body.Close()
	if response.StatusCode != http.StatusOK {
		return 0, fmt.Errorf("LXNS song metadata returned %s", response.Status)
	}
	var metadata lxnsSongMetadata
	if err := json.NewDecoder(io.LimitReader(response.Body, 1<<20)).Decode(&metadata); err != nil {
		return 0, err
	}
	difficulties := metadata.Difficulties.Standard
	if strings.EqualFold(item.Type, "DX") {
		difficulties = metadata.Difficulties.DX
	}
	if item.LevelIndex < 0 || item.LevelIndex >= len(difficulties) {
		return 0, fmt.Errorf("difficulty index %d is unavailable", item.LevelIndex)
	}
	maxDXScore := difficulties[item.LevelIndex].Notes.Total * 3
	if maxDXScore <= 0 {
		return 0, fmt.Errorf("DX score maximum is unavailable")
	}
	return float64(item.DXScore) / float64(maxDXScore), nil
}

func loadFaces(fontDir string) (*palette, error) {
	bodyPath := filepath.Join(fontDir, "HanYi.ttf")
	displayPath := filepath.Join(fontDir, "HanYi.ttf")
	if _, err := os.Stat(bodyPath); err != nil {
		return nil, fmt.Errorf("find body font: %w", err)
	}
	if _, err := os.Stat(displayPath); err != nil {
		return nil, fmt.Errorf("find display font: %w", err)
	}
	return &palette{bodyPath: bodyPath, displayPath: displayPath}, nil
}

func (p *palette) body(size float64) font.Face {
	return p.load(p.bodyPath, size)
}

func (p *palette) display(size float64) font.Face {
	return p.load(p.displayPath, size)
}

func (p *palette) load(path string, size float64) font.Face {
	key := fmt.Sprintf("%s:%.1f", path, size)
	if cached, ok := p.faces.Load(key); ok {
		return cached.(font.Face)
	}
	loaded, err := gg.LoadFontFace(path, size)
	if err != nil {
		panic(fmt.Sprintf("load font %s: %v", path, err))
	}
	p.faces.Store(key, loaded)
	return loaded
}

func renderB50(ctx context.Context, data b50Response, faces *palette) (image.Image, error) {
	ctx, cancel := context.WithTimeout(ctx, 75*time.Second)
	defer cancel()
	songs := make([]cardSong, 0, 50)
	for _, item := range data.Charts.SD {
		songs = append(songs, cardSong{song: item, Group: "B35"})
	}
	for _, item := range data.Charts.DX {
		songs = append(songs, cardSong{song: item, Group: "B15"})
	}
	covers := downloadCovers(ctx, songs)
	// Decoded CDN images are immediately reduced to card resolution. Collecting
	// the short-lived 400px source buffers here keeps long-lived bot memory tied
	// to the final output, not to 50 original jackets.
	runtime.GC()

	canvas := gg.NewContext(canvasWidth, canvasHeight)
	drawBackground(canvas)
	drawHeader(canvas, data, faces)
	drawSectionPanel(canvas, faces, b35PanelY, b35PanelHeight, "BEST 35", "STANDARD SCORE", 35, totalRating(data.Charts.SD), rgba("#3ca9da"))
	drawSectionPanel(canvas, faces, b15PanelY, b15PanelHeight, "BEST 15", "DELUXE SCORE", 15, totalRating(data.Charts.DX), rgba("#e657a3"))
	for index, item := range songs {
		drawCard(canvas, item, covers[index], index, index == 0, faces)
	}
	canvas.SetFontFace(faces.display(15))
	canvas.SetColor(rgba("#315383"))
	canvas.DrawStringAnchored("Go renderer  ·  LXNS jacket art only  ·  live B50 data", canvasWidth/2, canvasHeight-34, 0.5, 0.5)
	return canvas.Image(), nil
}

func downloadCovers(ctx context.Context, songs []cardSong) []image.Image {
	covers := make([]image.Image, len(songs))
	jobs := make(chan int)
	var workers sync.WaitGroup
	for range 8 {
		workers.Add(1)
		go func() {
			defer workers.Done()
			for index := range jobs {
				covers[index] = fetchCover(ctx, songs[index].ID)
			}
		}()
	}
	for index := range songs {
		jobs <- index
	}
	close(jobs)
	workers.Wait()
	return covers
}

func fetchCover(ctx context.Context, songID int) image.Image {
	url := fmt.Sprintf("https://assets.lxns.net/maimai/jacket/%d.png?source=maimai-lab", songID%10000)
	if image := fetchCoverNative(ctx, url); image != nil {
		return image
	}

	// Tencent COS serves a browser-verification page to this host's Go TLS
	// fingerprint, while the same LXNS CDN URL returns the image to curl. This
	// compatibility fallback is only exercised on cold cache misses; the bot's
	// next step stores verified PNGs on disk and does not spawn curl per request.
	command := exec.CommandContext(ctx, "curl", "-sS", "-L", "--connect-timeout", "8", "--max-time", "15", url)
	responseBody, err := command.Output()
	if err != nil {
		return nil
	}
	decoded, _, err := image.Decode(bytes.NewReader(responseBody))
	if err != nil {
		return nil
	}
	return thumbnail(decoded, 168)
}

func fetchCoverNative(ctx context.Context, url string) image.Image {
	request, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil
	}
	request.Header.Set("User-Agent", "curl/8.0 (compatible; maimai-lab-go/0.1)")
	response, err := (&http.Client{Timeout: 15 * time.Second}).Do(request)
	if err != nil || response == nil {
		return nil
	}
	defer response.Body.Close()
	if response.StatusCode != http.StatusOK || !strings.HasPrefix(response.Header.Get("Content-Type"), "image/") {
		return nil
	}
	decoded, _, err := image.Decode(io.LimitReader(response.Body, 8<<20))
	if err != nil {
		return nil
	}
	return thumbnail(decoded, 168)
}

func drawBackground(ctx *gg.Context) {
	for y := 0; y < canvasHeight; y++ {
		t := float64(y) / canvasHeight
		// maimai DX's official pages use an airy cyan-to-pink stage rather
		// than a dark dashboard.  Keeping the gradient low contrast makes the
		// fifty jacket artworks remain the visual focus.
		ctx.SetColor(mix(rgba("#86e0f3"), rgba("#f6b3e1"), t))
		ctx.DrawRectangle(0, float64(y), canvasWidth, 1)
		ctx.Fill()
	}
	ctx.SetColor(color.NRGBA{255, 255, 255, 65})
	ctx.DrawCircle(160, 610, 310)
	ctx.Fill()
	ctx.SetColor(color.NRGBA{255, 255, 255, 52})
	ctx.DrawCircle(canvasWidth-180, 410, 360)
	ctx.Fill()
	ctx.SetColor(color.NRGBA{83, 135, 223, 26})
	ctx.DrawCircle(canvasWidth-240, 1960, 500)
	ctx.Fill()
}

func drawHeader(ctx *gg.Context, data b50Response, faces *palette) {
	// Official site reference: a large white rounded panel, a pink tab and a
	// compact purple drop shadow.  The logo is deliberately text-only so no
	// non-LXNS remote visual asset is introduced.
	drawPanel(ctx, panelX, 32, panelWidth, 248, 34, rgba("#9d77bb"))
	ctx.SetColor(rgba("#e653a4"))
	ctx.DrawRoundedRectangle(float64(canvasWidth)/2-294, 269, 588, 13, 7)
	ctx.Fill()

	// Three equal-height areas make the very wide header feel intentional:
	// player identity, B50 context, and the one headline metric.
	ctx.SetColor(rgba("#edf8fc"))
	ctx.DrawRoundedRectangle(72, 62, 440, 158, 24)
	ctx.Fill()
	ctx.SetColor(rgba("#3ca9da"))
	ctx.DrawRoundedRectangle(72, 62, 8, 158, 4)
	ctx.Fill()
	ctx.SetColor(rgba("#f3eefb"))
	ctx.DrawRoundedRectangle(540, 62, 640, 158, 24)
	ctx.Fill()
	ctx.SetColor(rgba("#e45c61"))
	ctx.DrawCircle(105, 91, 12)
	ctx.Fill()
	ctx.SetColor(rgba("#62bee5"))
	ctx.DrawCircle(134, 91, 12)
	ctx.Fill()
	ctx.SetFontFace(faces.display(17))
	ctx.SetColor(rgba("#173c76"))
	ctx.DrawString("maimai DX", 160, 96)
	ctx.SetColor(rgba("#173c76"))
	drawFittedBody(ctx, faces, data.Nickname, 104, 168, 370, 62, 40)
	plate := data.Plate
	if plate == "" {
		plate = "Diving-Fish"
	}
	ctx.SetColor(rgba("#6b7da2"))
	drawFittedBody(ctx, faces, fmt.Sprintf("%s  ·  Diving-Fish", plate), 104, 202, 370, 19, 14)

	ctx.SetFontFace(faces.body(78))
	ctx.SetColor(rgba("#173c76"))
	ctx.DrawStringAnchored("BEST 50", 860, 132, 0.5, 0.5)
	ctx.SetColor(rgba("#3ca9da"))
	ctx.DrawRoundedRectangle(650, 177, 168, 9, 4)
	ctx.Fill()
	ctx.SetColor(rgba("#e657a3"))
	ctx.DrawRoundedRectangle(836, 177, 94, 9, 4)
	ctx.Fill()

	ratingX := float64(1208)
	ctx.SetColor(rgba("#fff0bd"))
	ctx.DrawRoundedRectangle(ratingX, 62, 1068, 158, 26)
	ctx.Fill()
	ctx.SetColor(rgba("#e45c61"))
	ctx.DrawRoundedRectangle(ratingX, 62, 9, 158, 5)
	ctx.Fill()
	ctx.SetFontFace(faces.display(17))
	ctx.SetColor(rgba("#a55355"))
	ctx.DrawString("RATING", ratingX+42, 104)
	ctx.SetColor(rgba("#c7393d"))
	drawFittedBody(ctx, faces, comma(data.Rating), ratingX+40, 181, 500, 76, 46)
	ctx.SetFontFace(faces.display(15))
	ctx.SetColor(rgba("#a55355"))
	ctx.DrawString("LIVE RECORD", ratingX+42, 207)
	ctx.SetColor(color.NRGBA{229, 92, 97, 64})
	ctx.DrawCircle(ratingX+810, 106, 34)
	ctx.Fill()
	ctx.SetColor(color.NRGBA{98, 190, 229, 70})
	ctx.DrawCircle(ratingX+892, 158, 53)
	ctx.Fill()
	ctx.SetColor(color.NRGBA{230, 87, 163, 58})
	ctx.DrawCircle(ratingX+978, 105, 25)
	ctx.Fill()
}

func drawCard(ctx *gg.Context, item cardSong, cover image.Image, index int, featured bool, faces *palette) {
	localIndex := index
	sectionY := b35PanelY
	if item.Group == "B15" {
		localIndex -= 35
		sectionY = b15PanelY
	}
	row, column := localIndex/cardsPerRow, localIndex%cardsPerRow
	x := float64(margin + column*(cardWidth+gap))
	y := float64(sectionY + sectionHeaderHeight + gridTopPadding + row*(cardHeight+rowGap))
	drawCardAt(ctx, item, cover, localIndex+1, x, y, cardWidth, featured, faces)
}

func drawCardAt(ctx *gg.Context, item cardSong, cover image.Image, order int, x, y, width float64, featured bool, faces *palette) {
	groupAccent := rgba("#3ca9da")
	if item.Group == "B15" {
		groupAccent = rgba("#e657a3")
	}

	drawPanel(ctx, x, y, width, cardHeight, 20, rgba("#a47dbd"))
	if featured {
		ctx.SetColor(groupAccent)
		ctx.SetLineWidth(3)
		ctx.DrawRoundedRectangle(x+2, y+2, width-4, cardHeight-4, 18)
		ctx.Stroke()
	}

	coverX, coverY, coverSize := x+16, y+18, float64(132)
	if cover != nil {
		drawRoundedImage(ctx, cover, coverX, coverY, coverSize, 16, groupAccent)
	} else {
		ctx.SetColor(rgba("#e4f4fb"))
		ctx.DrawRoundedRectangle(coverX, coverY, coverSize, coverSize, 16)
		ctx.Fill()
		ctx.SetFontFace(faces.display(42))
		ctx.SetColor(groupAccent)
		ctx.DrawStringAnchored("♪", coverX+coverSize/2, coverY+coverSize/2, 0.5, 0.5)
	}
	ctx.SetColor(groupAccent)
	ctx.DrawCircle(coverX+18, coverY+18, 17)
	ctx.Fill()
	ctx.SetFontFace(faces.display(13))
	ctx.SetColor(rgba("#ffffff"))
	ctx.DrawStringAnchored(fmt.Sprintf("%02d", order), coverX+18, coverY+18, 0.5, 0.5)
	metaX, metaWidth := x+8, float64(148)
	ctx.SetColor(pale(groupAccent, 0.82))
	ctx.DrawRoundedRectangle(metaX, y+156, metaWidth, 28, 11)
	ctx.Fill()
	ctx.SetFontFace(faces.display(14))
	ctx.SetColor(rgba("#315383"))
	ctx.DrawStringAnchored(trim(ctx, chartMeta(item), metaWidth-12), metaX+metaWidth/2, y+170, 0.5, 0.5)

	contentX := x + 158
	contentWidth := width - 172
	ctx.SetColor(pale(groupAccent, 0.88))
	ctx.DrawRoundedRectangle(contentX, y+14, contentWidth, 116, 16)
	ctx.Fill()
	ctx.SetColor(groupAccent)
	ctx.DrawRoundedRectangle(contentX+14, y+14, contentWidth-28, 5, 3)
	ctx.Fill()
	ctx.SetColor(rgba("#173c76"))
	drawFittedTitle(ctx, faces, item.Title, contentX+14, y+49, contentWidth-28)
	ctx.SetFontFace(faces.display(14))
	ctx.SetColor(rgba("#5b7198"))
	ctx.DrawString("ACHIEVEMENT", contentX+14, y+75)
	ctx.SetFontFace(faces.body(32))
	ctx.SetColor(rgba("#173c76"))
	ctx.DrawString(fmt.Sprintf("%.4f%%", item.Achievements), contentX+14, y+112)

	footerY := y + 134
	footerHeight := float64(48)
	ctx.SetColor(pale(groupAccent, 0.80))
	ctx.DrawRoundedRectangle(contentX, footerY, contentWidth, footerHeight, 14)
	ctx.Fill()
	metricStart := contentX + 7
	metricAvailable := contentWidth - 14
	rankWidth := metricAvailable * 0.32
	raWidth := metricAvailable * 0.27
	flagsWidth := metricAvailable - rankWidth - raWidth
	metricCenterY := footerY + footerHeight/2
	ctx.SetColor(color.NRGBA{groupAccent.R, groupAccent.G, groupAccent.B, 100})
	ctx.SetLineWidth(1)
	ctx.DrawLine(metricStart+rankWidth, footerY+8, metricStart+rankWidth, footerY+footerHeight-8)
	ctx.Stroke()
	ctx.DrawLine(metricStart+rankWidth+raWidth, footerY+8, metricStart+rankWidth+raWidth, footerY+footerHeight-8)
	ctx.Stroke()
	ctx.SetColor(groupAccent)
	ctx.DrawRoundedRectangle(contentX+10, footerY+7, rankWidth-6, 34, 11)
	ctx.Fill()
	ctx.SetFontFace(faces.display(21))
	ctx.SetColor(rgba("#ffffff"))
	ctx.DrawStringAnchored(rateLabel(item.Rate), contentX+10+(rankWidth-6)/2, metricCenterY, 0.5, 0.5)
	ctx.SetFontFace(faces.display(16))
	ctx.SetColor(rgba("#315383"))
	ctx.DrawStringAnchored(fmt.Sprintf("RA %d", item.Rating), metricStart+rankWidth+raWidth/2, metricCenterY, 0.5, 0.5)
	flags := strings.TrimSpace(strings.ToUpper(strings.Join(compact(item.FC, item.FS), " ")))
	if flags == "" {
		flags = "—"
	}
	ctx.SetFontFace(faces.display(15))
	ctx.SetColor(rgba("#5b7198"))
	ctx.DrawStringAnchored(trim(ctx, flags, flagsWidth-10), metricStart+rankWidth+raWidth+flagsWidth/2, metricCenterY, 0.5, 0.5)
}

func chartMeta(item cardSong) string {
	return fmt.Sprintf("%s · %.1f", item.Type, item.Difficulty)
}

func drawFittedTitle(ctx *gg.Context, faces *palette, title string, x, y, maxWidth float64) {
	drawFittedBody(ctx, faces, title, x, y, maxWidth, 21, 17)
}

func drawFittedBody(ctx *gg.Context, faces *palette, value string, x, y, maxWidth, maxSize, minSize float64) {
	for size := maxSize; size >= minSize; size-- {
		ctx.SetFontFace(faces.body(size))
		if measured, _ := ctx.MeasureString(value); measured <= maxWidth {
			ctx.DrawString(value, x, y)
			return
		}
	}
	ctx.SetFontFace(faces.body(minSize))
	ctx.DrawString(trim(ctx, value, maxWidth), x, y)
}

func drawSectionPanel(ctx *gg.Context, faces *palette, y, height float64, title, subtitle string, count, rating int, accent color.NRGBA) {
	sectionX := float64(panelX)
	sectionWidth := float64(panelWidth)
	ctx.SetColor(color.NRGBA{255, 255, 255, 86})
	ctx.DrawRoundedRectangle(sectionX, y, sectionWidth, height, 28)
	ctx.Fill()
	ctx.SetColor(rgba("#ffffff"))
	ctx.DrawRoundedRectangle(sectionX, y, sectionWidth, sectionHeaderHeight, 28)
	ctx.Fill()
	ctx.SetColor(accent)
	ctx.DrawRoundedRectangle(sectionX+28, y+23, 164, 42, 19)
	ctx.Fill()
	ctx.SetFontFace(faces.display(21))
	ctx.SetColor(rgba("#ffffff"))
	ctx.DrawStringAnchored(title, sectionX+110, y+44, 0.5, 0.5)
	ctx.SetFontFace(faces.display(16))
	ctx.SetColor(rgba("#315383"))
	ctx.DrawString(subtitle, sectionX+218, y+49)
	ctx.SetColor(pale(accent, 0.76))
	statX := sectionX + sectionWidth - 520
	ctx.DrawRoundedRectangle(statX, y+18, 490, 56, 21)
	ctx.Fill()
	leftCenter := statX + 76
	middleCenter := statX + 245
	rightCenter := statX + 408
	ctx.SetFontFace(faces.display(15))
	ctx.SetColor(rgba("#315383"))
	ctx.DrawStringAnchored(fmt.Sprintf("%d SONGS", count), leftCenter, y+46, 0.5, 0.5)
	ctx.SetFontFace(faces.body(30))
	ctx.SetColor(rgba("#173c76"))
	ctx.DrawStringAnchored(comma(rating), middleCenter, y+46, 0.5, 0.5)
	ctx.SetFontFace(faces.display(14))
	ctx.SetColor(rgba("#315383"))
	ctx.DrawStringAnchored("TOTAL RATING", rightCenter, y+46, 0.5, 0.5)
}

func drawRoundedImage(ctx *gg.Context, source image.Image, x, y, size, radius float64, border color.NRGBA) {
	if source.Bounds().Dx() != int(size) || source.Bounds().Dy() != int(size) {
		source = thumbnail(source, int(size))
	}
	ctx.DrawImage(source, int(x), int(y))
	ctx.SetColor(border)
	ctx.SetLineWidth(2)
	ctx.DrawRoundedRectangle(x, y, size, size, radius)
	ctx.Stroke()
}

func drawPanel(ctx *gg.Context, x, y, width, height, radius float64, shadow color.NRGBA) {
	ctx.SetColor(shadow)
	ctx.DrawRoundedRectangle(x, y+9, width, height, radius)
	ctx.Fill()
	ctx.SetColor(rgba("#ffffff"))
	ctx.DrawRoundedRectangle(x, y, width, height, radius)
	ctx.Fill()
}

func pale(base color.NRGBA, amount float64) color.NRGBA {
	return mix(base, rgba("#ffffff"), amount)
}

func mix(left, right color.NRGBA, amount float64) color.NRGBA {
	return color.NRGBA{
		R: uint8(float64(left.R)*(1-amount) + float64(right.R)*amount),
		G: uint8(float64(left.G)*(1-amount) + float64(right.G)*amount),
		B: uint8(float64(left.B)*(1-amount) + float64(right.B)*amount),
		A: uint8(float64(left.A)*(1-amount) + float64(right.A)*amount),
	}
}

func thumbnail(source image.Image, size int) image.Image {
	result := image.NewRGBA(image.Rect(0, 0, size, size))
	draw.CatmullRom.Scale(result, result.Bounds(), source, source.Bounds(), draw.Over, nil)
	return result
}

func pngEncode(writer io.Writer, source image.Image) error {
	return png.Encode(writer, source)
}

func totalRating(songs []song) int {
	total := 0
	for _, item := range songs {
		total += item.Rating
	}
	return total
}

func rateLabel(rate string) string {
	return strings.NewReplacer("SSSP", "SSS+", "SSP", "SS+", "SP", "S+").Replace(strings.ToUpper(rate))
}

func compact(values ...string) []string {
	result := make([]string, 0, len(values))
	for _, value := range values {
		if value != "" {
			result = append(result, value)
		}
	}
	return result
}

func trim(ctx *gg.Context, value string, maxWidth float64) string {
	if width, _ := ctx.MeasureString(value); width <= maxWidth {
		return value
	}
	for len(value) > 0 {
		value = value[:len(value)-1]
		if width, _ := ctx.MeasureString(value + "…"); width <= maxWidth {
			return value + "…"
		}
	}
	return "…"
}

func comma(value int) string {
	text := fmt.Sprintf("%d", value)
	for index := len(text) - 3; index > 0; index -= 3 {
		text = text[:index] + "," + text[index:]
	}
	return text
}

func rgba(value string) color.NRGBA {
	parsed, err := strconv.ParseUint(strings.TrimPrefix(value, "#"), 16, 32)
	if err != nil {
		return color.NRGBA{}
	}
	return color.NRGBA{R: uint8(parsed >> 16), G: uint8(parsed >> 8), B: uint8(parsed), A: 255}
}

func initials(value string) string {
	value = strings.TrimSpace(value)
	if value == "" {
		return "DX"
	}
	runes := []rune(strings.ToUpper(value))
	if len(runes) > 2 {
		runes = runes[:2]
	}
	return string(runes)
}

func min(left, right int) int {
	if left < right {
		return left
	}
	return right
}

func max(left, right int) int {
	if left > right {
		return left
	}
	return right
}
