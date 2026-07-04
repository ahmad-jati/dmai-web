'use client'

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export function MobileWarningDialog() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const isMobile = window.innerWidth < 768
    const dismissed = sessionStorage.getItem("admin-mobile-warning-dismissed")
    if (isMobile && !dismissed) {
      setOpen(true)
    }
  }, [])

  const handleClose = () => {
    sessionStorage.setItem("admin-mobile-warning-dismissed", "1")
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm!">
        <DialogHeader>
          <DialogTitle>Tampilan Terbatas</DialogTitle>
          <DialogDescription className="py-2">
            Halaman admin <span className="font-semibold text-foreground">lebih optimal diakses melalui desktop atau layar yang lebih lebar.</span> Beberapa fitur mungkin kurang nyaman diakses melalui Mobile.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            onClick={handleClose}
            size={'sm'}
            variant={'secondary'}
          >
            Mengerti
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}