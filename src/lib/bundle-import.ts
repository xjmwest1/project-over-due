import { z } from 'zod'
import { assertValidLinks, normalizeLinks } from './links'
import {
  projectBundleV1Schema,
  type ProjectBundleV1,
} from './bundle-schema'

export type { ProjectBundleV1 }

function stripMarkdownFences(raw: string): string {
  let text = raw.trim().replace(/^\uFEFF/, '')
  const fenced = text.match(/^```(?:json)?\s*\r?\n?([\s\S]*?)\r?\n?```\s*$/i)
  if (fenced) text = fenced[1].trim()
  return text
}

function formatZodError(error: z.ZodError): string {
  const first = error.issues[0]
  if (!first) return 'Invalid bundle JSON.'
  const path = first.path.length ? first.path.join('.') : 'root'
  return `${path}: ${first.message}`
}

export function parseProjectBundleJson(raw: string): ProjectBundleV1 {
  const trimmed = stripMarkdownFences(raw)
  if (!trimmed) throw new Error('Paste JSON from your AI assistant.')
  let parsed: unknown
  try {
    parsed = JSON.parse(trimmed)
  } catch {
    throw new Error('Could not parse JSON — check for typos or extra text.')
  }

  const result = projectBundleV1Schema.safeParse(parsed)
  if (!result.success) {
    const versionIssue = result.error.issues.find((i) => i.path[0] === 'version')
    if (versionIssue) {
      throw new Error('Unsupported bundle version — copy the prompt again from the app.')
    }
    throw new Error(formatZodError(result.error))
  }

  const bundle = result.data
  for (const task of bundle.tasks) {
    const links = normalizeLinks(task.links)
    assertValidLinks(links)
  }

  return {
    ...bundle,
    tasks: bundle.tasks.map((t) => ({
      ...t,
      status: t.status ?? 'backlog',
      links: normalizeLinks(t.links),
    })),
  }
}
