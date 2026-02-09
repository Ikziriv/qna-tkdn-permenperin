
import { Question } from './types';

export const ASSESSMENT_QUESTIONS: Question[] = [
  {
    id: 1,
    text: {
      en: "According to Pasal 4, what is the weightage of 'Direct Material' in the calculation of TKDN for Goods?",
      id: "Berdasarkan Pasal 4, berapakah bobot 'Bahan/Material Langsung' dalam penghitungan TKDN Barang?"
    },
    options: {
      en: ["50%", "75%", "15%", "10%"],
      id: ["50%", "75%", "15%", "10%"]
    },
    category: {
      en: "Goods Calculation",
      id: "Penghitungan Barang"
    },
    correctAnswerIndex: 1
  },
  {
    id: 2,
    text: {
      en: "What is the maximum additional TKDN value that can be granted for 'Brainware' (Intellectual Capability)?",
      id: "Berapakah tambahan nilai TKDN maksimal yang dapat diberikan untuk kemampuan intelektual (brainware)?"
    },
    options: {
      en: ["10%", "15%", "20%", "25%"],
      id: ["10%", "15%", "20%", "25%"]
    },
    category: {
      en: "Intellectual Capability",
      id: "Kemampuan Intelektual"
    },
    correctAnswerIndex: 2
  },
  {
    id: 3,
    text: {
      en: "Per Pasal 22, what is the maximum percentage allowed for BMP (Company Benefit Weight)?",
      id: "Menurut Pasal 22, berapakah persentase maksimal yang diperhitungkan untuk BMP (Bobot Manfaat Perusahaan)?"
    },
    options: {
      en: ["10%", "15%", "20%", "5%"],
      id: ["10%", "15%", "20%", "5%"]
    },
    category: {
      en: "BMP Rules",
      id: "Ketentuan BMP"
    },
    correctAnswerIndex: 1
  },
  {
    id: 4,
    text: {
      en: "How can Small Industries (Industri Kecil) calculate their TKDN value according to Pasal 26?",
      id: "Bagaimana cara Industri Kecil menghitung nilai TKDN mereka menurut Pasal 26?"
    },
    options: {
      en: ["LVI Audit", "Ministry Verification", "Self-Declare", "Regional Assessment"],
      id: ["Audit LVI", "Verifikasi Kementrian", "Self-Declare (Pernyataan Mandiri)", "Asesmen Regional"]
    },
    category: {
      en: "Small Industry",
      id: "Industri Kecil"
    },
    correctAnswerIndex: 2
  },
  {
    id: 5,
    text: {
      en: "According to Pasal 45, how long is a TKDN Certificate valid from the date of issue?",
      id: "Berdasarkan Pasal 45, berapa lama masa berlaku Sertifikat TKDN sejak diterbitkan?"
    },
    options: {
      en: ["2 Years", "3 Years", "5 Years", "10 Years"],
      id: ["2 Tahun", "3 Tahun", "5 Tahun", "10 Tahun"]
    },
    category: {
      en: "Compliance",
      id: "Kepatuhan"
    },
    correctAnswerIndex: 2
  },
  {
    id: 6,
    text: {
      en: "Which institution is appointed by the Minister to carry out TKDN verification (LVI)?",
      id: "Lembaga manakah yang ditunjuk oleh Menteri untuk melaksanakan verifikasi TKDN (LVI)?"
    },
    options: {
      en: ["Independent Verification Agency", "Regional Trade Office", "Industry Association", "Internal Company Team"],
      id: ["Lembaga Verifikasi Independen", "Dinas Perdagangan Daerah", "Asosiasi Industri", "Tim Internal Perusahaan"]
    },
    category: {
      en: "Verification",
      id: "Verifikasi"
    },
    correctAnswerIndex: 0
  },
  {
    id: 7,
    text: {
      en: "In Goods calculation, if 100% of raw materials are from domestic natural resources, the TKDN value is?",
      id: "Dalam hitungan Barang, jika 100% bahan baku berasal dari sumber daya alam dalam negeri, nilai TKDN-nya adalah?"
    },
    options: {
      en: ["75%", "80%", "90%", "100%"],
      id: ["75%", "80%", "90%", "100%"]
    },
    category: {
      en: "Natural Resources",
      id: "Sumber Daya Alam"
    },
    correctAnswerIndex: 3
  },
  {
    id: 8,
    text: {
      en: "Per Pasal 6, what is the minimum percentage of WNI labor required for 100% labor weight calculation?",
      id: "Per Pasal 6, berapa persentase minimal tenaga kerja WNI yang dibutuhkan untuk penghitungan bobot tenaga kerja 100%?"
    },
    options: {
      en: ["30%", "50%", "75%", "100%"],
      id: ["30%", "50%", "75%", "100%"]
    },
    category: {
      en: "Labor",
      id: "Tenaga Kerja"
    },
    correctAnswerIndex: 1
  },
  {
    id: 9,
    text: {
      en: "Which SIINas reporting frequency is required for BMP factor consideration?",
      id: "Frekuensi pelaporan SIINas manakah yang diperlukan untuk pertimbangan faktor BMP?"
    },
    options: {
      en: ["Every 5 years", "Annually", "Every 3 years", "Quarterly"],
      id: ["Setiap 5 tahun", "Setiap tahun", "Setiap 3 tahun", "Setiap kuartal"]
    },
    category: {
      en: "Reporting",
      id: "Pelaporan"
    },
    correctAnswerIndex: 0
  },
  {
    id: 10,
    text: {
      en: "What determines if a 'Direct Labor' factor can be counted at 100% efficiency?",
      id: "Apa yang menentukan faktor 'Tenaga Kerja Langsung' dapat dihitung dengan efisiensi 100%?"
    },
    options: {
      en: ["Minimum Wage Compliance", "Owned Factory in Indonesia", "ISO Certification", "University Partnership"],
      id: ["Kepatuhan UMR", "Pabrik Milik Sendiri di Indonesia", "Sertifikasi ISO", "Kemitraan Universitas"]
    },
    category: {
      en: "Production",
      id: "Produksi"
    },
    correctAnswerIndex: 1
  }
];
