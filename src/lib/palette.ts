/** Tin color swatches for the "no photo" case — all drawn from the brand palette. */
export const TIN_COLORS = [
  '#6B8E23', // matcha
  '#556B2F', // olive
  '#283D2E', // ink
  '#8BA863', // sage
  '#A7C7A1', // matcha-light
  '#C9D9B8', // pale leaf
  '#4A7043', // forest
  '#EADFC8', // tan
] as const

export const DEFAULT_TIN_COLOR = TIN_COLORS[0]

/** Picks a readable foreground (cream vs ink) for a given tin color. */
export function tinForeground(hex: string): string {
  const c = hex.replace('#', '')
  const r = parseInt(c.slice(0, 2), 16)
  const g = parseInt(c.slice(2, 4), 16)
  const b = parseInt(c.slice(4, 6), 16)
  // Perceived luminance; light tins get ink text/icons, dark tins get cream.
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.62 ? '#283D2E' : '#F4F1E9'
}
