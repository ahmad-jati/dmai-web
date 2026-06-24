'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Spinner } from '@/components/ui/spinner'
import { TrashIcon } from '@phosphor-icons/react'
import { SessionStep } from './types'

interface DeleteStepDialogProps {
  step: SessionStep | null
  open: boolean
  remainingSteps: SessionStep[]
  onDeleted: (id: string, renumbered: { id: string; step_number: number }[]) => void
  onClose: () => void
}

export function DeleteStepDialog({
  step,
  open,
  remainingSteps,
  onDeleted,
  onClose,
}: DeleteStepDialogProps) {
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!step) return
    setDeleting(true)
    const supabase = createClient()

    const { error } = await supabase.from('session_steps').delete().eq('id', step.id)

    if (error) {
      const hint =
        error.code === '42501'
          ? 'Pastikan RLS policy admin sudah diterapkan di Supabase'
          : error.message
      toast.error('Gagal menghapus step', { description: hint })
      setDeleting(false)
      return
    }

    const siblings = remainingSteps
      .filter((s) => s.id !== step.id)
      .sort((a, b) => a.step_number - b.step_number)

    const renumbered: { id: string; step_number: number }[] = []
    for (let i = 0; i < siblings.length; i++) {
      const newNum = i + 1
      if (siblings[i].step_number !== newNum) {
        await supabase
          .from('session_steps')
          .update({ step_number: newNum })
          .eq('id', siblings[i].id)
      }
      renumbered.push({ id: siblings[i].id, step_number: newNum })
    }

    toast.success('Step dihapus')
    onDeleted(step.id, renumbered)
    setDeleting(false)
  }

  if (!step) return null

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Hapus Step {step.step_number}?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Step{' '}
          <span className="font-medium text-foreground">{step.title}</span> akan dihapus secara
          permanen. Tindakan ini tidak dapat dibatalkan.
        </p>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} className="rounded-sm text-sm">
            Batal
          </Button>
          <Button
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-sm gap-2 text-sm [&_svg]:size-4 bg-destructive text-white hover:bg-destructive/90"
          >
            {deleting ? (
              <Spinner className="shrink-0 text-white" />
            ) : (
              <TrashIcon className="w-4 h-4" />
            )}
            {deleting ? 'Menghapus...' : 'Ya, Hapus'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
