'use server'

import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function deleteProject(projectId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // Security: Verify user owns this project
  const { data: project } = await supabase
    .from('projects')
    .select('id, owner_id')
    .eq('id', projectId)
    .single()

  if (!project) return { error: 'Project not found.' }
  if (project.owner_id !== user.id) {
    return { error: 'You do not have permission to delete this project.' }
  }

  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId)

  if (error) return { error: error.message }

  revalidatePath('/projects')
  redirect('/projects')
}

export async function updateProjectStatus(projectId: string, status: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const VALID_STATUSES = ['ACTIVE', 'ON_HOLD', 'COMPLETED']
  if (!VALID_STATUSES.includes(status)) {
    return { error: 'Invalid status value.' }
  }

  // Security: Verify user owns this project
  const { data: project } = await supabase
    .from('projects')
    .select('id, owner_id')
    .eq('id', projectId)
    .single()

  if (!project) return { error: 'Project not found.' }
  if (project.owner_id !== user.id) {
    return { error: 'You do not have permission to update this project.' }
  }

  const { error } = await supabase
    .from('projects')
    .update({ status })
    .eq('id', projectId)

  if (error) return { error: error.message }

  revalidatePath(`/projects/${projectId}`)
  revalidatePath('/projects')
  return { success: true }
}

export async function updateTaskStatus(taskId: string, status: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const VALID_STATUSES = ['PENDING', 'IN_PROGRESS', 'REVIEW', 'COMPLETED']
  if (!VALID_STATUSES.includes(status)) {
    return { error: 'Invalid status value.' }
  }

  // Security: Only the project owner or the task assignee can update status
  const { data: task } = await supabase
    .from('tasks')
    .select('id, assignee_id, project_id, projects!project_id(owner_id)')
    .eq('id', taskId)
    .single()

  if (!task) return { error: 'Task not found.' }

  const projectOwner = (task.projects as any)?.owner_id
  const isOwner = projectOwner === user.id
  const isAssignee = task.assignee_id === user.id

  if (!isOwner && !isAssignee) {
    return { error: 'You do not have permission to update this task.' }
  }

  const { error } = await supabase
    .from('tasks')
    .update({ status })
    .eq('id', taskId)

  if (error) return { error: error.message }

  revalidatePath(`/tasks/${taskId}`)
  revalidatePath(`/projects/${task.project_id}`)
  return { success: true }
}
