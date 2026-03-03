import { toPng } from 'html-to-image'

export async function captureElement(
  element: HTMLElement,
  filename = 'maimai-b50.png'
): Promise<void> {
  try {
    const dataUrl = await toPng(element, {
      quality: 0.95,
      pixelRatio: 2,
      cacheBust: true,
    })
    const link = document.createElement('a')
    link.download = filename
    link.href = dataUrl
    link.click()
  } catch (error) {
    console.error('Screenshot failed:', error)
  }
}
