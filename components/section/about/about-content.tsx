import Image from "next/image"
import Link from "next/link"
import { Section } from "@/components/layout/section-wrapper"
import { Button } from "@/components/ui/button"
import { Route } from "next"

type AttributionItem = {
  title: string
  author: string
  source: string
  href: string
}

type AttributionRowProps = {
  label: string
  items: AttributionItem[]
}

function AttributionRow({ label, items }: AttributionRowProps) {
  return (
    <div className="flex flex-col gap-2 flex-1">
      {items.map((item, index) => (
        <div
          key={item.href + index}
          className="flex md:flex-row flex-col gap-2 md:items-center items-start"
        >
          <div className="rounded-full text-xs px-3 py-1 bg-white/60 dark:bg-muted font-semibold w-fit shrink-0 text-muted-foreground dark:text-foreground">
            {label}
          </div>
          
          <Link
            href={item.href as Route}
            target="_blank"
            className="text-sm/4 hover:cursor-pointer font-medium md:pl-0 pl-3"
          >
            <span className="font-bold">{item.title}</span>, karya {item.author}. 
          </Link>
        </div>
      ))}
    </div>
  )
}

export default function AboutContent() {
  return (
    <div className="w-full">
      <Section className="bg-tangerine dark:bg-celeste w-full flex flex-col items-start gap-8">
        <div className="flex flex-col items-start gap-8 w-full">
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
            <div className="text-left lg:flex hidden flex-col gap-2 lg:w-64 lg:shrink-0">
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
                  <p className="text-background/60d text-center font-medium -my-4 sm:text-sm/4 text-xs/3 group hover:cursor-pointer">
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

              <div className="mt-2 bg-background md:rounded-2xl rounded-xl p-4 flex flex-col sm:items-start items-center">
                <p className="font-semibold text-lg/4.5 sm:text-left text-center">
                  Bangun kebiasaan yang lebih tenang setiap hari.
                </p>
                <p className="text-sm/4 text-muted-foreground font-medium mb-4 mt-2 sm:text-left text-center">
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
        </div>

        <div className="w-full pt-8 mt-2 border-t border-foreground/10 ">
          <div className=" flex lg:flex-row flex-col lg:gap-16 gap-8">

            <div className="text-center w-full lg:hidden flex flex-col items-center gap-2">
              <h4 className="font-bold sm:text-2xl text-xl">Atribusi Aset</h4>
              <p className="text-muted-foreground font-medium sm:text-base/4.5 text-sm/3.5 xs:mt-0 -mt-1">
                Seluruh ilustrasi dan grafis pada website ini berasal dari sumber terbuka (open-source).
              </p>
            </div>

            <div className="text-left lg:flex hidden flex-col gap-2 lg:w-64 lg:shrink-0">
              <h4 className="font-bold sm:text-2xl text-xl">
                Kredit & Atribusi Aset
              </h4>
              <p className="text-muted-foreground font-medium text-base/4.5 max-w-lg">
                Seluruh ilustrasi dan grafis pada website ini berasal dari sumber terbuka (open-source).
              </p>
            </div>

            <div className="flex-1 flex flex-col gap-2">
              <AttributionRow
                label="Ilustrasi"
                items={[
                  { title: "Whimsical Outdoor Scene", author: "Steph Meade", source: "Lummi", href: "https://www.lummi.ai/illustration/whimsical-outdoor-scene-akvmp" },
                  { title: "Minimalist Outdoor Scene", author: "Steph Meade", source: "Lummi", href: "https://www.lummi.ai/illustration/minimalist-outdoor-scene-ctxtu" },
                  { title: "Serene Night by the Lake", author: "Steph Meade", source: "Lummi", href: "https://www.lummi.ai/illustration/serene-night-by-the-lake-bu00d" },
                  { title: "Tranquil Countryside Art", author: "Daniel Norin", source: "Lummi", href: "https://www.lummi.ai/illustration/tranquil-countryside-art-qacmz" },
                ]}
              />

              <AttributionRow
                label="Ikon Bunga"
                items={[
                  { title: "Bloom Organic Modern Shapes", author: "Noko Washiyama", source: "Figma Community", href: "https://www.figma.com/community/file/1506926724873525389/bloom-organic-modern-shpes" },
                  { title: "Bloom Mod Floral Graphics", author: "Noko Washiyama", source: "Figma Community", href: "https://www.figma.com/community/file/1506973666049607884/bloom-mod-floral-graphics" },
                ]}
              />

              <AttributionRow
                label="Doodle"
                items={[
                  { title: "Running, Ice Cream, Coffee, Meditating, Reading, Float Doodle", author: "Pablo Stanley", source: "Open Doodles", href: "https://www.opendoodles.com/" },
                ]}
              />
            </div>

          </div>
        </div>
      </Section>
    </div>
  )
}