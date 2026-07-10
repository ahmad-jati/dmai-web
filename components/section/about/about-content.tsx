import { Section } from "@/components/layout/section-wrapper"

const aboutContent = [
  {
    headline: "Kesehatan Mental, Kunci Tersembunyi di Balik Prestasi Akademik",
    paragraph:
      "Di tengah tingginya tuntutan akademik, menjaga kesehatan mental menjadi sama pentingnya dengan meraih prestasi. Sayangnya, tidak semua siswa punya akses ke pendampingan yang mudah, praktis, dan sesuai kebutuhan mereka. Dari sinilah lahir Digital Mindful Autogenic Intervention, platform digital yang membantu siswa SMA mengelola stres, meningkatkan ketenangan, dan mengoptimalkan performa belajar lewat latihan sederhana yang bisa diakses kapan saja.",
  },
  {
    headline: "Perpaduan Mindfulness dan Relaksasi Autogenik dalam Satu Genggaman",
    paragraph:
      "Platform ini menggabungkan dua pendekatan yang telah terbukti efektif di dunia kesehatan mental, mindfulness dan relaksasi autogenik, ke dalam pengalaman digital yang interaktif, nyaman, dan ramah bagi remaja. Lewat sesi latihan yang terstruktur, pengguna dapat melatih fokus, mengurangi ketegangan, serta membangun keseimbangan antara kesehatan mental dan pencapaian akademik.",
  },
  {
    headline: "",
    paragraph:
      "Website ini bukan sekadar media relaksasi, melainkan hasil pengembangan berbasis penelitian menggunakan metode Research and Development (R&D) dengan model ADDIE. Seluruh proses pengembangannya didasarkan pada analisis kebutuhan siswa serta pengujian efektivitas, memastikan setiap fitur yang tersedia benar-benar memberi manfaat nyata bagi penggunanya.",
  },
  {
    headline: "Membangun Generasi yang Lebih Sehat, Fokus, dan Siap Menghadapi Masa Depan",
    paragraph:
      "Kami percaya setiap siswa berhak memiliki ruang yang aman untuk beristirahat, memulihkan diri, dan berkembang. Melalui platform ini, kami ingin menghadirkan teknologi yang tidak hanya mendukung proses belajar, tetapi juga membantu membangun generasi yang lebih sehat, lebih fokus, dan lebih siap menghadapi tantangan masa depan.",
  },
]

export default function AboutContent() {
  return (
    <div className="w-full">
      <Section className="bg-pink w-full flex flex-col items-center gap-6">
        <div className="text-center">
          <h1 className="font-bold text-4xl">DMAI</h1>
          <p className="text-muted-foreground font-medium text-xl">
            Digital Mindful Autogenic Intervention
          </p>
        </div>

        <div className="flex flex-col gap-2 max-w-2xl">
          {aboutContent.map((item, index) => (
            <div key={index}>
              {item.headline !== '' && (
                <h2 className="font-semibold text-2xl/6 my-2 text-pretty">{item.headline}</h2>
              )}
              <p className="font-medium text-p/5 text-justify">{item.paragraph}</p>
            </div>
          ))}
        </div>
      </Section>
    </div>
  )
}