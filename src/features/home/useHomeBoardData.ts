import { useCallback, useEffect, useMemo, useState } from 'react'
import { getProjectMetrics, listTasksByProject } from '../../lib/db'
import { computeGlobalMetrics } from '../../lib/metrics'
import type { Project, ProjectMetrics, Task } from '../../lib/types'

export function useHomeBoardData(projects: Project[]) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [metricsByProjectId, setMetricsByProjectId] = useState<
    Map<string, ProjectMetrics>
  >(new Map())
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    setLoading(true)
    const nextMetrics = new Map<string, ProjectMetrics>()
    const nextTasks: Task[] = []
    for (const project of projects) {
      const projectTasks = await listTasksByProject(project.id)
      nextTasks.push(...projectTasks)
      nextMetrics.set(project.id, await getProjectMetrics(project.id))
    }
    setTasks(nextTasks)
    setMetricsByProjectId(nextMetrics)
    setLoading(false)
  }, [projects])

  useEffect(() => {
    void reload()
  }, [reload])

  const globalMetrics = useMemo(() => {
    const tasksByProject = new Map<string, Task[]>()
    for (const project of projects) {
      tasksByProject.set(
        project.id,
        tasks.filter((t) => t.projectId === project.id),
      )
    }
    const g = computeGlobalMetrics(projects, tasksByProject)
    const progress = g.total === 0 ? 0 : g.done / g.total
    return { ...g, progress }
  }, [projects, tasks])

  const projectsById = useMemo(
    () => new Map(projects.map((p) => [p.id, p])),
    [projects],
  )

  return {
    tasks,
    metricsByProjectId,
    globalMetrics,
    projectsById,
    loading,
    reload,
  }
}
