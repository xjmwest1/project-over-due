import { createProject, createTask } from './db'

export async function seedDemoProject(): Promise<void> {
  const project = await createProject('Welcome', {
    color: 'mint',
    note: 'Sample project from first launch. Delete or archive when you add your own.',
  })
  await createTask(project.id, 'Explore the projects home', 'ready')
  await createTask(project.id, 'Open the board (coming in Phase 2)', 'backlog')
  await createTask(project.id, 'Import a project from AI', 'backlog')
}
