export const KATEGORI_LIST = [
  'Mebel & Furnitur',
  'Elektronik & IT',
  'Alat Peraga',
  'Buku & Perpustakaan',
  'Olahraga & UKS',
  'Operasional Kantor',
] as const;

export const SATUAN_LIST = ['Unit', 'Buah', 'Set', 'Eksemplar', 'Paket'] as const;

export const KONDISI_LIST = ['Baik', 'Rusak Ringan', 'Rusak Berat'] as const;

export const STATUS_VERIFIKASI_LIST = [
  'Terverifikasi',
  'Perlu Audit',
  'Menunggu Penghapusan',
] as const;

export const SUMBER_DANA_LIST = [
  'BOS Reguler',
  'BOS Daerah',
  'APBD',
  'Hibah Komite',
] as const;

export const AKREDITASI_LIST = ['A', 'B', 'C', 'Belum Terakreditasi'] as const;

export type StatusAkreditasi = (typeof AKREDITASI_LIST)[number];

export type KategoriBarang = (typeof KATEGORI_LIST)[number];
export type SatuanBarang = (typeof SATUAN_LIST)[number];
export type KondisiBarang = (typeof KONDISI_LIST)[number];
export type StatusVerifikasi = (typeof STATUS_VERIFIKASI_LIST)[number];
export type SumberDana = (typeof SUMBER_DANA_LIST)[number];
export type UserRole = 'admin' | 'operator' | 'kepala_sekolah';
export type AksiAudit = 'Tambah Barang' | 'Perbarui Data' | 'Audit Kondisi' | 'Hapus Barang';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  role: UserRole;
  photoURL?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Room {
  id: string;
  kodeRuang: string;
  namaRuang: string;
  penanggungJawab: string;
  kapasitasBarang: number;
  lokasi: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryItem {
  id: string;
  kodeBarang: string;
  namaBarang: string;
  kategori: KategoriBarang;
  ruangan: string;
  roomId: string;
  jumlah: number;
  satuan: SatuanBarang;
  kondisi: KondisiBarang;
  statusVerifikasi: StatusVerifikasi;
  sumberDana: SumberDana;
  hargaSatuan: number;
  tanggalPerolehan: string;
  keterangan: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  itemId: string;
  kodeBarang: string;
  namaBarang: string;
  aksi: AksiAudit;
  catatan: string;
  petugas: string;
  ownerId: string;
  createdAt: string;
}

export interface InventoryFormValues {
  kodeBarang: string;
  namaBarang: string;
  kategori: KategoriBarang;
  roomId: string;
  jumlah: number;
  satuan: SatuanBarang;
  kondisi: KondisiBarang;
  statusVerifikasi: StatusVerifikasi;
  sumberDana: SumberDana;
  hargaSatuan: number;
  tanggalPerolehan: string;
  keterangan: string;
}

export interface RoomFormValues {
  kodeRuang: string;
  namaRuang: string;
  penanggungJawab: string;
  kapasitasBarang: number;
  lokasi: string;
}

export interface SchoolProfile {
  id: string;
  ownerId: string;
  namaSekolah: string;
  npsn: string;
  statusAkreditasi: StatusAkreditasi;
  alamat: string;
  kecamatan: string;
  kabupaten: string;
  provinsi: string;
  kodePos: string;
  telepon: string;
  emailSekolah: string;
  kepalaSekolah: string;
  nipKepalaSekolah: string;
  pengurusBarang: string;
  tahunAnggaran: string;
  createdAt: string;
  updatedAt: string;
}

export type SchoolProfileFormValues = Omit<
  SchoolProfile,
  'id' | 'ownerId' | 'createdAt' | 'updatedAt'
>;

export interface DatabaseBackupPayload {
  schemaVersion: string;
  exportedAt: string;
  appName: string;
  schoolProfile: SchoolProfile | null;
  rooms: Room[];
  items: InventoryItem[];
  auditLogs: AuditLog[];
}

// Validation constants synchronized verbatim with firebase-blueprint.json
export const BLUEPRINT_CONSTRAINTS = {
  idRegex: /^[a-zA-Z0-9_-]+$/,
  kodeBarangRegex: /^[A-Z0-9._-]+$/,
  kodeRuangRegex: /^[A-Z0-9._-]+$/,
  dateRegex: /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/,
  maxIdLength: 128,
  maxKodeBarangLength: 40,
  maxNamaBarangLength: 120,
  maxRuanganLength: 80,
  maxKeteranganLength: 400,
  maxKodeRuangLength: 30,
  maxPenanggungJawabLength: 80,
  maxLokasiLength: 100,
  maxCatatanLength: 300,
};

export function validateInventoryForm(values: InventoryFormValues): Record<string, string> {
  const errors: Record<string, string> = {};
  const kode = values.kodeBarang.trim().toUpperCase();
  if (kode.length < 3 || kode.length > BLUEPRINT_CONSTRAINTS.maxKodeBarangLength) {
    errors.kodeBarang = `Kode barang wajib 3–${BLUEPRINT_CONSTRAINTS.maxKodeBarangLength} karakter.`;
  } else if (!BLUEPRINT_CONSTRAINTS.kodeBarangRegex.test(kode)) {
    errors.kodeBarang = 'Kode barang hanya boleh berisi huruf kapital, angka, titik, strip, atau garis bawah.';
  }

  const nama = values.namaBarang.trim();
  if (nama.length < 2 || nama.length > BLUEPRINT_CONSTRAINTS.maxNamaBarangLength) {
    errors.namaBarang = `Nama barang wajib 2–${BLUEPRINT_CONSTRAINTS.maxNamaBarangLength} karakter.`;
  }

  if (!values.roomId || !BLUEPRINT_CONSTRAINTS.idRegex.test(values.roomId)) {
    errors.roomId = 'Pilih ruangan penyimpanan yang valid.';
  }

  if (!Number.isFinite(values.jumlah) || values.jumlah < 0 || values.jumlah > 1000000) {
    errors.jumlah = 'Jumlah unit harus antara 0 hingga 1.000.000.';
  }

  if (!Number.isFinite(values.hargaSatuan) || values.hargaSatuan < 0 || values.hargaSatuan > 10000000000) {
    errors.hargaSatuan = 'Harga satuan tidak valid.';
  }

  if (!BLUEPRINT_CONSTRAINTS.dateRegex.test(values.tanggalPerolehan)) {
    errors.tanggalPerolehan = 'Format tanggal harus YYYY-MM-DD.';
  }

  if (values.keterangan.length > BLUEPRINT_CONSTRAINTS.maxKeteranganLength) {
    errors.keterangan = `Keterangan maksimal ${BLUEPRINT_CONSTRAINTS.maxKeteranganLength} karakter.`;
  }

  return errors;
}

export function validateRoomForm(values: RoomFormValues): Record<string, string> {
  const errors: Record<string, string> = {};
  const kode = values.kodeRuang.trim().toUpperCase();
  if (kode.length < 2 || kode.length > BLUEPRINT_CONSTRAINTS.maxKodeRuangLength) {
    errors.kodeRuang = `Kode ruang wajib 2–${BLUEPRINT_CONSTRAINTS.maxKodeRuangLength} karakter.`;
  } else if (!BLUEPRINT_CONSTRAINTS.kodeRuangRegex.test(kode)) {
    errors.kodeRuang = 'Kode ruang hanya boleh huruf kapital, angka, titik, strip, atau garis bawah.';
  }

  if (values.namaRuang.trim().length < 2 || values.namaRuang.trim().length > BLUEPRINT_CONSTRAINTS.maxRuanganLength) {
    errors.namaRuang = `Nama ruangan wajib 2–${BLUEPRINT_CONSTRAINTS.maxRuanganLength} karakter.`;
  }

  if (values.penanggungJawab.trim().length < 2 || values.penanggungJawab.trim().length > BLUEPRINT_CONSTRAINTS.maxPenanggungJawabLength) {
    errors.penanggungJawab = 'Nama penanggung jawab wajib diisi.';
  }

  if (!Number.isFinite(values.kapasitasBarang) || values.kapasitasBarang < 1 || values.kapasitasBarang > 100000) {
    errors.kapasitasBarang = 'Kapasitas barang minimal 1.';
  }

  if (values.lokasi.trim().length < 2 || values.lokasi.trim().length > BLUEPRINT_CONSTRAINTS.maxLokasiLength) {
    errors.lokasi = 'Lokasi gedung/lantai wajib diisi.';
  }

  return errors;
}

export function validateSchoolProfileForm(values: SchoolProfileFormValues): Record<string, string> {
  const errors: Record<string, string> = {};
  if (values.namaSekolah.trim().length < 2 || values.namaSekolah.trim().length > 120) {
    errors.namaSekolah = 'Nama sekolah wajib 2–120 karakter.';
  }
  if (!/^[0-9]{4,16}$/.test(values.npsn.trim())) {
    errors.npsn = 'NPSN harus berupa 4–16 digit angka.';
  }
  if (values.alamat.trim().length < 2 || values.alamat.trim().length > 200) {
    errors.alamat = 'Alamat sekolah wajib 2–200 karakter.';
  }
  if (values.kecamatan.trim().length < 2 || values.kecamatan.trim().length > 80) {
    errors.kecamatan = 'Kecamatan wajib diisi.';
  }
  if (values.kabupaten.trim().length < 2 || values.kabupaten.trim().length > 80) {
    errors.kabupaten = 'Kabupaten/Kota wajib diisi.';
  }
  if (values.provinsi.trim().length < 2 || values.provinsi.trim().length > 80) {
    errors.provinsi = 'Provinsi wajib diisi.';
  }
  if (!/^[0-9]{5}$/.test(values.kodePos.trim())) {
    errors.kodePos = 'Kode pos wajib 5 digit angka.';
  }
  if (values.emailSekolah.trim().length < 3 || !values.emailSekolah.includes('@')) {
    errors.emailSekolah = 'Masukkan alamat email sekolah yang valid.';
  }
  if (values.kepalaSekolah.trim().length < 2 || values.kepalaSekolah.trim().length > 100) {
    errors.kepalaSekolah = 'Nama Kepala Sekolah wajib diisi.';
  }
  if (values.pengurusBarang.trim().length < 2 || values.pengurusBarang.trim().length > 100) {
    errors.pengurusBarang = 'Nama Pengurus Barang wajib diisi.';
  }
  if (!/^[0-9]{4}$/.test(values.tahunAnggaran.trim())) {
    errors.tahunAnggaran = 'Tahun anggaran harus 4 digit (contoh: 2026).';
  }
  return errors;
}
