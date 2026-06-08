'use client'

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Spinner } from "@/components/ui/spinner"

const MOODS = [
  { value: "sangat_baik", label: "Sangat Baik", emoji: "😄" },
  { value: "baik", label: "Baik", emoji: "🙂" },
  { value: "netral", label: "Netral", emoji: "😐" },
  { value: "kurang_baik", label: "Kurang Baik", emoji: "😔" },
  { value: "buruk", label: "Buruk", emoji: "😞" },
] as const

export type MoodValue = (typeof MOODS)[number]["value"]

type FeedbackDialogProps = {
  open: boolean
  sessionSlug: string
  sessionName: string
  userId: string
  onClose: () => void
  onSkip: () => void
}

export function FeedbackDialog({
  open,
  sessionSlug,
  sessionName,
  userId,
  onClose,
  onSkip,
}: FeedbackDialogProps) {
  const [selectedMood, setSelectedMood] = useState<MoodValue | null>(null)
  const [note, setNote] = useState("")
  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    if (!selectedMood) return
    setSaving(true)

    const supabase = createClient()
    const { error } = await supabase.from("session_feedback").insert({
      user_id: userId,
      session_slug: sessionSlug,
      session_name: sessionName,
      mood: selectedMood,
      note: note.trim() || null,
    })

    if (error) {
      toast.error("Gagal menyimpan feedback", { description: error.message })
    } else {
      toast.success("Terima kasih!", { description: "Feedback kamu telah tersimpan." })
      onClose()
    }
    setSaving(false)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onSkip() }}>
      <DialogContent
        className="max-w-md"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Bagaimana perasaanmu?</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Setelah menyelesaikan <span className="font-medium text-foreground">{sessionName}</span>
          </p>
        </DialogHeader>

        {/* Mood Selector */}
        <div className="flex justify-between gap-2 py-2">
          {MOODS.map((mood) => (
            <button
              key={mood.value}
              onClick={() => setSelectedMood(mood.value)}
              className={`flex flex-col items-center gap-1.5 flex-1 py-3 px-1 rounded-xl border-2 transition-all
                ${selectedMood === mood.value
                  ? "border-foreground bg-foreground/5 scale-105"
                  : "border-border hover:border-muted-foreground/40 hover:bg-muted/30"
                }`}
            >
              <span className="text-2xl">{mood.emoji}</span>
              <span className="text-xs font-medium text-center leading-tight">{mood.label}</span>
            </button>
          ))}
        </div>

        {/* Optional note */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">
            Catatan <span className="text-muted-foreground font-normal">(opsional)</span>
          </label>
          <Textarea
            placeholder="Ada yang ingin kamu bagikan? Tuliskan di sini..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            className="resize-none text-sm"
            maxLength={500}
          />
          <p className="text-xs text-muted-foreground text-right">{note.length}/500</p>
        </div>

        <DialogFooter className="flex gap-2 sm:flex-row">
          <Button
            variant="ghost"
            onClick={onSkip}
            className="flex-1 text-muted-foreground hover:text-foreground"
          >
            Lewati
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedMood || saving}
            className="flex-1 bg-foreground text-background hover:bg-foreground/90 disabled:opacity-40"
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <Spinner className="shrink-0 text-background w-4 h-4" />
                Menyimpan...
              </span>
            ) : (
              "Kirim Feedback"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}