import Image from "next/image"
import Link from "next/link"
import { Section } from "@/components/layout/section-wrapper"
import { Button } from "@/components/ui/button"

export default function AboutContent() {
  return (
    <div className="w-full">
      <Section className="bg-tangerine dark:bg-celeste w-full flex flex-col items-start gap-8">

        <div className="text-center w-full lg:hidden flex flex-col items-center gap-2">
          <span className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">
            Tentang Kami
          </span>
          <h1 className="font-bold sm:text-4xl text-3xl">DMAI</h1>
          <p className="text-muted-foreground font-medium sm:text-xl/5.5 text-base/4 xs:mt-0 -mt-1">
            Digital Mindful Autogenic Intervention
          </p>
        </div>

        <div className="relative w-full sm:h-94 xs:h-74 h-[30dvh] md:rounded-2xl rounded-xl overflow-hidden shadow-md bg-muted">
          <Image
            src={'/lummi/outdoor.png'}
            alt="Outdoor together drawing from Lummi"
            fill
            className="object-cover"
          />

          <div className="absolute inset-x-4 bottom-4 flex justify-center sm:justify-end sm:inset-x-6">
            <p className="text-foreground/60 text-center font-medium -my-4 sm:text-sm/4 text-xs/3 group hover:cursor-pointer">
              Whimsical Outdoor Scene from
              <Link
                href={'https://www.lummi.ai/illustration/whimsical-outdoor-scene-akvmp'}
                target="_blank"
                className="pl-1 group-hover:underline underline-offset-2 group-hover:font-bold"
              >
                Steph Meade
              </Link>
            </p>
          </div>
        </div>

        <div className="flex lg:flex-row flex-col lg:gap-16 gap-8">
          <div className="text-left lg:flex hidden flex-col gap-2">
            <span className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">
              Tentang Kami
            </span>
            <h1 className="font-bold 2md:text-4xl">DMAI</h1>
            <p className="text-muted-foreground font-medium text-xl">
              Digital Mindful Autogenic Intervention
            </p>
          </div>

          <div className="flex-1 flex flex-col gap-6">
            <div>
              <h2 className="font-semibold sm:text-2xl/6 text-xl/5.5 mb-3 text-pretty">
                Kesehatan Mental, Kunci Tersembunyi di Balik Prestasi Akademik
              </h2>
              <p className="font-medium text-p/5 text-justify">
                Di tengah tingginya tuntutan akademik, menjaga kesehatan mental menjadi sama pentingnya dengan meraih prestasi. Sayangnya, tidak semua siswa punya akses ke pendampingan yang mudah, praktis, dan sesuai kebutuhan mereka. Dari sinilah lahir Digital Mindful Autogenic Intervention, platform digital yang membantu siswa SMA mengelola stres, meningkatkan ketenangan, dan mengoptimalkan performa belajar lewat latihan sederhana yang bisa diakses kapan saja.
              </p>
            </div>

            <div>
              <h2 className="font-semibold sm:text-2xl/6 text-xl/5.5 mb-3 text-pretty">
                Perpaduan Mindfulness dan Relaksasi Autogenik dalam Satu Genggaman
              </h2>
              <p className="font-medium text-p/5 text-justify">
                Platform ini menggabungkan dua pendekatan yang telah terbukti efektif di dunia kesehatan mental, mindfulness dan relaksasi autogenik, ke dalam pengalaman digital yang interaktif, nyaman, dan ramah bagi remaja. Lewat sesi latihan yang terstruktur, pengguna dapat melatih fokus, mengurangi ketegangan, serta membangun keseimbangan antara kesehatan mental dan pencapaian akademik.
              </p>
            </div>

            <div className="relative w-full sm:h-64 xs:h-54 h-[30dvh] md:rounded-2xl rounded-xl overflow-hidden shadow-md bg-muted">
              <Image
                src={'/lummi/field.png'}
                alt="Field drawing from Lummi"
                fill
                className="object-cover"
              />

              <div className="absolute inset-x-4 bottom-4 flex justify-center sm:justify-end sm:inset-x-14">
                <p className="text-background text-center font-medium -my-4 sm:text-sm/4 text-xs/3 group hover:cursor-pointer">
                  Minimalist Outdoor Scene from
                  <Link
                    href={'https://www.lummi.ai/illustration/minimalist-outdoor-scene-ctxtu'}
                    target="_blank"
                    className="pl-1 group-hover:underline underline-offset-2 group-hover:font-bold"
                  >
                    Steph Meade
                  </Link>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap justify-center sm:gap-3 gap-2 -mt-2">
              <div className="flex items-center gap-2 bg-white/60 dark:bg-muted sm:rounded-full rounded-lg sm:px-4 px-2 sm:py-2 py-1 border border-foreground/10">
                <span className="sm:text-sm text-xs font-semibold">Metode ADDIE</span>
              </div>
              <div className="flex items-center gap-2 bg-white/60 dark:bg-muted sm:rounded-full rounded-lg sm:px-4 px-2 sm:py-2 py-1 border border-foreground/10">
                <span className="sm:text-sm text-xs font-semibold">Berbasis Riset R&D</span>
              </div>
              <div className="flex items-center gap-2 bg-white/60 dark:bg-muted sm:rounded-full rounded-lg sm:px-4 px-2 sm:py-2 py-1 border border-foreground/10">
                <span className="sm:text-sm text-xs font-semibold">Untuk Siswa SMA</span>
              </div>
            </div>

            <div>
              <p className="font-medium text-p/5 text-justify mb-2">
                Website ini bukan sekadar media relaksasi, melainkan hasil
                pengembangan berbasis penelitian menggunakan metode Research and
                Development (R&D) dengan model ADDIE. Seluruh proses
                pengembangannya didasarkan pada analisis kebutuhan siswa serta
                pengujian efektivitas, memastikan setiap fitur yang tersedia
                benar-benar memberi manfaat nyata bagi penggunanya.
              </p>
              <p className="font-medium text-p/5 text-justify">
                Kami percaya bahwa setiap siswa berhak memiliki ruang yang aman untuk beristirahat, memulihkan diri, dan berkembang. Melalui platform ini, kami ingin menghadirkan teknologi yang tidak hanya mendukung proses belajar, tetapi juga membantu membangun generasi yang lebih sehat, lebih fokus, dan lebih siap menghadapi tantangan masa depan.
              </p>
            </div>

            <div className="mt-2 pt-6 border-t border-foreground/10">
              <p className="font-semibold text-lg/4.5">
                Bangun kebiasaan yang lebih tenang setiap hari.
              </p>
              <p className="text-sm/4 text-muted-foreground font-medium mb-4 mt-2">
                Hanya beberapa menit untuk membantu mengurangi stres dan meningkatkan fokus.
              </p>
              <Link
                href="/login"
              >
                <Button
                  className="bg-foreground/90 hover:bg-foreground text-background border-none"
                >
                  Mulai Sekarang
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </Section>
    </div>
  )
}