package main

import "testing"

func TestLayoutUsesExactFiveColumnGrid(t *testing.T) {
	if cardWidth != 432 {
		t.Fatalf("cardWidth = %d, want 432", cardWidth)
	}
	contentWidth := canvasWidth - margin*2
	gridWidth := cardsPerRow*cardWidth + (cardsPerRow-1)*gap
	if gridWidth != contentWidth {
		t.Fatalf("grid width = %d, content width = %d", gridWidth, contentWidth)
	}
	if 35/cardsPerRow != b35Rows || 15/cardsPerRow != b15Rows {
		t.Fatalf("section rows do not match exact five-column song counts")
	}
	if panelX != 48 || panelWidth != 2304 {
		t.Fatalf("panel geometry = x:%d width:%d, want x:48 width:2304", panelX, panelWidth)
	}
}

func TestSectionGeometryFitsCanvas(t *testing.T) {
	if b35PanelHeight != 1624 {
		t.Fatalf("B35 height = %d, want 1624", b35PanelHeight)
	}
	if b15PanelY != 1952 || b15PanelHeight != 768 {
		t.Fatalf("B15 geometry = y:%d height:%d, want y:1952 height:768", b15PanelY, b15PanelHeight)
	}
	if canvasHeight-(b15PanelY+b15PanelHeight) != 80 {
		t.Fatalf("bottom reserve = %d, want 80", canvasHeight-(b15PanelY+b15PanelHeight))
	}
}

func TestSortSongsUsesRatingAchievementThenDXRatio(t *testing.T) {
	songs := []song{
		{Title: "lower rating", Rating: 320, Achievements: 101, DXScoreRatio: 1},
		{Title: "lower achievement", Rating: 321, Achievements: 100.5, DXScoreRatio: 1},
		{Title: "lower dx ratio", Rating: 321, Achievements: 100.6, DXScoreRatio: 0.95},
		{Title: "winner", Rating: 321, Achievements: 100.6, DXScoreRatio: 0.99},
	}
	sortSongs(songs)
	want := []string{"winner", "lower dx ratio", "lower achievement", "lower rating"}
	for index, title := range want {
		if songs[index].Title != title {
			t.Fatalf("position %d = %q, want %q", index, songs[index].Title, title)
		}
	}
}

func TestChartMetaIncludesConstant(t *testing.T) {
	item := cardSong{song: song{Level: "14+", Type: "DX", Difficulty: 14.8}}
	if got, want := chartMeta(item), "DX · 14.8"; got != want {
		t.Fatalf("chartMeta() = %q, want %q", got, want)
	}
}
