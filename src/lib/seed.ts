import { createProject, createTask } from './db'

export async function seedDemoProject(): Promise<void> {
  const project = await createProject('Welcome', {
    color: 'mint',
    note: 'Sample project from first launch. Delete or archive when you add your own.',
  })
  await createTask(project.id, 'Explore the home board', 'ready')
  await createTask(project.id, 'Filter a project to add tasks', 'backlog')
  await createTask(project.id, 'Import a project from AI', 'backlog')
}
