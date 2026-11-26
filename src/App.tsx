import { useState } from 'react';
import { Toaster } from 'sonner';
import { ErrorBoundary } from '@/src/components/ErrorBoundary';
import { LoginScreen } from '@/src/components/auth/LoginScreen';
import { DashboardLayout, type NavTab } from '@/src/components/layout/DashboardLayout';
import { DashboardOverview } from '@/src/components/screens/DashboardOverview';
import { InventoryListScreen } from '@/src/components/screens/InventoryListScreen';
import { RoomsScreen } from '@/src/components/screens/RoomsScreen';
import { AuditAccuracyScreen } from '@/src/components/screens/AuditAccuracyScreen';
import { SettingsScreen } from '@/src/components/screens/SettingsScreen';
import { ItemFormModal } from '@/src/components/inventory/ItemFormModal';
import { ItemDetailModal } from '@/src/components/inventory/ItemDetailModal';
import { DeleteConfirmModal } from '@/src/components/inventory/DeleteConfirmModal';
import { RoomFormModal } from '@/src/components/inventory/RoomFormModal';
import { ImportExcelModal } from '@/src/components/inventory/ImportExcelModal';
import { TooltipProvider } from '@/src/components/ui/tooltip';
import { InventoryProvider, useInventory } from '@/src/context/InventoryContext';
import { ThemeProvider, useTheme } from '@/src/context/ThemeContext';
import type { InventoryFormValues, InventoryItem, Room, RoomFormValues } from '@/src/types/inventory';

function InventarisAppContent() {
  const {
    authMode,
    loadingAuth,
    loadingData,
    items,
    rooms,
    auditLogs,
    addItem,
    importItems,
    updateItem,
    verifyItem,
    deleteItem,
    addRoom,
    updateRoom,
    deleteRoom,
  } = useInventory();
  const { theme } = useTheme();

  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [roomFilterJump, setRoomFilterJump] = useState<string>('all');

  // Item modals state
  const [itemFormOpen, setItemFormOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [detailItemId, setDetailItemId] = useState<string | null>(null);
  const [deletingItem, setDeletingItem] = useState<InventoryItem | null>(null);

  // Room modals state
  const [roomFormOpen, setRoomFormOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [deletingRoom, setDeletingRoom] = useState<Room | null>(null);

  const inspectedItem = items.find((it) => it.id === detailItemId) || null;

  const handleOpenAddItem = () => {
    setEditingItem(null);
    setItemFormOpen(true);
  };

  const handleOpenEditItem = (item: InventoryItem) => {
    setEditingItem(item);
    setItemFormOpen(true);
  };

  const handleItemFormSubmit = async (values: InventoryFormValues) => {
    if (editingItem) {
      await updateItem(editingItem.id, values);
    } else {
      await addItem(values);
    }
  };

  const handleRoomFormSubmit = async (values: RoomFormValues) => {
    if (editingRoom) {
      await updateRoom(editingRoom.id, values);
    } else {
      await addRoom(values);
    }
  };

  const handleNavigate = (tab: NavTab) => {
    if (tab !== 'inventory') {
      setRoomFilterJump('all');
    }
    setActiveTab(tab);
  };

  const handleViewRoomItems = (roomId: string) => {
    setRoomFilterJump(roomId);
    setActiveTab('inventory');
  };

  if (loadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
          <div className="h-8 w-8 rounded-full border-2 border-[#00529C] border-t-transparent animate-spin" />
          <span>Memuat sistem inventaris SDN 006 Sungai Buluh...</span>
        </div>
      </div>
    );
  }

  if (!authMode) {
    return (
      <>
        <Toaster richColors position="top-right" theme={theme} />
        <LoginScreen />
      </>
    );
  }

  return (
    <>
      <Toaster richColors position="top-right" theme={theme} />
      <DashboardLayout
        activeTab={activeTab}
        onTabChange={handleNavigate}
        onOpenAddModal={handleOpenAddItem}
      >
        {activeTab === 'dashboard' && (
          <DashboardOverview
            items={items}
            rooms={rooms}
            auditLogs={auditLogs}
            loading={loadingData}
            onNavigate={(tab) => handleNavigate(tab)}
            onInspectItem={(item) => setDetailItemId(item.id)}
            onAddNew={handleOpenAddItem}
          />
        )}

        {activeTab === 'inventory' && (
          <InventoryListScreen
            key={roomFilterJump}
            items={items}
            rooms={rooms}
            loading={loadingData}
            initialRoomFilter={roomFilterJump}
            onAddNew={handleOpenAddItem}
            onOpenImport={() => setImportModalOpen(true)}
            onEdit={handleOpenEditItem}
            onViewDetail={(item) => setDetailItemId(item.id)}
            onDelete={(item) => setDeletingItem(item)}
          />
        )}

        {activeTab === 'rooms' && (
          <RoomsScreen
            rooms={rooms}
            items={items}
            onAddRoom={() => {
              setEditingRoom(null);
              setRoomFormOpen(true);
            }}
            onEditRoom={(room) => {
              setEditingRoom(room);
              setRoomFormOpen(true);
            }}
            onDeleteRoom={(room) => setDeletingRoom(room)}
            onViewRoomItems={handleViewRoomItems}
          />
        )}

        {activeTab === 'audit' && (
          <AuditAccuracyScreen
            items={items}
            auditLogs={auditLogs}
            onInspectItem={(item) => setDetailItemId(item.id)}
            onQuickVerify={verifyItem}
          />
        )}

        {activeTab === 'settings' && <SettingsScreen />}
      </DashboardLayout>

      <ItemFormModal
        open={itemFormOpen}
        onOpenChange={setItemFormOpen}
        editingItem={editingItem}
        rooms={rooms}
        onSubmit={handleItemFormSubmit}
      />

      <ImportExcelModal
        open={importModalOpen}
        onOpenChange={setImportModalOpen}
        rooms={rooms}
        onImport={importItems}
      />

      <ItemDetailModal
        open={Boolean(inspectedItem)}
        onOpenChange={(open) => {
          if (!open) setDetailItemId(null);
        }}
        item={inspectedItem}
        onEdit={handleOpenEditItem}
        onDelete={(item) => setDeletingItem(item)}
        onVerify={verifyItem}
      />

      <DeleteConfirmModal
        open={Boolean(deletingItem)}
        onOpenChange={(open) => {
          if (!open) setDeletingItem(null);
        }}
        title="Hapus Data Barang Inventaris?"
        description={
          deletingItem
            ? `Barang "${deletingItem.namaBarang}" (${deletingItem.kodeBarang}) akan dihapus permanen dari daftar inventaris.`
            : ''
        }
        onConfirm={async () => {
          if (deletingItem) {
            await deleteItem(deletingItem.id);
          }
        }}
      />

      <RoomFormModal
        open={roomFormOpen}
        onOpenChange={setRoomFormOpen}
        editingRoom={editingRoom}
        onSubmit={handleRoomFormSubmit}
      />

      <DeleteConfirmModal
        open={Boolean(deletingRoom)}
        onOpenChange={(open) => {
          if (!open) setDeletingRoom(null);
        }}
        title="Hapus Data Ruangan?"
        description={
          deletingRoom
            ? `Ruangan "${deletingRoom.namaRuang}" (${deletingRoom.kodeRuang}) akan dihapus dari daftar lokasi sekolah.`
            : ''
        }
        onConfirm={async () => {
          if (deletingRoom) {
            await deleteRoom(deletingRoom.id);
          }
        }}
      />
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <TooltipProvider>
          <InventoryProvider>
            <InventarisAppContent />
          </InventoryProvider>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
