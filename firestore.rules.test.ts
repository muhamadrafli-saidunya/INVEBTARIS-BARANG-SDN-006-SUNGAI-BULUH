/**
 * Verifikasi skema dan payload "Dirty Dozen" terhadap aturan Firestore.
 * File ini mendefinisikan struktur uji keamanan untuk Emulator Rules Unit Testing.
 */

export interface DirtyDozenCase {
  id: string;
  title: string;
  collection: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  expected: 'PERMISSION_DENIED';
  payload?: Record<string, unknown>;
}

export const dirtyDozenTestCases: DirtyDozenCase[] = [
  {
    id: 'DD-01',
    title: 'Unauthenticated Read/Write on inventory_items',
    collection: 'inventory_items/item_01',
    operation: 'get',
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-02',
    title: 'Unverified Email Admin Spoof',
    collection: 'inventory_items/item_01',
    operation: 'create',
    expected: 'PERMISSION_DENIED',
    payload: { email_verified: false, email: 'muhamad.rafli@gmail.com' },
  },
  {
    id: 'DD-03',
    title: 'Identity Spoofing via Foreign ownerId',
    collection: 'inventory_items/item_spoof',
    operation: 'create',
    expected: 'PERMISSION_DENIED',
    payload: { id: 'item_spoof', ownerId: 'other_user_uid', kodeBarang: 'KIB-B.001' },
  },
  {
    id: 'DD-04',
    title: 'Shadow Field Injection on Create/Update',
    collection: 'inventory_items/item_shadow',
    operation: 'create',
    expected: 'PERMISSION_DENIED',
    payload: { id: 'item_shadow', shadowFlag: true },
  },
  {
    id: 'DD-05',
    title: 'Self-Assigned Admin Role Escalation',
    collection: 'users/user_123',
    operation: 'create',
    expected: 'PERMISSION_DENIED',
    payload: { uid: 'user_123', role: 'admin' },
  },
  {
    id: 'DD-06',
    title: 'Cross-User PII Profile Read',
    collection: 'users/other_user_uid',
    operation: 'get',
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-07',
    title: 'Orphaned Inventory Item Without Valid Room',
    collection: 'inventory_items/item_orphan',
    operation: 'create',
    expected: 'PERMISSION_DENIED',
    payload: { id: 'item_orphan', roomId: 'non_existent_room_999' },
  },
  {
    id: 'DD-08',
    title: 'Path Variable ID Poisoning (>128 chars)',
    collection: `inventory_items/${'a'.repeat(140)}`,
    operation: 'create',
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-09',
    title: 'Value & Type Poisoning on Update',
    collection: 'inventory_items/item_01',
    operation: 'update',
    expected: 'PERMISSION_DENIED',
    payload: { hargaSatuan: 'invalid_string', namaBarang: 'x'.repeat(200) },
  },
  {
    id: 'DD-10',
    title: 'Immutable Field Tampering (createdAt / ownerId)',
    collection: 'inventory_items/item_01',
    operation: 'update',
    expected: 'PERMISSION_DENIED',
    payload: { ownerId: 'hijacked_uid' },
  },
  {
    id: 'DD-11',
    title: 'Client Timestamp Forgery',
    collection: 'rooms/room_01',
    operation: 'create',
    expected: 'PERMISSION_DENIED',
    payload: { createdAt: '2020-01-01T00:00:00Z' },
  },
  {
    id: 'DD-12',
    title: 'Unfiltered List Query Scraping',
    collection: 'inventory_items',
    operation: 'list',
    expected: 'PERMISSION_DENIED',
  },
];
