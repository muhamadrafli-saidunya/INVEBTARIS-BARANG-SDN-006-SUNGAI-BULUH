import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Database,
  Download,
  FileJson,
  HardDrive,
  LogOut,
  Moon,
  RefreshCw,
  RotateCcw,
  Save,
  School,
  ShieldCheck,
  Sun,
  Upload,
  UserCog,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/src/components/ui/dialog';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { SimpleSelect } from '@/src/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs';
import { Textarea } from '@/src/components/ui/textarea';
import { useInventory } from '@/src/context/InventoryContext';
import { useTheme } from '@/src/context/ThemeContext';
import { buildSeedSchoolProfile } from '@/src/data/seedData';
import {
  AKREDITASI_LIST,
  validateSchoolProfileForm,
  type DatabaseBackupPayload,
  type SchoolProfileFormValues,
  type StatusAkreditasi,
  type UserRole,
} from '@/src/types/inventory';

const ROLE_OPTIONS: Array<{ value: UserRole; label: string }> = [
  { value: 'admin', label: 'Administrator' },
  { value: 'operator', label: 'Operator Sarpras' },
  { value: 'kepala_sekolah', label: 'Kepala Sekolah' },
];

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrator',
  operator: 'Operator Sarpras',
  kepala_sekolah: 'Kepala Sekolah',
};

function toSchoolFormValues(
  profile: ReturnType<typeof useInventory>['schoolProfile'],
  fallbackUid: string
): SchoolProfileFormValues {
  const base = profile || buildSeedSchoolProfile(fallbackUid);
  return {
    namaSekolah: base.namaSekolah,
    npsn: base.npsn,
    statusAkreditasi: base.statusAkreditasi,
    alamat: base.alamat,
    kecamatan: base.kecamatan,
    kabupaten: base.kabupaten,
    provinsi: base.provinsi,
    kodePos: base.kodePos,
    telepon: base.telepon,
    emailSekolah: base.emailSekolah,
    kepalaSekolah: base.kepalaSekolah,
    nipKepalaSekolah: base.nipKepalaSekolah,
    pengurusBarang: base.pengurusBarang,
    tahunAnggaran: base.tahunAnggaran,
  };
}

