import Image from "next/image"
import { Section } from "@/components/layout/section-wrapper"

export default function AboutContent() {
  return (
    <div className="w-full">
      <Section className="bg-celeste w-full flex flex-col items-start gap-8">
        
        <div className="text-center w-full 2md:hidden block">
          <h1 className="font-bold text-4xl">DMAI</h1>
          <p className="text-muted-foreground font-medium text-xl">
            Digital Mindful Autogenic Intervention
          </p>
        </div>

        <div className="relative w-full h-94 rounded-2xl overflow-hidden shadow-md bg-muted">
          <Image
            src={'/lummi/outdoor.png'}
            alt={''}
            fill
            className="object-cover"
          />
        </div>

        <div className="flex gap-16">
          <div className="text-left md:block hidden">
            <h1 className="font-bold 2md:text-4xl">DMAI</h1>
            <p className="text-muted-foreground font-medium text-xl">
              Digital Mindful Autogenic Intervention
            </p>
          </div>

          <div className="flex-1 flex flex-col gap-6">
            <div>
              <h2 className="font-semibold text-2xl/6 mb-3 text-pretty">
                Kesehatan Mental, Kunci Tersembunyi di Balik Prestasi Akademik
              </h2>
              <p className="font-medium text-p/5 text-justify">
                Di tengah tingginya tuntutan akademik, menjaga kesehatan mental menjadi sama pentingnya dengan meraih prestasi. Sayangnya, tidak semua siswa punya akses ke pendampingan yang mudah, praktis, dan sesuai kebutuhan mereka. Dari sinilah lahir Digital Mindful Autogenic Intervention, platform digital yang membantu siswa SMA mengelola stres, meningkatkan ketenangan, dan mengoptimalkan performa belajar lewat latihan sederhana yang bisa diakses kapan saja.
              </p>
            </div>
            <div>
              <h2 className="font-semibold text-2xl/6 mb-3 text-pretty">
               Perpaduan Mindfulness dan Relaksasi Autogenik dalam Satu Genggaman
              </h2>
              <p className="font-medium text-p/5 text-justify">
               Platform ini menggabungkan dua pendekatan yang telah terbukti efektif di dunia kesehatan mental, mindfulness dan relaksasi autogenik, ke dalam pengalaman digital yang interaktif, nyaman, dan ramah bagi remaja. Lewat sesi latihan yang terstruktur, pengguna dapat melatih fokus, mengurangi ketegangan, serta membangun keseimbangan antara kesehatan mental dan pencapaian akademik.
              </p>
            </div>
            <div className="relative w-full h-60 rounded-xl overflow-hidden shadow-md bg-muted">
              <Image
                src={'/lummi/field.png'}
                alt={''}
                fill
                className="object-cover"
              />
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
          </div>
        </div>
      </Section>
    </div>
  )
}