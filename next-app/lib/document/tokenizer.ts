const DEFAULT_TOKEN_REGEX = /[A-Za-z0-9ÄÖÜäöüß]+/g

export interface TokenizeOptions {
  tokenRegex?: RegExp
  toLowerCase?: boolean
}

export function tokenizeText(
  text: string,
  options: TokenizeOptions = {}
): string[] {
  const { tokenRegex = DEFAULT_TOKEN_REGEX, toLowerCase = true } = options
  if (!text) {
    return []
  }

  const tokens: string[] = []
  let match: RegExpExecArray | null
  while ((match = tokenRegex.exec(text)) !== null) {
    const token = toLowerCase ? match[0].toLowerCase() : match[0]
    tokens.push(token)
  }

  return tokens
}

export function countTokens(text: string) {
  return tokenizeText(text).length
}
