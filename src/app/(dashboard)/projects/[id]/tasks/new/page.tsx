import { createClient } from '@/lib/supabase-server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, ClipboardList } from 'lucide-react'
import { NewTaskForm } from '@/components/features/new-task-form'

export default async function NewTaskPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Verify project exists and user is owner
  const { data: project } = await supabase
    .from('projects')
    .select('id, name, owner_id')
    .eq('id', id)
    .single()

  if (!project || project.owner_id !== user.id) notFound()

  // Fetch subcontractors / team for assignment
  const { data: members } = await supabase
    .from('project_members')
    .select('user_id, users(id, name, email)')
    .eq('project_id', id)

  const assignees = (members ?? []).map((m) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const u = (m.users as any) as { id: string; name?: string; email?: string } | null
    return { id: m.user_id, label: u?.name ?? u?.email ?? m.user_id }
  })

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <Link
        href={`/projects/${id}`}
        className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to {project.name}
      </Link>

      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
          <ClipboardList className="w-5 h-5 text-orange-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Add Task</h1>
          <p className="text-zinc-400 text-sm">Create a task under {project.name}</p>
        </div>
      </div>

      <NewTaskForm projectId={id} assignees={assignees} />
    </div>
  )
}
