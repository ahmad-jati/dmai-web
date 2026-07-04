'use client'

import { useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ImageIcon, SpeakerHighIcon } from '@phosphor-icons/react'
import Image from 'next/image'
import { SessionStep, StepType, STEP_TYPE_LABELS } from './types'

interface StepFormFieldsProps {
  form: SessionStep
  setForm: React.Dispatch<React.SetStateAction<SessionStep>>
  imagePreview: string
  imageFile: File | null
  audioFile: File | null
  imageRef: React.RefObject<HTMLInputElement>
  audioRef: React.RefObject<HTMLInputElement>
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onAudioChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export function StepFormFields({
  form,
  setForm,
  imagePreview,
  imageFile,
  audioFile,
  imageRef,
  audioRef,
  onImageChange,
  onAudioChange,
}: StepFormFieldsProps) {
  return (
    <div className="flex flex-col gap-4 py-2">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="step-type">Tipe Step</Label>
        <Select
          value={form.step_type}
          onValueChange={(val) => setForm((f) => ({ ...f, step_type: val as StepType }))}
        >
          <SelectTrigger id="step-type" className="rounded-sm">
            <SelectValue placeholder="Pilih tipe step" />
          </SelectTrigger>
          <SelectContent>
            {(Object.entries(STEP_TYPE_LABELS) as [StepType, string][]).map(([val, label]) => (
              <SelectItem key={val} value={val}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="step-title">Nama Step</Label>
        <Input
          id="step-title"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="step-desc">Instruksi / Deskripsi</Label>
        <Textarea
          id="step-desc"
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          rows={4}
          className="resize-none"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="step-duration">Durasi (detik)</Label>
        <Input
          id="step-duration"
          type="number"
          value={form.duration_seconds}
          onChange={(e) => setForm((f) => ({ ...f, duration_seconds: Number(e.target.value) }))}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Gambar</Label>
        <div className="flex items-center gap-4">
          {imagePreview && (
            <Image
              src={imagePreview}
              alt="preview"
              width={60}
              height={60}
              className="w-20 h-20 object-cover border border-border rounded-sm shrink-0 bg-muted-foreground/10"
              unoptimized
            />
          )}
          <div className="flex flex-col gap-1.5">
            <p className="text-xs text-muted-foreground truncate max-w-48">
              {imageFile?.name ?? (imagePreview ? 'File saat ini' : 'Belum ada gambar')}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => imageRef.current?.click()}
              className="w-fit rounded-sm gap-2 [&_svg]:size-4 bg-background hover:bg-lemon text-foreground"
            >
              <ImageIcon className="w-4 h-4" />
              {imagePreview ? 'Ganti Gambar' : 'Upload Gambar'}
            </Button>
            <input ref={imageRef} type="file" accept="image/*" className="hidden" onChange={onImageChange} />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Audio Narasi</Label>
        {form.audio_url && !audioFile && (
          <audio controls src={form.audio_url} className="w-full h-10" />
        )}
        {audioFile && (
          <p className="text-xs text-muted-foreground">File baru: {audioFile.name}</p>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => audioRef.current?.click()}
          className="w-fit rounded-sm gap-2 [&_svg]:size-3.5 bg-background hover:bg-lemon text-foreground"
        >
          <SpeakerHighIcon className="w-4 h-4" />
          {form.audio_url ? 'Ganti Audio' : 'Upload Audio'}
        </Button>
        <input ref={audioRef} type="file" accept="audio/*" className="hidden" onChange={onAudioChange} />
      </div>
    </div>
  )
}
