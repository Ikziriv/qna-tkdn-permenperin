
import { Question } from './types';

export const ASSESSMENT_QUESTIONS: Question[] = [
  {
    id: 1,
    text: {
      id: "Apakah seluruh produk dalam negeri wajib digunakan oleh Pengguna Barang/Jasa?",
      en: "Are all domestic products mandatory for use by Goods/Service Users?"
    },
    options: {
      id: ["Mutlak wajib digunakan", "Tidak seluruhnya wajib", "Hanya jika terdapat produk dalam negeri dengan nilai TKDN 40%", "Ya, Jika produk dalam negeri tersebut memiliki sertifikat TKDN"],
      en: ["Absolutely mandatory", "Not all are mandatory", "Only if there are domestic products with 40% TKDN", "Yes, if the domestic product has a TKDN certificate"]
    },
    category: { id: "Kewajiban PDN", en: "PDN Obligation" },
    correctAnswerIndex: 1
  },
  {
    id: 2,
    text: {
      id: "Berapa nilai minimum TKDN sebelum ditambahkan nilai BMP 10% agar suatu produk dapat dikatakan barang wajib pada pengadaan barang/jasa?",
      en: "What is the minimum TKDN value before adding 10% BMP for a product to be categorized as mandatory in goods/services procurement?"
    },
    options: {
      id: ["25%", "15%", "30%", "24%"],
      en: ["25%", "15%", "30%", "24%"]
    },
    category: { id: "Ambang Batas", en: "Thresholds" },
    correctAnswerIndex: 2
  },
  {
    id: 3,
    text: {
      id: "Persyaratan yang harus dipenuhi apabila KBLI pada NIB skala risiko menengah tinggi?",
      en: "What requirements must be met if the KBLI on NIB is of medium-high risk scale?"
    },
    options: {
      id: ["NIB", "Sertifikat Standar Pernyataan Mandiri", "Sertifikat Standar Telah Terverifikasi", "Izin"],
      en: ["NIB", "Self-Declared Standard Certificate", "Verified Standard Certificate", "Permit"]
    },
    category: { id: "Perizinan", en: "Licensing" },
    correctAnswerIndex: 2
  },
  {
    id: 4,
    text: {
      id: "Barang Peserta Tender: A (TKDN 35, BMP 0), B (TKDN 26, BMP 14), C (TKDN 25, BMP 10), D (TKDN 10, BMP 10), E (Impor 0). Manakah yang tidak boleh mengikuti tender?",
      en: "Tender Participants: A (35% TKDN, 0% BMP), B (26% TKDN, 14% BMP), C (25% TKDN, 10% BMP), D (10% TKDN, 10% BMP), E (Imported 0%). Who is not allowed to join?"
    },
    options: {
      id: ["B dan E", "D dan C", "A dan B", "E dan D"],
      en: ["B and E", "D and C", "A and B", "E and D"]
    },
    category: { id: "Evaluasi Tender", en: "Tender Evaluation" },
    correctAnswerIndex: 3
  },
  {
    id: 5,
    text: {
      id: "Syarat suatu produk dapat dikategorikan Produk Dalam Negeri, kecuali?",
      en: "Requirements for a product to be categorized as a Domestic Product, EXCEPT?"
    },
    options: {
      id: [
        "Diproduksi oleh perusahaan yang berinvestasi di dalam negeri",
        "Seluruh atau sebagian tenaga kerja adalah Warga Negara Indonesia",
        "Proses produksinya di dalam negeri dan tidak menggunakan komponen dari dalam negeri",
        "Seluruh atau sebagian bahan baku berasal dari dalam negeri"
      ],
      en: [
        "Produced by companies investing domestically",
        "All or part of the workforce are Indonesian citizens",
        "Production process is domestic and does not use domestic components",
        "All or part of the raw materials originate domestically"
      ]
    },
    category: { id: "Definisi PDN", en: "PDN Definition" },
    correctAnswerIndex: 2
  },
  {
    id: 6,
    text: {
      id: "Apa kepanjangan dari TKDN?",
      en: "What does TKDN stand for?"
    },
    options: {
      id: ["Tingkat Kandungan Dalam Negeri", "Tingkat Komponen Dalam Negeri", "Tingkat Kemampuan Dalam Negeri", "Tingkat Keberpihakan Dalam Negeri"],
      en: ["Domestic Content Rate", "Domestic Component Level", "Domestic Capability Level", "Domestic Favoritism Level"]
    },
    category: { id: "Terminologi", en: "Terminology" },
    correctAnswerIndex: 1
  },
  {
    id: 7,
    text: {
      id: "Kewajiban penggunaan produk dalam negeri tertuang dalam?",
      en: "The obligation to use domestic products is contained in?"
    },
    options: {
      id: ["Undang Undang No 3 Tahun 2014", "Peraturan Pemerintah No 29 Tahun 2018", "Peraturan Presiden No 16 Tahun 2018 j.o No 46 Tahun 2025", "Semua Benar"],
      en: ["Law No. 3 of 2014", "Government Regulation No. 29 of 2018", "Presidential Regulation No. 16 of 2018 j.o. No. 46 of 2025", "All Correct"]
    },
    category: { id: "Dasar Hukum", en: "Legal Basis" },
    correctAnswerIndex: 3
  },
  {
    id: 8,
    text: {
      id: "Di bawah ini yang tidak termasuk ke dalam penghitungan sesuai dengan Peraturan Menteri Perindustrian No 35 Tahun 2025 adalah?",
      en: "Which of the following is NOT included in calculations according to Permenperin No. 35 of 2025?"
    },
    options: {
      id: ["TKDN Jasa", "TKDN Gabungan Barang", "TKDN Gabungan Jasa", "TKDN Gabungan Barang dan Jasa"],
      en: ["Services TKDN", "Combined Goods TKDN", "Combined Services TKDN", "Combined Goods and Services TKDN"]
    },
    category: { id: "Lingkup Regulasi", en: "Regulatory Scope" },
    correctAnswerIndex: 2
  },
  {
    id: 9,
    text: {
      id: "Lingkup penilaian Bobot Manfaat Perusahaan (BMP) dalam Peraturan Menteri Perindustrian No 35 Tahun 2025 yaitu?",
      en: "The scope of Company Benefit Weight (BMP) assessment in Permenperin No. 35 of 2025 is?"
    },
    options: {
      id: ["Seluruh/sebagian pekerjanya adalah WNI", "Penambahan investasi baru", "Berinvestasi Di Dalam Negeri", "Semua Salah"],
      en: ["All/part of workers are Indonesian citizens", "Addition of new investment", "Investing domestically", "All Wrong"]
    },
    category: { id: "Ketentuan BMP", en: "BMP Rules" },
    correctAnswerIndex: 1
  },
  {
    id: 10,
    text: {
      id: "Pengawasan terhadap pelaksanaan peningkatan penggunaan produk dalam negeri dilakukan oleh?",
      en: "Supervision of the implementation of increasing domestic product use is conducted by?"
    },
    options: {
      id: ["Aparatur Pengawas Internal Pemerintah", "Pejabat Pengawas Internal", "Tim P3DN", "Semua Benar"],
      en: ["Government Internal Supervisory Apparatus", "Internal Supervisory Official", "P3DN Team", "All Correct"]
    },
    category: { id: "Pengawasan", en: "Supervision" },
    correctAnswerIndex: 3
  },
  {
    id: 11,
    text: {
      id: "Disebut apakah pengklasifikasian aktivitas ekonomi Indonesia berdasarkan lapangan usaha untuk memberikan keseragaman konsep dan definisi?",
      en: "What is the classification of Indonesian economic activities based on business fields to provide uniform concepts and definitions called?"
    },
    options: {
      id: ["KBBI", "KBKI", "KBLI", "KBJI"],
      en: ["KBBI", "KBKI", "KBLI", "KBJI"]
    },
    category: { id: "Klasifikasi", en: "Classification" },
    correctAnswerIndex: 2
  },
  {
    id: 12,
    text: {
      id: "Kapan diterbitkannya panduan klasifikasi baku (KBLI) yang menjadi acuan pada sistem OSS Berbasis Risiko saat ini?",
      en: "When was the standard classification guide (KBLI) currently used in the Risk-Based OSS system published?"
    },
    options: {
      id: ["2019", "2020", "2021", "2022"],
      en: ["2019", "2020", "2021", "2022"]
    },
    category: { id: "Referensi KBLI", en: "KBLI Reference" },
    correctAnswerIndex: 1
  },
  {
    id: 13,
    text: {
      id: "KBLI manakah yang dapat mengajukan sertifikasi TKDN?",
      en: "Which KBLI can apply for TKDN certification?"
    },
    options: {
      id: ["01121 – Pertanian Padi Hibrida", "23921 – Industri Mesin Percetakan", "45402 – Perdagangan Besar Sepeda Motor Bekas", "56210 – Jasa Boga Untuk Suatu Event Tertentu"],
      en: ["01121 – Hybrid Rice Farming", "23921 – Printing Machinery Industry", "45402 – Used Motorcycle Wholesale", "56210 – Event Catering"]
    },
    category: { id: "Keligibilitas", en: "Eligibility" },
    correctAnswerIndex: 1
  },
  {
    id: 14,
    text: {
      id: "Komponen utama yang tidak memiliki Sertifikat TKDN tetapi diproduksi di dalam negeri dengan bahan baku lokal dapat dinilai TKDN sebesar?",
      en: "Main components without a TKDN Certificate but produced domestically with local raw materials can be valued at?"
    },
    options: {
      id: ["0%", "25%", "50%", "100%"],
      en: ["0%", "25%", "50%", "100%"]
    },
    category: { id: "Penilaian Komponen", en: "Component Assessment" },
    correctAnswerIndex: 1
  },
  {
    id: 15,
    text: {
      id: "Barang yang tidak dapat dihitung nilai TKDN-nya adalah barang yang?",
      en: "Goods for which the TKDN value cannot be calculated are those that?"
    },
    options: {
      id: ["Diproduksi dengan mesin otomatis", "Diproduksi oleh industri kecil", "Seluruh komponennya berasal dari impor", "Menggunakan tenaga kerja asing"],
      en: ["Produced with automatic machines", "Produced by small industries", "All components are imported", "Using foreign labor"]
    },
    category: { id: "Pembatasan", en: "Restrictions" },
    correctAnswerIndex: 2
  },
  {
    id: 16,
    text: {
      id: "Dalam hal pembuktian kepemilikan pabrik, perusahaan dapat melampirkan bukti sebagai berikut, kecuali?",
      en: "In terms of proving factory ownership, a company can attach the following evidence, EXCEPT?"
    },
    options: {
      id: ["Tagihan PBB", "Akta kepemilikan tanah", "Surat perjanjian sewa Pabrik", "Akta cerai"],
      en: ["PBB Invoice", "Land ownership deed", "Factory lease agreement", "Divorce deed"]
    },
    category: { id: "Verifikasi Pabrik", en: "Factory Verification" },
    correctAnswerIndex: 3
  },
  {
    id: 17,
    text: {
      id: "Perusahaan dengan modal Rp 5 milyar tidak termasuk tanah dan bangunan dapat dikategorikan sebagai perusahaan?",
      en: "A company with capital of Rp 5 billion excluding land and building can be categorized as a company of?"
    },
    options: {
      id: ["Perseroan Terbatas", "CV", "Skala Kecil", "Perseorangan"],
      en: ["Limited Liability Company", "CV", "Small Scale", "Individual"]
    },
    category: { id: "Skala Usaha", en: "Business Scale" },
    correctAnswerIndex: 2
  },
  {
    id: 18,
    text: {
      id: "Berapa banyak pilihan faktor penentu yang diberikan dalam penghitungan BMP pada Permenperin 35 Tahun 2025?",
      en: "How many optional determinants are provided in the BMP calculation in Permenperin No. 35 of 2025?"
    },
    options: {
      id: ["5", "10", "15", "17"],
      en: ["5", "10", "15", "17"]
    },
    category: { id: "Faktor BMP", en: "BMP Factors" },
    correctAnswerIndex: 2
  },
  {
    id: 19,
    text: {
      id: "Biaya sewa dan biaya listrik merupakan factory overhead yang pada penghitungan diberikan bobot sebesar?",
      en: "Rent and electricity costs are factory overheads which are given a weight in the calculation of?"
    },
    options: {
      id: ["5%", "15%", "25%", "75%"],
      en: ["5%", "15%", "25%", "75%"]
    },
    category: { id: "Bobot Overhead", en: "Overhead Weight" },
    correctAnswerIndex: 1
  },
  {
    id: 20,
    text: {
      id: "Komponen utama yang tidak memiliki sertifikat TKDN diperhitungkan sebesar 100% apabila?",
      en: "Main components without a TKDN certificate are calculated at 100% if?"
    },
    options: {
      id: ["Diproduksi perusahaan dalam negeri", "Bahan Baku dari dalam negeri", "Diperoleh dari sumber daya alam dalam negeri", "Semunya benar"],
      en: ["Produced by a domestic company", "Raw materials from domestic sources", "Obtained from domestic natural resources", "All correct"]
    },
    category: { id: "Sertifikasi Komponen", en: "Component Certification" },
    correctAnswerIndex: 3
  },
  {
    id: 21,
    text: {
      id: "Perusahaan yang melakukan kegiatan Industri yang memiliki perizinan berusaha di bidang Industri selain Jasa Industri, merupakan pengertian dari?",
      en: "A company engaging in industrial activities with business permits in the industrial field besides industrial services is the definition of?"
    },
    options: {
      id: ["Perusahaan transportasi", "Perusahaan Industri", "Perusahaan tambang", "Perusahaan Manufaktur"],
      en: ["Transportation company", "Industrial Company", "Mining company", "Manufacturing company"]
    },
    category: { id: "Definisi Industri", en: "Industry Definition" },
    correctAnswerIndex: 1
  },
  {
    id: 22,
    text: {
      id: "Berapa nilai TKDN yang diperhitungkan apabila komponen utama yang digunakan memiliki nilai TKDN sebesar 25%?",
      en: "What is the calculated TKDN value if the main component used has a TKDN value of 25%?"
    },
    options: {
      id: ["25%", "28%", "15%", "30%"],
      en: ["25%", "28%", "15%", "30%"]
    },
    category: { id: "Simplifikasi", en: "Simplification" },
    correctAnswerIndex: 0
  },
  {
    id: 23,
    text: {
      id: "Laporan hasil verifikasi BMP pada pasal 34 Permenperin 35 Tahun 2025 paling sedikit memuat, kecuali?",
      en: "The BMP verification result report in Article 34 of Permenperin No. 35 of 2025 at least contains, EXCEPT?"
    },
    options: {
      id: ["Nama Perusahaan", "Alamat verifikator", "Alamat Pabrik", "Skala perusahaan"],
      en: ["Company Name", "Verifier address", "Factory Address", "Company scale"]
    },
    category: { id: "Laporan BMP", en: "BMP Report" },
    correctAnswerIndex: 1
  },
  {
    id: 24,
    text: {
      id: "Dalam 5 (lima) tahun berlakunya sertifikat TKDN dilakukan surveilans sebanyak?",
      en: "During the 5-year validity of a TKDN certificate, surveillance is conducted how many times?"
    },
    options: {
      id: ["1 (satu) kali", "2 (dua) kali", "Berkali - kali", "5 (lima) kali"],
      en: ["1 (one) time", "2 (two) times", "Multiple times", "5 (five) times"]
    },
    category: { id: "Surveilans", en: "Surveillance" },
    correctAnswerIndex: 0
  },
  {
    id: 25,
    text: {
      id: "Laporan hasil surveilans dapat dilakukan secara elektronik melalui?",
      en: "Surveillance result reports can be submitted electronically via?"
    },
    options: {
      id: ["Email Kemenperin", "SIINas", "Telegram", "Discord"],
      en: ["Ministry Email", "SIINas", "Telegram", "Discord"]
    },
    category: { id: "Sistem Pelaporan", en: "Reporting System" },
    correctAnswerIndex: 1
  }
];
