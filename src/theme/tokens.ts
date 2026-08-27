export const colorTokens = {
  inkBlack: "#1a1a1a",
  ricePaperWhite: "#f5f0e6",
  vermillion: "#c8102e",
  imperialGold: "#d4af37",
  jade: "#00a86b",
  indigo: "#3b3b6d",
} as const;

export const typographyTokens = {
  chineseDisplay: "'Noto Serif SC', serif",
  chineseBody: "'Noto Sans SC', sans-serif",
  latinDisplay: "'Cormorant Garamond', serif",
  latinBody: "'Inter', sans-serif",
} as const;

export type ColorToken = keyof typeof colorTokens;
export type TypographyToken = keyof typeof typographyTokens;
