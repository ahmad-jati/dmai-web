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
  { value: "buruk", label: "Buruk", emoji: "😞" },
  { value: "kurang_baik", label: "Kurang Baik", emoji: "😔" },
  { value: "netral", label: "Netral", emoji: "😐" },
  { value: "baik", label: "Baik", emoji: "🙂" },
  { value: "sangat_baik", label: "Sangat Baik", emoji: "😄" },
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
        className="sm:max-w-md xs:max-w-sm dark:bg-background"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="sm:text-h2/7 xs:text-xl/5.5 text-base/5 font-semibold sm:pt-0 xs:pt-2 pt-4">Bagaimana perasaanmu?</DialogTitle>
          <p className="xs:text-p/5 text-xs/4 text-muted-foreground font-medium">
            Setelah menyelesaikan <span className="font-semibold text-foreground">{sessionName}</span>
          </p>
        </DialogHeader>

        {/* Mood Selector */}
        <div className="grid xs:grid-cols-5 grid-cols-3 gap-2 py-2">
          {MOODS.map((mood) => (
            <Button
              key={mood.value}
              onClick={() => setSelectedMood(mood.value)}
              variant={'default'}
              size={'sm'}
              className={`flex flex-col items-center md:gap-1.5 gap-0 flex-1 py-3 px-1 md:rounded-xl rounded-md border-2 transition-all h-full w-full
                ${selectedMood === mood.value
                  ? "border-foreground bg-foreground/5 shadow-sm dark:bg-foreground text-foreground dark:text-background hover:bg-muted/50"
                  : "border-border hover:border-muted-foreground/40 hover:bg-muted/50 hover:dark:bg-accent/70  dark:bg-accent/20 hover:dark:border-foreground/40 text-foreground"
                }`}
            >
              <span className="md:text-2xl xs:text-lg text-sm">{mood.emoji}</span>
              <span className="xs:text-xs text-2xs font-medium text-center text-pretty">{mood.label}</span>
            </Button>
          ))}
        </div>

      {/* Optional note */}
        <div className="flex flex-col gap-1.5">
          <label className="xs:text-p/5 text-sm/4 font-medium">
            Catatan <span className="text-muted-foreground">(opsional)</span>
          </label>
          <Textarea
            placeholder="Ada yang ingin kamu bagikan? Tuliskan di sini..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            className="resize-none text-sm h-18 overflow-y-auto"
            maxLength={250}
          />
          <p className="text-xs text-muted-foreground text-right">{note.length}/250</p>
        </div>

        <DialogFooter className="flex gap-2 sm:flex-row">
          <Button
            variant="ghost"
            onClick={onSkip}
            className="flex-1 text-muted-foreground hover:text-foreground hover:dark:bg-transparent"
          >
            Lewati
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedMood || saving}
            className="flex-1 disabled:text-foreground bg-background dark:bg-primary hover:bg-celeste hover:dark:bg-primary/80"
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <Spinner className="shrink-0 text-foreground w-4 h-4" />
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