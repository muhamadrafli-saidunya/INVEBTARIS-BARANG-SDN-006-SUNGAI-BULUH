import { ArrowRight, CheckCircle2, Database, Moon, ShieldCheck, Sun } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { useInventory } from '@/src/context/InventoryContext';
import { useTheme } from '@/src/context/ThemeContext';

const CREST_SRC = '/src/assets/images/sdn_school_crest_1795594106696.jpg';

export function LoginScreen() {
  const { loginWithGoogle, loginDemoMode, authError, loadingAuth } = useInventory();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <header className="w-full border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-8 px-6 py-3.5">
          <div className="flex items-center gap-3 whitespace-nowrap shrink-0">
            <img
              src={CREST_SRC}
              alt="Lambang SDN 006 Sungai Buluh"
              referrerPolicy="no-referrer"
              className="h-9 w-9 rounded-lg object-cover border border-slate-200 dark:border-slate-700 bg-white"
            />
            <span className="font-display text-sm sm:text-base font-bold tracking-tight text-[#00529C] dark:text-sky-400">
              SDN 006 SUNGAI BULUH
            </span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={toggleTheme}
              aria-label="Ubah tema tampilan"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="h-4 w-4 text-[#F37021]" />
                  <span className="hidden sm:inline">Mode Terang</span>
                </>
              ) : (
                <>
                  <Moon className="h-4 w-4 text-[#00529C]" />
                  <span className="hidden sm:inline">Mode Gelap</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="mx-auto grid w-full max-w-5xl grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Brand & Mission Panel */}
          <div className="lg:col-span-7 flex flex-col justify-between rounded-2xl bg-[#00529C] dark:bg-[#0B2B4C] p-8 sm:p-10 text-white border border-[#004585] dark:border-sky-900/60">
            <div>
              <div className="text-xs font-medium text-sky-200 tracking-wide">
                Portal Manajemen Aset Sekolah · Kab. Indragiri Hilir
              </div>
              <h1 className="mt-4 font-display text-3xl sm:text-4xl font-bold leading-tight text-balance">
                Inventaris Barang SDN 006 Sungai Buluh
              </h1>
              <p className="mt-4 text-sm sm:text-base text-sky-100/90 leading-relaxed max-w-xl">
                Platform pendataan sarana dan prasarana sekolah untuk menjaga kerapian kartu inventaris ruangan, memantau kondisi fisik aset, dan memastikan akurasi data laporan BOS maupun APBD.
              </p>

              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-xl bg-white/10 p-4 border border-white/15">
                  <div className="flex items-center gap-2 text-sm font-semibold text-white">
                    <ShieldCheck className="h-4 w-4 text-[#F37021]" />
                    <span>Akurasi Data Terukur</span>
                  </div>
                  <p className="mt-1.5 text-xs text-sky-100/80 leading-relaxed">
                    Rekam verifikasi fisik per ruangan lengkap dengan riwayat audit dan status kondisi barang.
                  </p>
                </div>
                <div className="rounded-xl bg-white/10 p-4 border border-white/15">
                  <div className="flex items-center gap-2 text-sm font-semibold text-white">
                    <Database className="h-4 w-4 text-[#F37021]" />
                    <span>Sinkronisasi Cloud</span>
                  </div>
                  <p className="mt-1.5 text-xs text-sky-100/80 leading-relaxed">
                    Terhubung ke Firebase Firestore dan siap diekspor ke format CSV untuk laporan administrasi.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/15 flex flex-wrap items-center gap-4 text-xs text-sky-100/80">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#F37021]" />
                Klasifikasi KIB & Ruangan
              </span>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#F37021]" />
                Valuasi Aset IDR
              </span>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#F37021]" />
                Jejak Audit Lengkap
              </span>
            </div>
          </div>

          {/* Sign-In Action Card */}
          <div className="lg:col-span-5 flex flex-col justify-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-sm">
            <div className="flex items-center gap-3.5 mb-6">
              <img
                src={CREST_SRC}
                alt="Logo Sekolah"
                referrerPolicy="no-referrer"
                className="h-12 w-12 rounded-xl object-cover border border-slate-200 dark:border-slate-700 bg-white shrink-0"
              />
              <div>
                <h2 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100">
                  Masuk ke Sistem
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Akses Manajemen & Operator Sarpras
                </p>
              </div>
            </div>

            {authError && (
              <div className="mb-5 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/50 px-3.5 py-2.5 text-xs text-red-700 dark:text-red-300">
                {authError}
              </div>
            )}

            <div className="space-y-3">
              <Button
                type="button"
                size="lg"
                onClick={loginWithGoogle}
                disabled={loadingAuth}
                className="w-full justify-between"
              >
                <span className="flex items-center gap-2.5">
                  <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fill="currentColor"
                      d="M21.35 11.1h-9.17v2.98h5.27c-.45 2.34-2.46 3.92-5.27 3.92a5.88 5.88 0 0 1 0-11.76c1.5 0 2.86.56 3.9 1.48l2.23-2.23A8.95 8.95 0 0 0 12.18 3a9 9 0 1 0 0 18c5.2 0 8.64-3.65 8.64-8.8 0-.62-.06-1.08-.17-1.1z"
                    />
                  </svg>
                  <span>{loadingAuth ? 'Memeriksa sesi...' : 'Masuk dengan Akun Google'}</span>
                </span>
                <ArrowRight className="h-4 w-4" />
              </Button>

              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-200 dark:border-slate-800" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white dark:bg-slate-900 px-3 text-slate-400 dark:text-slate-500">
                    atau jelajahi langsung
                  </span>
                </div>
              </div>

              <Button
                type="button"
                variant="accent"
                size="lg"
                onClick={loginDemoMode}
                className="w-full justify-between"
              >
                <span>Masuk Mode Pratinjau Lokal</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>

            <p className="mt-6 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Login Google menyimpan seluruh perubahan secara real-time di Firebase Firestore. Mode Pratinjau Lokal memuat data contoh SDN 006 Sungai Buluh untuk pengujian langsung di sesi browser ini.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
