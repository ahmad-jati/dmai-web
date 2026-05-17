export type SessionInstruction = {
  step: number;
  title: string;
  description: string;
  duration_seconds: number;
  image: string;
  audio: string; // URL audio narasi per step, hosted di Supabase Storage
}

export type SessionData = {
  session_name: string;
  detail_short: string;
  detail_full: string[];
  icon: string;
  total_instruction: number;
  duration: string;
  instructions: SessionInstruction[];
  image_cover: string;
};

// Placeholder base URL — ganti dengan URL Supabase Storage kamu
// Format: https://<project>.supabase.co/storage/v1/object/public/session-audio/<filename>
const AUDIO_BASE = 'https://zgvybfxgvexsuutrekpq.supabase.co/storage/v1/object/public/session-audio'

export const data_session: SessionData[] = [
  {
    session_name: 'Motivation',
    detail_short: 'Untuk membantu kamu menemukan semangat kembali.',
    detail_full: [
      'Terkadang rasa lelah dan tekanan membuat semuanya terasa lebih berat dari biasanya. Sesi ini dirancang untuk menemanimu perlahan mengenali kembali tujuan kecil, membangun semangat sedikit demi sedikit, dan memberi jeda dari ramainya pikiran.',
      'Tidak perlu terburu-buru. Ikuti setiap langkah sesuai ritmemu sendiri.',
    ],
    icon: '/flower-icon/small-icon-1.png',
    total_instruction: 8,
    duration: '20 menit 12 detik',
    instructions: [
      {
        step: 1,
        title: 'Duduk & Bernapas',
        description: 'Duduk dengan nyaman. Pejamkan mata perlahan. Tarik napas dalam-dalam selama 4 detik, tahan 4 detik, lalu hembuskan selama 6 detik. Ulangi 3 kali.',
        duration_seconds: 60,
        image: '/serene1.png',
        audio: `${AUDIO_BASE}/motivation/step-1.mp3`,
      },
      {
        step: 2,
        title: 'Kenali Perasaanmu',
        description: 'Tanpa menghakimi, perhatikan apa yang kamu rasakan saat ini. Apakah ada rasa lelah, cemas, atau hampa? Biarkan perasaan itu ada tanpa perlu diperbaiki.',
        duration_seconds: 90,
        image: '/serene2.png',
        audio: `${AUDIO_BASE}/motivation/step-2.mp3`,
      },
      {
        step: 3,
        title: 'Ingat Satu Hal Baik',
        description: 'Pikirkan satu hal kecil yang berhasil kamu lakukan kemarin — sekecil apa pun. Mungkin kamu bangun pagi, atau minum air yang cukup. Itu berarti.',
        duration_seconds: 90,
        image: '/serene3.png',
        audio: `${AUDIO_BASE}/motivation/step-3.mp3`,
      },
      {
        step: 4,
        title: 'Visualisasi Tujuan Kecil',
        description: 'Bayangkan satu hal sederhana yang ingin kamu selesaikan hari ini. Bukan yang besar — cukup satu langkah kecil yang terasa mungkin.',
        duration_seconds: 120,
        image: '/serene4.png',
        audio: `${AUDIO_BASE}/motivation/step-4.mp3`,
      },
      {
        step: 5,
        title: 'Afirmasi Diri',
        description: 'Ucapkan dalam hati: "Aku cukup. Aku sedang berjuang dan itu berani." Ulangi tiga kali dengan penuh kesadaran.',
        duration_seconds: 60,
        image: '/serene1.png',
        audio: `${AUDIO_BASE}/motivation/step-5.mp3`,
      },
      {
        step: 6,
        title: 'Gerakan Ringan',
        description: 'Angkat kedua bahu ke atas, tahan sebentar, lalu lepaskan. Putar leher perlahan ke kanan dan kiri. Rasakan tubuhmu kembali hadir.',
        duration_seconds: 90,
        image: '/serene2.png',
        audio: `${AUDIO_BASE}/motivation/step-6.mp3`,
      },
      {
        step: 7,
        title: 'Niatkan Harimu',
        description: 'Tetapkan satu niat sederhana untuk hari ini. Bukan target besar, tapi sebuah arah. Misalnya: "Hari ini aku akan lebih sabar pada diriku sendiri."',
        duration_seconds: 60,
        image: '/serene3.png',
        audio: `${AUDIO_BASE}/motivation/step-7.mp3`,
      },
      {
        step: 8,
        title: 'Penutup & Rasa Syukur',
        description: 'Tarik napas dalam sekali lagi. Ucapkan terima kasih kepada dirimu sendiri karena sudah mau hadir di sini hari ini. Buka mata perlahan.',
        duration_seconds: 60,
        image: '/serene4.png',
        audio: `${AUDIO_BASE}/motivation/step-8.mp3`,
      },
    ],
    image_cover: '/serene1.png',
  },

  {
    session_name: 'Self Reported',
    detail_short: 'Mengenali dan memahami apa yang sedang kamu rasakan.',
    detail_full: [
      'Mengetahui apa yang sedang terjadi dalam diri adalah langkah pertama menuju kesejahteraan. Sesi ini memandu kamu untuk jujur pada diri sendiri tentang kondisi emosional, fisik, dan mental hari ini.',
    ],
    icon: '/flower-icon/small-icon-2.png',
    total_instruction: 6,
    duration: '15 menit',
    instructions: [
      { step: 1, title: 'Check-in Tubuh', description: 'Pindai tubuhmu dari ujung kepala hingga kaki. Di mana ada ketegangan? Perhatikan tanpa perlu mengubah apa pun.', duration_seconds: 90, image: '/serene1.png', audio: `${AUDIO_BASE}/self-reported/step-1.mp3` },
      { step: 2, title: 'Skala Energi', description: 'Dalam skala 1–10, seberapa bertenaga kamu hari ini? Tidak ada jawaban yang salah — ini hanya laporan jujur.', duration_seconds: 60, image: '/serene2.png', audio: `${AUDIO_BASE}/self-reported/step-2.mp3` },
      { step: 3, title: 'Emosi Saat Ini', description: 'Sebutkan satu kata yang menggambarkan perasaanmu sekarang. Pilih dari: senang, sedih, cemas, lega, bingung, marah, atau yang lainnya.', duration_seconds: 60, image: '/serene3.png', audio: `${AUDIO_BASE}/self-reported/step-3.mp3` },
      { step: 4, title: 'Apa yang Mempengaruhi?', description: 'Apa satu hal yang paling memengaruhi kondisimu hari ini? Tidak perlu solusi — cukup kenali.', duration_seconds: 90, image: '/serene4.png', audio: `${AUDIO_BASE}/self-reported/step-4.mp3` },
      { step: 5, title: 'Kebutuhan Saat Ini', description: 'Apa yang paling kamu butuhkan sekarang? Istirahat? Terhubung dengan orang lain? Ketenangan? Akui kebutuhanmu itu.', duration_seconds: 90, image: '/serene1.png', audio: `${AUDIO_BASE}/self-reported/step-5.mp3` },
      { step: 6, title: 'Tutup dengan Baik', description: 'Terima kondisimu apa adanya hari ini. Kamu tidak harus merasa baik-baik saja. Cukup hadir adalah cukup.', duration_seconds: 60, image: '/serene2.png', audio: `${AUDIO_BASE}/self-reported/step-6.mp3` },
    ],
    image_cover: '/serene1.png',
  },

  {
    session_name: 'Self Efficacy',
    detail_short: 'Menguatkan kembali rasa percaya terhadap kemampuan diri.',
    detail_full: [
      'Rasa percaya pada kemampuan diri bisa terkikis oleh kegagalan dan perbandingan. Sesi ini membantu kamu membangun kembali keyakinan bahwa kamu mampu — dengan bukti nyata dari hidupmu sendiri.',
    ],
    icon: '/flower-icon/small-icon-3.png',
    total_instruction: 6,
    duration: '18 menit',
    instructions: [
      { step: 1, title: 'Mulai dengan Hadir', description: 'Duduk tegak, letakkan tangan di dada. Rasakan detak jantungmu. Tubuhmu bekerja keras untukmu setiap hari.', duration_seconds: 60, image: '/serene1.png', audio: `${AUDIO_BASE}/self-efficacy/step-1.mp3` },
      { step: 2, title: 'Ingat Pencapaian Lalu', description: 'Pikirkan satu tantangan yang pernah berhasil kamu lewati. Tidak harus besar — cukup sesuatu yang dulu terasa susah tapi berhasil.', duration_seconds: 120, image: '/serene2.png', audio: `${AUDIO_BASE}/self-efficacy/step-2.mp3` },
      { step: 3, title: 'Kekuatan yang Kamu Miliki', description: 'Sebutkan tiga kata sifat positif tentang dirimu. Mungkin: gigih, peduli, kreatif. Percaya pada deskripsi itu.', duration_seconds: 90, image: '/serene3.png', audio: `${AUDIO_BASE}/self-efficacy/step-3.mp3` },
      { step: 4, title: 'Tantangan Sekarang', description: 'Bayangkan satu tantangan yang sedang kamu hadapi. Sekarang bayangkan versi dirimu yang lebih kuat menghadapinya — apa yang ia lakukan?', duration_seconds: 120, image: '/serene4.png', audio: `${AUDIO_BASE}/self-efficacy/step-4.mp3` },
      { step: 5, title: 'Satu Langkah Konkret', description: 'Tentukan satu tindakan kecil yang bisa kamu ambil dalam 24 jam ke depan untuk mendekat ke tujuanmu.', duration_seconds: 90, image: '/serene1.png', audio: `${AUDIO_BASE}/self-efficacy/step-5.mp3` },
      { step: 6, title: 'Afirmasi Kemampuan', description: '"Aku telah melewati hal-hal sulit sebelumnya, dan aku bisa melewati ini juga." Ucapkan tiga kali dengan penuh keyakinan.', duration_seconds: 60, image: '/serene2.png', audio: `${AUDIO_BASE}/self-efficacy/step-6.mp3` },
    ],
    image_cover: '/serene1.png',
  },

  {
    session_name: 'Isolation',
    detail_short: 'Menemani saat kamu merasa sendiri dan sulit dipahami orang lain.',
    detail_full: [
      'Rasa sepi bisa muncul bahkan di tengah keramaian. Sesi ini tidak memaksamu untuk langsung terhubung dengan siapa pun — melainkan menemanimu merasakan kehadiran dirimu sendiri terlebih dahulu.',
    ],
    icon: '/flower-icon/small-icon-4.png',
    total_instruction: 5,
    duration: '14 menit',
    instructions: [
      { step: 1, title: 'Terima Rasa Sepi', description: 'Rasa sepi bukan tanda kelemahan. Biarkan dirimu mengakui: "Aku sedang merasa kesepian, dan itu tidak apa-apa."', duration_seconds: 90, image: '/serene1.png', audio: `${AUDIO_BASE}/isolation/step-1.mp3` },
      { step: 2, title: 'Kamu Tidak Sendirian', description: 'Di seluruh dunia, ada jutaan orang yang merasakan hal serupa saat ini. Kamu adalah bagian dari pengalaman manusia yang universal.', duration_seconds: 90, image: '/serene2.png', audio: `${AUDIO_BASE}/isolation/step-2.mp3` },
      { step: 3, title: 'Temani Dirimu', description: 'Letakkan tangan di bahu atau di dada. Bayangkan kamu sedang merangkul diri sendiri dengan lembut. Kamu ada untuk dirimu sendiri.', duration_seconds: 120, image: '/serene3.png', audio: `${AUDIO_BASE}/isolation/step-3.mp3` },
      { step: 4, title: 'Satu Koneksi Kecil', description: 'Pikirkan satu orang yang peduli padamu — bahkan jika kamu belum bicara lama. Boleh hanya membayangkan wajahnya.', duration_seconds: 90, image: '/serene4.png', audio: `${AUDIO_BASE}/isolation/step-4.mp3` },
      { step: 5, title: 'Penutup Hangat', description: 'Kamu telah menemani dirimu hari ini. Itu adalah bentuk cinta pada diri sendiri. Buka mata dengan perlahan dan lembut.', duration_seconds: 60, image: '/serene1.png', audio: `${AUDIO_BASE}/isolation/step-5.mp3` },
    ],
    image_cover: '/serene1.png',
  },

  {
    session_name: 'Time Management',
    detail_short: 'Membantu mengatur waktu agar harimu terasa lebih ringan.',
    detail_full: [
      'Ketika semua terasa mendesak dan waktu terasa tidak cukup, kamu mungkin membutuhkan bukan lebih banyak jam — tapi cara pandang yang lebih jernih tentang apa yang benar-benar penting.',
    ],
    icon: '/flower-icon/small-icon-5.png',
    total_instruction: 6,
    duration: '16 menit',
    instructions: [
      { step: 1, title: 'Bersihkan Mental', description: 'Tutup mata. Bayangkan semua tugas dan kekhawatiran sebagai awan — biarkan mereka melayang jauh sejenak. Kamu butuh ruang jernih dulu.', duration_seconds: 90, image: '/serene1.png', audio: `${AUDIO_BASE}/time-management/step-1.mp3` },
      { step: 2, title: 'Tiga Prioritas Hari Ini', description: 'Dari semua yang perlu dilakukan, pilih hanya tiga yang paling penting. Bukan yang paling mendesak — tapi yang paling bermakna.', duration_seconds: 120, image: '/serene2.png', audio: `${AUDIO_BASE}/time-management/step-2.mp3` },
      { step: 3, title: 'Estimasi Waktu Jujur', description: 'Untuk setiap prioritas, perkirakan waktu yang realistis — bukan optimis. Tambahkan 20% untuk jeda dan gangguan tak terduga.', duration_seconds: 90, image: '/serene3.png', audio: `${AUDIO_BASE}/time-management/step-3.mp3` },
      { step: 4, title: 'Jadwalkan Jeda', description: 'Istirahat bukan pembuangan waktu — itu investasi produktivitas. Rencanakan setidaknya dua jeda pendek (5 menit) dalam harimu.', duration_seconds: 90, image: '/serene4.png', audio: `${AUDIO_BASE}/time-management/step-4.mp3` },
      { step: 5, title: 'Satu Tugas, Satu Waktu', description: 'Multitasking menurunkan kualitas. Komitmenkan dirimu untuk fokus pada satu hal di satu waktu, lalu pindah setelah selesai.', duration_seconds: 90, image: '/serene1.png', audio: `${AUDIO_BASE}/time-management/step-5.mp3` },
      { step: 6, title: 'Tutup dengan Niat', description: 'Niatkan: hari ini aku akan bekerja sesuai kapasitasku, tidak lebih. Yang tidak selesai hari ini, bisa dilanjutkan besok.', duration_seconds: 60, image: '/serene2.png', audio: `${AUDIO_BASE}/time-management/step-6.mp3` },
    ],
    image_cover: '/serene1.png',
  },

  {
    session_name: 'Positive Thinking',
    detail_short: 'Membantu melihat sesuatu dengan sudut pandang yang lebih baik.',
    detail_full: [
      'Pikiran negatif sering kali datang otomatis. Sesi ini bukan tentang memaksamu bahagia — tapi melatih otakmu untuk melihat kemungkinan lain yang juga nyata dan valid.',
    ],
    icon: '/flower-icon/small-icon-6.png',
    total_instruction: 6,
    duration: '17 menit',
    instructions: [
      { step: 1, title: 'Tangkap Pikiran Negatif', description: 'Pikirkan satu pikiran negatif yang sering muncul belakangan ini. Tuliskan atau ucapkan dalam hati tanpa menghakiminya.', duration_seconds: 90, image: '/serene1.png', audio: `${AUDIO_BASE}/positive-thinking/step-1.mp3` },
      { step: 2, title: 'Uji Kebenarannya', description: 'Tanyakan: apakah pikiran ini benar 100%? Adakah bukti yang menentangnya? Pikiran bukan fakta.', duration_seconds: 120, image: '/serene2.png', audio: `${AUDIO_BASE}/positive-thinking/step-2.mp3` },
      { step: 3, title: 'Perspektif Lain', description: 'Apa yang akan dikatakan teman terbaikmu tentang situasi ini? Sering kali orang lain melihat kita lebih baik dari kita sendiri.', duration_seconds: 90, image: '/serene3.png', audio: `${AUDIO_BASE}/positive-thinking/step-3.mp3` },
      { step: 4, title: 'Reframe Pikiran', description: 'Ubah pikiran negatif menjadi yang lebih seimbang. Bukan "aku selalu gagal" tapi "aku kadang kesulitan, dan itu manusiawi."', duration_seconds: 120, image: '/serene4.png', audio: `${AUDIO_BASE}/positive-thinking/step-4.mp3` },
      { step: 5, title: 'Tiga Hal yang Berjalan Baik', description: 'Sebutkan tiga hal — sekecil apa pun — yang berjalan baik hari ini atau kemarin. Latih perhatianmu pada yang positif.', duration_seconds: 90, image: '/serene1.png', audio: `${AUDIO_BASE}/positive-thinking/step-5.mp3` },
      { step: 6, title: 'Komitmen Mental', description: 'Pilih satu pikiran positif yang ingin kamu pegang hari ini. Buat itu sebagai peganganmu ketika pikiran negatif kembali datang.', duration_seconds: 60, image: '/serene2.png', audio: `${AUDIO_BASE}/positive-thinking/step-6.mp3` },
    ],
    image_cover: '/serene1.png',
  },

  {
    session_name: 'Positive Affection',
    detail_short: 'Menumbuhkan perasaan hangat dan nyaman dalam diri.',
    detail_full: [
      'Kasih sayang pada diri sendiri bukan kemewahan — itu kebutuhan dasar. Sesi ini membantumu merasakan kehangatan dari dalam, terlepas dari apa yang terjadi di luar.',
    ],
    icon: '/flower-icon/small-icon.png',
    total_instruction: 5,
    duration: '13 menit',
    instructions: [
      { step: 1, title: 'Mulai dengan Kehangatan', description: 'Gosokkan kedua telapak tanganmu hingga hangat, lalu letakkan di wajahmu. Rasakan kehangatan itu sebagai pelukan untuk dirimu sendiri.', duration_seconds: 60, image: '/serene1.png', audio: `${AUDIO_BASE}/positive-affection/step-1.mp3` },
      { step: 2, title: 'Ingat Seseorang yang Mengasihimu', description: 'Bayangkan seseorang yang tulus peduli padamu — bisa keluarga, teman, atau bahkan hewan peliharaan. Rasakan kasih sayang mereka.', duration_seconds: 90, image: '/serene2.png', audio: `${AUDIO_BASE}/positive-affection/step-2.mp3` },
      { step: 3, title: 'Arahkan Kasih ke Dirimu', description: 'Sekarang arahkan perasaan hangat itu ke dirimu sendiri. Ucapkan: "Semoga aku bahagia. Semoga aku sehat. Semoga aku damai."', duration_seconds: 120, image: '/serene3.png', audio: `${AUDIO_BASE}/positive-affection/step-3.mp3` },
      { step: 4, title: 'Terima Kekuranganmu', description: 'Kamu tidak perlu sempurna untuk layak dicintai. Ucapkan: "Aku menerima diriku apa adanya — kelebihan dan kekuranganku."', duration_seconds: 90, image: '/serene4.png', audio: `${AUDIO_BASE}/positive-affection/step-4.mp3` },
      { step: 5, title: 'Sebarkan Kehangatan', description: 'Bayangkan kehangatan itu menyebar ke semua orang di sekitarmu. Kamu adalah sumber kebaikan — mulai dari dirimu sendiri.', duration_seconds: 90, image: '/serene1.png', audio: `${AUDIO_BASE}/positive-affection/step-5.mp3` },
    ],
    image_cover: '/serene1.png',
  },
]