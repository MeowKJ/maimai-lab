export function isValidNumber(str: string): boolean {
  return /^\d+$/.test(str.trim())
}
