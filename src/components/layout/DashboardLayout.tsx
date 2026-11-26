import React, { useState } from 'react';
import {
  Building2,
  ClipboardCheck,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Package,
  Plus,
  Settings,
  Sun,
  X,
} from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/src/components/ui/dropdown-menu';
import { useInventory } from '@/src/context/InventoryContext';
import { useTheme } from '@/src/context/ThemeContext';

export type NavTab = 'dashboard' | 'inventory' | 'rooms' | 'audit' | 'settings';

interface DashboardLayoutProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onOpenAddModal: () => void;
  children: React.ReactNode;
}

const CREST_SRC = '/src/assets/images/sdn_school_crest_1795594106696.jpg';

const NAV_ITEMS: Array<{ id: NavTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'dashboard', label: 'Ringkasan Dashboard', icon: LayoutDashboard },
  { id: 'inventory', label: 'Data Inventaris', icon: Package },
  { id: 'rooms', label: 'Ruangan & Lokasi', icon: Building2 },
  { id: 'audit', label: 'Audit & Akurasi', icon: ClipboardCheck },
  { id: 'settings', label: 'Pengaturan', icon: Settings },
];

const TAB_BREADCRUMBS: Record<NavTab, string> = {
  dashboard: 'Ringkasan Dashboard',
  inventory: 'Data Inventaris Barang',
  rooms: 'Ruangan & Lokasi Sekolah',
  audit: 'Audit & Akurasi Data',
  settings: 'Pengaturan Sistem',
};

export function DashboardLayout({
  activeTab,
  onTabChange,
  onOpenAddModal,
  children,
}: DashboardLayoutProps) {
  const { user, authMode, logout, loginWithGoogle, items, schoolProfile } = useInventory();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const schoolTitle = schoolProfile?.namaSekolah || 'SDN 006 SUNGAI BULUH';
  const schoolSubtitle = schoolProfile?.npsn
    ? `NPSN ${schoolProfile.npsn} · Inventaris`
    : 'Inventaris Barang Sekolah';

  const pendingAuditCount = items.filter(
    (it) => it.statusVerifikasi !== 'Terverifikasi' || it.kondisi !== 'Baik'
  ).length;

  const initials = (user?.displayName || 'OP')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const renderNavLinks = (isMobile = false) => (
    <nav className="flex-1 space-y-1 px-3 py-4" aria-label="Navigasi utama">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const active = activeTab === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              onTabChange(item.id);
              if (isMobile) setMobileMenuOpen(false);
            }}
            className={`flex w-full items-center justify-between gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
              active
                ? 'bg-[#00529C] text-white dark:bg-[#1D74C7] shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span className="flex items-center gap-3 min-w-0">
              <Icon
                className={`h-4 w-4 shrink-0 ${
                  active ? 'text-[#F37021]' : 'text-slate-400 dark:text-slate-500'
                }`}
              />
              <span className="truncate">{item.label}</span>
            </span>
            {item.id === 'audit' && pendingAuditCount > 0 && (
              <span
                className={`font-mono text-[11px] tabular-nums ${
                  active
                    ? 'text-sky-100'
                    : 'text-[#F37021] font-semibold'
                }`}
              >
                {pendingAuditCount}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-[260px] lg:flex-col lg:fixed lg:inset-y-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 z-30">
        <div className="flex items-center gap-3 px-5 h-16 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <img
            src={CREST_SRC}
            alt="Lambang SDN 006 Sungai Buluh"
            referrerPolicy="no-referrer"
            className="h-9 w-9 rounded-lg object-cover border border-slate-200 dark:border-slate-700 bg-white shrink-0"
          />
          <div className="min-w-0">
            <div className="font-display text-sm font-bold text-[#00529C] dark:text-sky-400 truncate">
              {schoolTitle}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {schoolSubtitle}
            </div>
          </div>
        </div>

        {renderNavLinks()}

        <div className="border-t border-slate-200 dark:border-slate-800 p-4 space-y-3">
          {authMode === 'demo' && (
            <div className="rounded-lg border border-orange-200 dark:border-orange-900/60 bg-orange-50/70 dark:bg-orange-950/40 p-3 space-y-2">
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Mode Pratinjau Lokal
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                Masuk dengan Google untuk menyimpan perubahan permanen ke Firebase Firestore.
              </p>
              <Button
                type="button"
                size="sm"
                className="w-full"
                onClick={loginWithGoogle}
              >
                Hubungkan Google
              </Button>
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="truncate">{user?.email || 'Operator Sekolah'}</span>
            <button
              type="button"
              onClick={logout}
              aria-label="Keluar dari aplikasi"
              className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-red-600 dark:hover:text-red-400 cursor-pointer shrink-0"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile / Tablet Sidebar Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-[1px]"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative z-10 flex w-72 max-w-[85vw] flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between px-4 h-16 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5 min-w-0">
                <img
                  src={CREST_SRC}
                  alt="Logo"
                  referrerPolicy="no-referrer"
                  className="h-8 w-8 rounded-lg object-cover border border-slate-200 dark:border-slate-700 bg-white shrink-0"
                />
                <span className="font-display text-sm font-bold text-[#00529C] dark:text-sky-400 truncate">
                  {schoolTitle}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Tutup menu"
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {renderNavLinks(true)}
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-[260px]">
        {/* Topbar */}
        <header className="sticky top-0 z-20 h-16 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs">
          <div className="flex h-full items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Buka menu navigasi"
                className="lg:hidden rounded-lg p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer shrink-0"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-2 text-sm min-w-0">
                <span className="hidden sm:inline text-slate-400 dark:text-slate-500 whitespace-nowrap">
                  Inventaris
                </span>
                <span className="hidden sm:inline text-slate-300 dark:text-slate-700">/</span>
                <h1 className="font-display font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {TAB_BREADCRUMBS[activeTab]}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={toggleTheme}
                aria-label={theme === 'dark' ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'}
                className="h-9 w-9"
              >
                {theme === 'dark' ? (
                  <Sun className="h-4 w-4 text-[#F37021]" />
                ) : (
                  <Moon className="h-4 w-4 text-[#00529C]" />
                )}
              </Button>

              <Button
                type="button"
                variant="accent"
                size="sm"
                onClick={onOpenAddModal}
                className="h-9"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Tambah Barang</span>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    aria-label="Menu akun pengguna"
                    className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                  >
                    {user?.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt={user.displayName}
                        referrerPolicy="no-referrer"
                        className="h-6 w-6 rounded-md object-cover"
                      />
                    ) : (
                      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#00529C] text-[11px] font-bold text-white">
                        {initials}
                      </span>
                    )}
                    <span className="hidden md:inline text-xs font-medium text-slate-700 dark:text-slate-200 max-w-[130px] truncate">
                      {user?.displayName || 'Petugas'}
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <div className="px-2.5 py-2">
                    <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {user?.displayName}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {user?.email}
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  {authMode === 'demo' && (
                    <DropdownMenuItem onClick={loginWithGoogle}>
                      <span>Masuk dengan Google</span>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={toggleTheme}>
                    <span>{theme === 'dark' ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onTabChange('settings')}>
                    <Settings className="h-4 w-4" />
                    <span>Pengaturan Sistem</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={logout}
                    className="text-red-600 dark:text-red-400"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Keluar</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Main Content Grid */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-[1440px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
