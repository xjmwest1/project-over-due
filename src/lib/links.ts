import type { Link } from './types'

const HTTPS_URL = /^https:\/\/.+/i

export function normalizeLinks(links: Link[] | undefined): Link[] {
  if (!links?.length) return []
  return links.map((link) => ({
    url: link.url.trim(),
    label: link.label?.trim() || undefined,
  }))
}

export function assertValidLinks(links: Link[]): void {
  for (const link of links) {
    if (!HTTPS_URL.test(link.url)) {
      throw new Error(`Link must use https: ${link.url}`)
    }
  }
}
