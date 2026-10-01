import { z } from 'zod'
import { PROJECT_COLORS, TASK_STATUSES } from './types'

const linkSchema = z.object({
  url: z.string().min(1).max(2048),
  label: z.string().max(120).optional(),
})

const bundleTaskSchema = z.object({
  title: z.string().trim().min(1).max(280),
  status: z.enum(TASK_STATUSES).optional(),
  note: z.string().max(2000).optional(),
  links: z.array(linkSchema).max(20).optional(),
})

const bundleProjectSchema = z.object({
  name: z.string().trim().min(1).max(120),
  color: z.enum(PROJECT_COLORS).optional(),
  note: z.string().max(2000).optional(),
})

export const projectBundleV1Schema = z.object({
  version: z.literal(1),
  project: bundleProjectSchema,
  tasks: z.array(bundleTaskSchema).min(1).max(200),
})

export type ProjectBundleV1 = z.infer<typeof projectBundleV1Schema>
export type BundleTaskV1 = ProjectBundleV1['tasks'][number]