export function SettingsScreen() {
  const {
    user,
    authMode,
    syncing,
    schoolProfile,
    rooms,
    items,
    auditLogs,
    updateSchoolProfile,
    updateAccountProfile,
    exportDatabaseBackup,
    restoreDatabaseBackup,
    resetDatabaseToSeed,
    loginWithGoogle,
    logout,
  } = useInventory();
  const { theme, setTheme } = useTheme();

  // Tab 1: School Profile Form
  const [profileForm, setProfileForm] = useState<SchoolProfileFormValues>(() =>
    toSchoolFormValues(schoolProfile, user?.uid || 'demo_operator_sdn006')
  );
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setProfileForm(toSchoolFormValues(schoolProfile, user?.uid || 'demo_operator_sdn006'));
    setProfileErrors({});
  }, [schoolProfile, user?.uid]);

  // Tab 2: Account Settings Form
  const [displayNameInput, setDisplayNameInput] = useState(user?.displayName || '');
  const [roleInput, setRoleInput] = useState<UserRole>(user?.role || 'operator');
  const [accountError, setAccountError] = useState('');

  useEffect(() => {
    if (user) {
      setDisplayNameInput(user.displayName);
      setRoleInput(user.role);
      setAccountError('');
    }
  }, [user]);

  const canChangeRole =
    authMode === 'demo' || user?.email === 'muhamad.rafli@gmail.com';

  // Tab 3: Backup & Restore State
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [parsedBackup, setParsedBackup] = useState<DatabaseBackupPayload | null>(null);
  const [backupFileName, setBackupFileName] = useState<string>('');
  const [backupParseError, setBackupParseError] = useState<string>('');
  const [restoreMode, setRestoreMode] = useState<'merge' | 'replace'>('merge');
  const [confirmRestoreOpen, setConfirmRestoreOpen] = useState(false);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const handleProfileFieldChange = <K extends keyof SchoolProfileFormValues>(
    field: K,
    value: SchoolProfileFormValues[K]
  ) => {
    setProfileForm((prev) => ({ ...prev, [field]: value }));
    if (profileErrors[field]) {
      setProfileErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleSaveSchoolProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateSchoolProfileForm(profileForm);
    setProfileErrors(errors);
    if (Object.keys(errors).length > 0) {
      toast.error('Periksa kembali isian profil sekolah yang belum valid.');
      return;
    }
    await updateSchoolProfile(profileForm);
  };

  const handleResetProfileDraft = () => {
    setProfileForm(toSchoolFormValues(schoolProfile, user?.uid || 'demo_operator_sdn006'));
    setProfileErrors({});
    toast.info('Perubahan formulir dikembalikan ke data tersimpan.');
  };

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = displayNameInput.trim();
    if (clean.length < 2 || clean.length > 100) {
      setAccountError('Nama tampilan wajib 2–100 karakter.');
      return;
    }
    setAccountError('');
    await updateAccountProfile(clean, canChangeRole ? roleInput : undefined);
  };

  const handleDownloadBackup = () => {
    const payload = exportDatabaseBackup();
    const jsonString = JSON.stringify(payload, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const today = new Date().toISOString().slice(0, 10);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup-inventaris-sdn006-sungai-buluh-${today}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Berkas cadangan database (.json) berhasil diunduh.');
  };

  const handleBackupFileSelected = async (file: File | undefined) => {
    if (!file) return;
    setBackupParseError('');
    setParsedBackup(null);
    setBackupFileName(file.name);

    try {
      const text = await file.text();
      const raw = JSON.parse(text) as Partial<DatabaseBackupPayload>;

      if (!raw || typeof raw !== 'object' || !Array.isArray(raw.rooms) || !Array.isArray(raw.items)) {
        setBackupParseError(
          'Format file JSON tidak valid. Pastikan file berasal dari ekspor cadangan sistem ini.'
        );
        return;
      }

      const normalized: DatabaseBackupPayload = {
        schemaVersion: String(raw.schemaVersion || '1.0'),
        exportedAt: String(raw.exportedAt || new Date().toISOString()),
        appName: String(raw.appName || 'INVENTARIS BARANG SDN 006 SUNGAI BULUH'),
        schoolProfile: raw.schoolProfile || null,
        rooms: raw.rooms,
        items: raw.items,
        auditLogs: Array.isArray(raw.auditLogs) ? raw.auditLogs : [],
      };

      setParsedBackup(normalized);
      toast.success(`Berkas "${file.name}" siap dipulihkan.`);
    } catch {
      setBackupParseError('Gagal membaca berkas JSON. Periksa integritas file cadangan Anda.');
    }
  };

  const executeRestore = async () => {
    if (!parsedBackup) return;
    setRestoring(true);
    try {
      await restoreDatabaseBackup(parsedBackup, restoreMode);
      setConfirmRestoreOpen(false);
      setParsedBackup(null);
      setBackupFileName('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } finally {
      setRestoring(false);
    }
  };

  const executeResetToSeed = async () => {
    setRestoring(true);
    try {
      await resetDatabaseToSeed();
      setConfirmResetOpen(false);
    } finally {
      setRestoring(false);
    }
  };

  const userInitials = (user?.displayName || 'OP')
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
            Pengaturan Sistem & Sekolah
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Kelola identitas resmi sekolah, profil akun pengelola, serta cadangan & pemulihan database.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge tone={authMode === 'firebase' ? 'success' : 'warning'}>
            <HardDrive className="h-3.5 w-3.5" />
            <span>
              {authMode === 'firebase' ? 'Firebase Firestore Aktif' : 'Penyimpanan Browser Lokal'}
            </span>
          </Badge>
        </div>
      </div>

      {/* Main Settings Tabs */}
      <Tabs defaultValue="profil-sekolah" className="w-full">
        <TabsList className="w-full sm:w-auto flex-wrap h-auto">
          <TabsTrigger value="profil-sekolah" className="gap-1.5 px-4 py-2">
            <School className="h-4 w-4" />
            <span>Profil Sekolah</span>
          </TabsTrigger>
          <TabsTrigger value="akun" className="gap-1.5 px-4 py-2">
            <UserCog className="h-4 w-4" />
            <span>Pengaturan Akun</span>
          </TabsTrigger>
          <TabsTrigger value="database" className="gap-1.5 px-4 py-2">
            <Database className="h-4 w-4" />
            <span>Penyimpanan & Pemulihan</span>
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: PROFIL SEKOLAH */}
        <TabsContent value="profil-sekolah">
          <form onSubmit={handleSaveSchoolProfile} className="space-y-6">
            <Card>
              <CardHeader className="border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-[#00529C] dark:text-sky-400" />
                      <span>Identitas & Alamat Satuan Pendidikan</span>
                    </CardTitle>
                    <CardDescription>
                      Informasi resmi ini digunakan sebagai identitas aplikasi dan kop laporan inventaris.
                    </CardDescription>
                  </div>
                  <Badge tone="info" className="font-mono">
                    NPSN: {profileForm.npsn || '-'}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="pt-6 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="md:col-span-2 space-y-1.5">
                    <Label htmlFor="namaSekolah">Nama Sekolah *</Label>
                    <Input
                      id="namaSekolah"
                      value={profileForm.namaSekolah}
                      onChange={(e) => handleProfileFieldChange('namaSekolah', e.target.value)}
                      placeholder="Contoh: SDN 006 SUNGAI BULUH"
                      className={profileErrors.namaSekolah ? 'border-red-500' : ''}
                    />
                    {profileErrors.namaSekolah && (
                      <p className="text-xs text-red-600 dark:text-red-400">
                        {profileErrors.namaSekolah}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="npsn">NPSN *</Label>
                    <Input
                      id="npsn"
                      value={profileForm.npsn}
                      onChange={(e) => handleProfileFieldChange('npsn', e.target.value)}
                      placeholder="10402006"
                      className={`font-mono ${profileErrors.npsn ? 'border-red-500' : ''}`}
                    />
                    {profileErrors.npsn && (
                      <p className="text-xs text-red-600 dark:text-red-400">{profileErrors.npsn}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="statusAkreditasi">Akreditasi *</Label>
                      <SimpleSelect
                        id="statusAkreditasi"
                        value={profileForm.statusAkreditasi}
                        onValueChange={(val) =>
                          handleProfileFieldChange('statusAkreditasi', val as StatusAkreditasi)
                        }
                        options={AKREDITASI_LIST.map((ak) => ({
                          value: ak,
                          label: ak === 'Belum Terakreditasi' ? 'Belum' : `Nilai ${ak}`,
                        }))}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="tahunAnggaran">Thn. Anggaran *</Label>
                      <Input
                        id="tahunAnggaran"
                        value={profileForm.tahunAnggaran}
                        onChange={(e) => handleProfileFieldChange('tahunAnggaran', e.target.value)}
                        placeholder="2026"
                        maxLength={4}
                        className={`font-mono ${profileErrors.tahunAnggaran ? 'border-red-500' : ''}`}
                      />
                      {profileErrors.tahunAnggaran && (
                        <p className="text-xs text-red-600 dark:text-red-400">
                          {profileErrors.tahunAnggaran}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="alamat">Alamat Lengkap Sekolah *</Label>
                  <Textarea
                    id="alamat"
                    value={profileForm.alamat}
                    onChange={(e) => handleProfileFieldChange('alamat', e.target.value)}
                    placeholder="Jalan / Dusun / Desa..."
                    className={`min-h-[72px] ${profileErrors.alamat ? 'border-red-500' : ''}`}
                  />
                  {profileErrors.alamat && (
                    <p className="text-xs text-red-600 dark:text-red-400">{profileErrors.alamat}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="kecamatan">Kecamatan *</Label>
                    <Input
                      id="kecamatan"
                      value={profileForm.kecamatan}
                      onChange={(e) => handleProfileFieldChange('kecamatan', e.target.value)}
                      className={profileErrors.kecamatan ? 'border-red-500' : ''}
                    />
                    {profileErrors.kecamatan && (
                      <p className="text-xs text-red-600 dark:text-red-400">
                        {profileErrors.kecamatan}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="kabupaten">Kabupaten / Kota *</Label>
                    <Input
                      id="kabupaten"
                      value={profileForm.kabupaten}
                      onChange={(e) => handleProfileFieldChange('kabupaten', e.target.value)}
                      className={profileErrors.kabupaten ? 'border-red-500' : ''}
                    />
                    {profileErrors.kabupaten && (
                      <p className="text-xs text-red-600 dark:text-red-400">
                        {profileErrors.kabupaten}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="provinsi">Provinsi *</Label>
                    <Input
                      id="provinsi"
                      value={profileForm.provinsi}
                      onChange={(e) => handleProfileFieldChange('provinsi', e.target.value)}
                      className={profileErrors.provinsi ? 'border-red-500' : ''}
                    />
                    {profileErrors.provinsi && (
                      <p className="text-xs text-red-600 dark:text-red-400">
                        {profileErrors.provinsi}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="kodePos">Kode Pos *</Label>
                    <Input
                      id="kodePos"
                      value={profileForm.kodePos}
                      onChange={(e) => handleProfileFieldChange('kodePos', e.target.value)}
                      maxLength={5}
                      className={`font-mono ${profileErrors.kodePos ? 'border-red-500' : ''}`}
                    />
                    {profileErrors.kodePos && (
                      <p className="text-xs text-red-600 dark:text-red-400">
                        {profileErrors.kodePos}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="telepon">Nomor Telepon</Label>
                    <Input
                      id="telepon"
                      value={profileForm.telepon}
                      onChange={(e) => handleProfileFieldChange('telepon', e.target.value)}
                      placeholder="0761-000000"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="emailSekolah">Email Resmi Sekolah *</Label>
                    <Input
                      id="emailSekolah"
                      type="email"
                      value={profileForm.emailSekolah}
                      onChange={(e) => handleProfileFieldChange('emailSekolah', e.target.value)}
                      placeholder="admin@sdn006sungaibuluh.sch.id"
                      className={profileErrors.emailSekolah ? 'border-red-500' : ''}
                    />
                    {profileErrors.emailSekolah && (
                      <p className="text-xs text-red-600 dark:text-red-400">
                        {profileErrors.emailSekolah}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="border-b border-slate-100 dark:border-slate-800">
                <CardTitle>Pejabat Penanggung Jawab Inventaris</CardTitle>
                <CardDescription>
                  Data Kepala Sekolah dan Pengurus Barang untuk pengesahan dokumen aset sekolah.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="kepalaSekolah">Nama Kepala Sekolah *</Label>
                    <Input
                      id="kepalaSekolah"
                      value={profileForm.kepalaSekolah}
                      onChange={(e) => handleProfileFieldChange('kepalaSekolah', e.target.value)}
                      className={profileErrors.kepalaSekolah ? 'border-red-500' : ''}
                    />
                    {profileErrors.kepalaSekolah && (
                      <p className="text-xs text-red-600 dark:text-red-400">
                        {profileErrors.kepalaSekolah}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="nipKepalaSekolah">NIP Kepala Sekolah</Label>
                    <Input
                      id="nipKepalaSekolah"
                      value={profileForm.nipKepalaSekolah}
                      onChange={(e) => handleProfileFieldChange('nipKepalaSekolah', e.target.value)}
                      placeholder="19720415 199803 1 006"
                      className="font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="pengurusBarang">Pengurus / Operator Barang *</Label>
                    <Input
                      id="pengurusBarang"
                      value={profileForm.pengurusBarang}
                      onChange={(e) => handleProfileFieldChange('pengurusBarang', e.target.value)}
                      className={profileErrors.pengurusBarang ? 'border-red-500' : ''}
                    />
                    {profileErrors.pengurusBarang && (
                      <p className="text-xs text-red-600 dark:text-red-400">
                        {profileErrors.pengurusBarang}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="justify-between gap-3 flex-wrap">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Terakhir diperbarui:{' '}
                  <span className="font-mono">
                    {schoolProfile?.updatedAt
                      ? new Date(schoolProfile.updatedAt).toLocaleString('id-ID')
                      : '-'}
                  </span>
                </span>
                <div className="flex items-center gap-2.5">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleResetProfileDraft}
                    disabled={syncing}
                  >
                    <RotateCcw className="h-4 w-4" />
                    <span>Batalkan Perubahan</span>
                  </Button>
                  <Button type="submit" disabled={syncing}>
                    <Save className="h-4 w-4" />
                    <span>{syncing ? 'Menyimpan...' : 'Simpan Profil Sekolah'}</span>
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </form>
        </TabsContent>

        {/* TAB 2: PENGATURAN AKUN */}
        <TabsContent value="akun">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader className="border-b border-slate-100 dark:border-slate-800">
                <CardTitle>Profil Akun Pengelola</CardTitle>
                <CardDescription>
                  Perbarui nama petugas yang tercatat otomatis pada setiap riwayat audit inventaris.
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleSaveAccount}>
                <CardContent className="pt-6 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
                    {user?.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt={user.displayName}
                        referrerPolicy="no-referrer"
                        className="h-14 w-14 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                      />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#00529C] text-lg font-bold text-white shrink-0">
                        {userInitials}
                      </div>
                    )}
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-display font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {user?.displayName || 'Petugas Inventaris'}
                        </span>
                        <Badge tone="info">
                          <ShieldCheck className="h-3 w-3" />
                          <span>{ROLE_LABELS[user?.role || 'operator']}</span>
                        </Badge>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {user?.email}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 dark:text-slate-500 truncate">
                        ID Pengguna: {user?.uid}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="accountDisplayName">Nama Tampilan Petugas *</Label>
                      <Input
                        id="accountDisplayName"
                        value={displayNameInput}
                        onChange={(e) => {
                          setDisplayNameInput(e.target.value);
                          if (accountError) setAccountError('');
                        }}
                        placeholder="Masukkan nama petugas"
                        className={accountError ? 'border-red-500' : ''}
                      />
                      {accountError && (
                        <p className="text-xs text-red-600 dark:text-red-400">{accountError}</p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="accountRole">Peran Akses</Label>
                      {canChangeRole ? (
                        <SimpleSelect
                          id="accountRole"
                          value={roleInput}
                          onValueChange={(val) => setRoleInput(val as UserRole)}
                          options={ROLE_OPTIONS}
                        />
                      ) : (
                        <Input
                          id="accountRole"
                          value={ROLE_LABELS[roleInput]}
                          disabled
                          readOnly
                        />
                      )}
                      {!canChangeRole && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Peran akun dikelola oleh administrator sistem.
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="justify-end">
                  <Button type="submit" disabled={syncing}>
                    <Save className="h-4 w-4" />
                    <span>{syncing ? 'Menyimpan...' : 'Simpan Pengaturan Akun'}</span>
                  </Button>
                </CardFooter>
              </form>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader className="border-b border-slate-100 dark:border-slate-800">
                  <CardTitle>Tema Tampilan</CardTitle>
                  <CardDescription>Sesuaikan kenyamanan visual dashboard.</CardDescription>
                </CardHeader>
                <CardContent className="pt-5 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setTheme('light')}
                    className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-xs font-medium transition-all cursor-pointer ${
                      theme === 'light'
                        ? 'border-[#00529C] bg-sky-50/70 text-[#00529C] ring-1 ring-[#00529C]'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <Sun className="h-5 w-5 text-[#F37021]" />
                    <span>Mode Terang</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme('dark')}
                    className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-xs font-medium transition-all cursor-pointer ${
                      theme === 'dark'
                        ? 'border-sky-500 bg-sky-950/50 text-sky-300 ring-1 ring-sky-500'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <Moon className="h-5 w-5 text-[#00529C] dark:text-sky-400" />
                    <span>Mode Gelap</span>
                  </button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="border-b border-slate-100 dark:border-slate-800">
                  <CardTitle>Koneksi & Sesi Login</CardTitle>
                  <CardDescription>
                    Status otentikasi dan sinkronisasi cloud Anda.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-5 space-y-4">
                  {authMode === 'demo' ? (
                    <div className="rounded-lg border border-orange-200 dark:border-orange-900/60 bg-orange-50/70 dark:bg-orange-950/30 p-3.5 space-y-3">
                      <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        Sedang Menggunakan Mode Pratinjau Lokal
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        Hubungkan akun Google agar data inventaris, profil sekolah, dan log audit
                        tersimpan permanen di Firebase Firestore.
                      </p>
                      <Button
                        type="button"
                        variant="accent"
                        className="w-full"
                        onClick={loginWithGoogle}
                      >
                        Hubungkan Akun Google
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2.5 rounded-lg border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/60 dark:bg-emerald-950/30 p-3.5 text-xs text-emerald-800 dark:text-emerald-300">
                      <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                      <span>
                        Akun Google terhubung. Seluruh perubahan otomatis tersinkronisasi ke Firebase
                        Firestore secara real-time.
                      </span>
                    </div>
                  )}

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full text-red-600 hover:text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 border-red-200 dark:border-red-900/60"
                    onClick={logout}
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Keluar dari Sesi</span>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* TAB 3: PENYIMPANAN & PEMULIHAN DATABASE */}
        <TabsContent value="database" className="space-y-6">
          {/* Storage Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-5 pb-5">
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Data Barang Inventaris
                </div>
                <div className="mt-1.5 font-mono text-2xl font-bold tabular-nums text-[#00529C] dark:text-sky-400">
                  {items.length}
                </div>
                <div className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                  Dokumen aset tercatat
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5 pb-5">
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Ruangan & Lokasi
                </div>
                <div className="mt-1.5 font-mono text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-100">
                  {rooms.length}
                </div>
                <div className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                  Unit ruangan aktif
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5 pb-5">
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Riwayat Log Audit
                </div>
                <div className="mt-1.5 font-mono text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-100">
                  {auditLogs.length}
                </div>
                <div className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                  Rekam jejak verifikasi
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5 pb-5">
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Profil Sekolah
                </div>
                <div className="mt-1.5 font-mono text-2xl font-bold tabular-nums text-[#F37021]">
                  {schoolProfile ? '1' : '0'}
                </div>
                <div className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                  {authMode === 'firebase' ? 'Tersimpan di Cloud' : 'Tersimpan Lokal'}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Backup Section */}
            <Card className="flex flex-col">
              <CardHeader className="border-b border-slate-100 dark:border-slate-800">
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-4 w-4 text-[#00529C] dark:text-sky-400" />
                  <span>Cadangkan Database (.json)</span>
                </CardTitle>
                <CardDescription>
                  Unduh salinan lengkap seluruh database (profil sekolah, ruangan, barang inventaris,
                  dan log audit) sebagai arsip offline atau sebelum pemeliharaan data.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 flex-1 space-y-4">
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-4 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                  <div className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <FileJson className="h-4 w-4 text-[#F37021]" />
                    <span>Isi Paket Cadangan</span>
                  </div>
                  <ul className="space-y-1 pl-5 list-disc text-slate-500 dark:text-slate-400">
                    <li>Identitas & pejabat sekolah ({schoolProfile?.namaSekolah || 'SDN 006'})</li>
                    <li>
                      <span className="font-mono tabular-nums">{rooms.length}</span> data ruangan &
                      penanggung jawab
                    </li>
                    <li>
                      <span className="font-mono tabular-nums">{items.length}</span> item barang
                      inventaris beserta nilai aset
                    </li>
                    <li>
                      <span className="font-mono tabular-nums">{auditLogs.length}</span> catatan log
                      audit verifikasi
                    </li>
                  </ul>
                </div>
              </CardContent>
              <CardFooter className="justify-end">
                <Button type="button" onClick={handleDownloadBackup} disabled={syncing}>
                  <Download className="h-4 w-4" />
                  <span>Unduh Cadangan Database (.json)</span>
                </Button>
              </CardFooter>
            </Card>

            {/* Restore Section */}
            <Card className="flex flex-col">
              <CardHeader className="border-b border-slate-100 dark:border-slate-800">
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-4 w-4 text-[#F37021]" />
                  <span>Pulihkan Database dari Cadangan</span>
                </CardTitle>
                <CardDescription>
                  Unggah berkas <span className="font-mono">.json</span> hasil cadangan untuk
                  menggabungkan atau mengganti data inventaris saat ini.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 flex-1 space-y-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  onChange={(e) => handleBackupFileSelected(e.target.files?.[0])}
                />

                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => fileInputRef.current?.click()}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click();
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleBackupFileSelected(e.dataTransfer.files?.[0]);
                  }}
                  className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 px-4 py-6 text-center hover:border-[#00529C] dark:hover:border-sky-500 transition-colors cursor-pointer"
                >
                  <Upload className="h-7 w-7 text-slate-400 mb-2" />
                  <div className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    {backupFileName || 'Pilih atau seret berkas cadangan (.json)'}
                  </div>
                  <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                    Hanya mendukung berkas JSON hasil ekspor aplikasi ini
                  </div>
                </div>

                {backupParseError && (
                  <div className="rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 p-3 text-xs text-red-700 dark:text-red-300">
                    {backupParseError}
                  </div>
                )}

                {parsedBackup && (
                  <div className="space-y-3 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                        Pratinjau Berkas Cadangan Valid
                      </span>
                      <Badge tone="neutral" className="font-mono text-[11px]">
                        v{parsedBackup.schemaVersion}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2">
                        <div className="font-mono text-sm font-bold tabular-nums">
                          {parsedBackup.rooms.length}
                        </div>
                        <div className="text-[11px] text-slate-500">Ruangan</div>
                      </div>
                      <div className="rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2">
                        <div className="font-mono text-sm font-bold tabular-nums">
                          {parsedBackup.items.length}
                        </div>
                        <div className="text-[11px] text-slate-500">Barang</div>
                      </div>
                      <div className="rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2">
                        <div className="font-mono text-sm font-bold tabular-nums">
                          {parsedBackup.auditLogs.length}
                        </div>
                        <div className="text-[11px] text-slate-500">Log Audit</div>
                      </div>
                    </div>

                    <div className="space-y-2 pt-1">
                      <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                        Mode Pemulihan
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setRestoreMode('merge')}
                          className={`rounded-lg border p-2.5 text-left transition-all cursor-pointer ${
                            restoreMode === 'merge'
                              ? 'border-[#00529C] bg-sky-50/70 dark:bg-sky-950/40 ring-1 ring-[#00529C]'
                              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                          }`}
                        >
                          <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                            Gabungkan Data
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            Tambahkan data cadangan tanpa menghapus data saat ini.
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => setRestoreMode('replace')}
                          className={`rounded-lg border p-2.5 text-left transition-all cursor-pointer ${
                            restoreMode === 'replace'
                              ? 'border-[#F37021] bg-orange-50/70 dark:bg-orange-950/40 ring-1 ring-[#F37021]'
                              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                          }`}
                        >
                          <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                            Ganti Seluruh Data
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            Hapus barang & ruangan saat ini lalu pulihkan penuh.
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="justify-end gap-2">
                {parsedBackup && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setParsedBackup(null);
                      setBackupFileName('');
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    disabled={restoring || syncing}
                  >
                    Batal
                  </Button>
                )}
                <Button
                  type="button"
                  variant="accent"
                  disabled={!parsedBackup || restoring || syncing}
                  onClick={() => setConfirmRestoreOpen(true)}
                >
                  <RefreshCw className={`h-4 w-4 ${restoring ? 'animate-spin' : ''}`} />
                  <span>{restoring ? 'Memulihkan...' : 'Pulihkan Database'}</span>
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* Reset to Initial School Seed */}
          <Card className="border-red-200 dark:border-red-900/60">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Reset ke Data Awal Sekolah</span>
                  </CardTitle>
                  <CardDescription>
                    Mengembalikan seluruh data barang, ruangan, dan profil sekolah ke dataset awal
                    standar SDN 006 Sungai Buluh. Disarankan mengunduh cadangan terlebih dahulu.
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setConfirmResetOpen(true)}
                  disabled={restoring || syncing}
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>Reset Data Awal</span>
                </Button>
              </div>
            </CardHeader>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Confirm Restore Dialog */}
      <Dialog open={confirmRestoreOpen} onOpenChange={setConfirmRestoreOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Konfirmasi Pemulihan Database</DialogTitle>
            <DialogDescription>
              {restoreMode === 'replace'
                ? `Seluruh data barang dan ruangan Anda saat ini akan diganti dengan ${parsedBackup?.rooms.length || 0} ruangan dan ${parsedBackup?.items.length || 0} barang dari berkas "${backupFileName}".`
                : `Sebanyak ${parsedBackup?.rooms.length || 0} ruangan dan ${parsedBackup?.items.length || 0} barang dari berkas "${backupFileName}" akan digabungkan ke database saat ini.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmRestoreOpen(false)}
              disabled={restoring}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant={restoreMode === 'replace' ? 'destructive' : 'default'}
              onClick={executeRestore}
              disabled={restoring}
            >
              {restoring ? 'Memproses...' : 'Ya, Pulihkan Sekarang'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Reset to Seed Dialog */}
      <Dialog open={confirmResetOpen} onOpenChange={setConfirmResetOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reset Database ke Data Awal?</DialogTitle>
            <DialogDescription>
              Tindakan ini akan mengganti seluruh data ruangan, barang inventaris, dan profil sekolah
              saat ini dengan data bawaan awal SDN 006 Sungai Buluh. Pastikan Anda sudah membuat
              cadangan jika masih diperlukan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmResetOpen(false)}
              disabled={restoring}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={executeResetToSeed}
              disabled={restoring}
            >
              {restoring ? 'Mereset...' : 'Ya, Reset Data Awal'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
