"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ConsentSection {
  title: string;
  body: string;
}

const CONSENT_SECTIONS: ConsentSection[] = [
  {
    title: "1. Tujuan Penelitian",
    body: 'Platform ini digunakan sebagai bagian dari penelitian "CalmMind School: Pengembangan Model Digital Mindful-Autogenic Intervention untuk Meningkatkan Kesehatan Mental dan Performa Akademik Siswa SMA di Kabupaten Bone", yang dilakukan oleh Ahmad Jati Reynaldi dan Andi Muhammad Aqeel.',
  },
  {
    title: "2. Partisipasi Bersifat Sukarela",
    body: "Keterlibatan Anda bersifat sukarela tanpa paksaan dari pihak manapun. Anda memiliki hak penuh untuk menolak atau mengundurkan diri kapan saja tanpa konsekuensi apapun, dan keputusan tersebut tidak akan mempengaruhi status Anda di sekolah.",
  },
  {
    title: "3. Data yang Dikumpulkan",
    body: "Data dikumpulkan melalui pengisian kuesioner digital serta pelatihan mindfulness dan relaksasi autogenik secara rutin melalui website DMAI.",
  },
  {
    title: "4. Kemungkinan Ketidaknyamanan",
    body: "Prosedur ini dapat menyebabkan ketidaknyamanan psikologis ringan, seperti kelelahan saat mengisi kuesioner yang cukup panjang atau perasaan tidak nyaman saat introspeksi emosional selama latihan relaksasi. Penelitian ini bersifat non-invasif sehingga tidak ada risiko bahaya fisik.",
  },
  {
    title: "5. Penggunaan Data",
    body: "Anda akan diinformasikan data lain yang berhubungan dengan keadaan Anda yang mungkin ditemukan saat pengambilan data, kecuali data mentah (raw data) dari sistem yang belum diolah secara statistik. Data disimpan untuk kepentingan validasi data dan pengujian hipotesis penelitian menggunakan SPSS, guna memastikan akurasi hasil analisis secara ilmiah.",
  },
  {
    title: "6. Kerahasiaan Data",
    body: "Semua data akan disimpan oleh tim peneliti dalam bentuk berkas digital yang terenkripsi dan disimpan dalam perangkat yang aman, selama minimal 2 tahun atau hingga publikasi hasil penelitian selesai dilakukan. Semua informasi yang Anda berikan tidak akan disebarluaskan sehingga kerahasiaannya terjamin. Penelitian ini dilakukan secara online melalui website CalmMind School (DMAI), dan peneliti menggunakan metode enkripsi data untuk mencegah kebocoran data Anda.",
  },
  {
    title: "7. Jika Ditemukan Indikasi yang Memerlukan Bantuan",
    body: "Anda akan mendapatkan informasi bila ditemukan indikasi gangguan kesehatan mental yang memerlukan penanganan lebih lanjut dari tenaga profesional seperti psikolog atau konselor sekolah selama penelitian ini berlangsung.",
  },
  {
    title: "8. Tidak Ada Intervensi Medis",
    body: "Anda tidak memerlukan perawatan setelah penelitian karena tidak terdapat intervensi medis dalam penelitian ini. Penelitian ini bersifat observasional dan edukatif, serta tidak menggunakan catatan medis, hasil laboratorium, maupun data genetik Anda.",
  },
  {
    title: "9. Keuntungan Keikutsertaan",
    body: "Anda mendapatkan akses gratis ke platform digital intervensi kesehatan mental yang dapat membantu mengelola stres akademik, meningkatkan regulasi emosi, serta berpotensi meningkatkan performa akademik dan konsentrasi belajar Anda.",
  },
  {
    title: "10. Hak Anda",
    body: "Anda berhak menarik data/informasi selama penelitian berlangsung, dan akan diberikan informasi apabila terjadi pelanggaran pelaksanaan protokol penelitian ini.",
  },
];

interface ConsentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccept: () => void;
  isSubmitting?: boolean;
}

export function ConsentDialog({
  open,
  onOpenChange,
  onAccept,
  isSubmitting = false,
}: ConsentDialogProps) {
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    if (open) setAgreed(false);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Persetujuan Penggunaan Data</DialogTitle>
        </DialogHeader>

        <div className="h-fit overflow-y-auto">
          <div className="space-y-3 pr-3 xs:text-sm/4.5 text-xs/4 sm:text-justify text-muted-foreground">
            <p>
              Sebelum melanjutkan pendaftaran, mohon baca informasi berikut
              mengenai penggunaan data Anda di platform ini.
            </p>
            {CONSENT_SECTIONS.map((section) => (
              <div key={section.title}>
                <p className="font-medium text-foreground">{section.title}</p>
                <p>{section.body}</p>
              </div>
            ))}
          </div>

        </div>

        <div className="flex items-start gap-2 border-t pt-4">
          <Checkbox
            id="consent-agree"
            checked={agreed}
            onCheckedChange={(checked) => setAgreed(checked === true)}
            className="mt-0.5"
          />
          <label
            htmlFor="consent-agree"
            className={cn(
              "xs:text-sm/4.5 text-xs/4 leading-snug cursor-pointer transition-all",
              agreed && "font-semibold"
            )}
          >
            Saya telah membaca dan memahami penjelasan di atas, serta
            menyetujui data saya digunakan untuk keperluan penelitian ini.
          </label>
        </div>

        <DialogFooter className="gap-2 ">
          {/* <Button
            variant="outline"
            className="rounded-sm hover:bg-foreground/10"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Batal
          </Button> */}
          <Button
            variant="default"
            className={cn(
              "rounded-sm transition-colors",
              agreed
                ? "bg-foreground/90 hover:bg-foreground text-background disabled:bg-foreground disabled:text-background"
                : "bg-foreground/30 text-background/70 hover:bg-foreground/30"
            )}
            disabled={!agreed || isSubmitting}
            onClick={onAccept}
          >
            {isSubmitting ? "Menyiapkan akun..." : "Setuju & Daftar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}