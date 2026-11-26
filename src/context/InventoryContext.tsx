import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User as FirebaseUser,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { toast } from 'sonner';
import {
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
} from '@/src/lib/firebase';
import { generateSafeId } from '@/src/lib/utils';
import { sanitizeFotoBarang } from '@/src/lib/imageUtils';
import {
  buildSeedAuditLogs,
  buildSeedInventory,
  buildSeedRooms,
  buildSeedSchoolProfile,
} from '@/src/data/seedData';
import {
  BLUEPRINT_CONSTRAINTS,
  type AuditLog,
  type DatabaseBackupPayload,
  type InventoryFormValues,
  type InventoryItem,
  type KondisiBarang,
  type Room,
  type RoomFormValues,
  type SchoolProfile,
  type SchoolProfileFormValues,
  type StatusVerifikasi,
  type UserProfile,
  type UserRole,
} from '@/src/types/inventory';

type AuthMode = 'firebase' | 'demo' | null;

interface InventoryContextValue {
  authMode: AuthMode;
  loadingAuth: boolean;
  loadingData: boolean;
  syncing: boolean;
  user: UserProfile | null;
  schoolProfile: SchoolProfile | null;
  items: InventoryItem[];
  rooms: Room[];
  auditLogs: AuditLog[];
  authError: string | null;
  loginWithGoogle: () => Promise<void>;
  loginDemoMode: () => void;
  logout: () => Promise<void>;
  addItem: (values: InventoryFormValues) => Promise<void>;
  importItems: (rows: InventoryFormValues[]) => Promise<number>;
  updateItem: (id: string, values: InventoryFormValues) => Promise<void>;
  verifyItem: (
    id: string,
    kondisi: KondisiBarang,
    statusVerifikasi: StatusVerifikasi,
    catatan: string
  ) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  addRoom: (values: RoomFormValues) => Promise<void>;
  updateRoom: (id: string, values: RoomFormValues) => Promise<void>;
  deleteRoom: (id: string) => Promise<void>;
  updateSchoolProfile: (values: SchoolProfileFormValues) => Promise<void>;
  updateAccountProfile: (displayName: string, role?: UserRole) => Promise<void>;
  exportDatabaseBackup: () => DatabaseBackupPayload;
  restoreDatabaseBackup: (
    payload: DatabaseBackupPayload,
    mode: 'merge' | 'replace'
  ) => Promise<{ roomsCount: number; itemsCount: number }>;
  resetDatabaseToSeed: () => Promise<void>;
  seedInitialData: () => Promise<void>;
}

const InventoryContext = createContext<InventoryContextValue | undefined>(undefined);

function parseTimestamp(val: unknown): string {
  if (val instanceof Timestamp) {
    return val.toDate().toISOString();
  }
  if (typeof val === 'string') return val;
  if (val && typeof val === 'object' && 'toDate' in val && typeof (val as { toDate: () => Date }).toDate === 'function') {
    return (val as { toDate: () => Date }).toDate().toISOString();
  }
  return new Date().toISOString();
}

const DEMO_USER_ID = 'demo_operator_sdn006';

export function InventoryProvider({ children }: { children: React.ReactNode }) {
  const [authMode, setAuthMode] = useState<AuthMode>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [schoolProfile, setSchoolProfile] = useState<SchoolProfile | null>(null);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [authError, setAuthError] = useState<string | null>(null);

  const initDemoDataset = useCallback(() => {
    const demoProfile = buildSeedSchoolProfile(DEMO_USER_ID);
    const demoRooms = buildSeedRooms(DEMO_USER_ID);
    const demoItems = buildSeedInventory(DEMO_USER_ID, demoRooms);
    const demoLogs = buildSeedAuditLogs(DEMO_USER_ID, demoItems, 'Admin Sarpras (Mode Pratinjau)');
    setSchoolProfile(demoProfile);
    setRooms(demoRooms);
    setItems(demoItems);
    setAuditLogs(demoLogs);
  }, []);

  const seedFirestoreForUser = useCallback(async (uid: string, displayName: string) => {
    const seedRooms = buildSeedRooms(uid);
    const seedItems = buildSeedInventory(uid, seedRooms);
    const seedLogs = buildSeedAuditLogs(uid, seedItems, displayName);

    try {
      const roomBatch = writeBatch(db);
      for (const r of seedRooms) {
        roomBatch.set(doc(db, 'rooms', r.id), {
          ...r,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      await roomBatch.commit();

      const itemBatch = writeBatch(db);
      for (const item of seedItems) {
        itemBatch.set(doc(db, 'inventory_items', item.id), {
          ...item,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      await itemBatch.commit();

      const logBatch = writeBatch(db);
      for (const log of seedLogs) {
        logBatch.set(doc(db, 'audit_logs', log.id), {
          ...log,
          createdAt: serverTimestamp(),
        });
      }
      await logBatch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'rooms/inventory_items/audit_logs');
    }
  }, []);

  const ensureUserProfileAndSeed = useCallback(
    async (fbUser: FirebaseUser) => {
      const userPath = `users/${fbUser.uid}`;
      const userRef = doc(db, 'users', fbUser.uid);
      const isBootstrappedAdmin = fbUser.email === 'muhamad.rafli@gmail.com' && fbUser.emailVerified;
      const defaultName = (fbUser.displayName || fbUser.email?.split('@')[0] || 'Petugas Inventaris').slice(0, 100);

      let profile: UserProfile;
      try {
        const snap = await getDoc(userRef);
        if (!snap.exists()) {
          const role = isBootstrappedAdmin ? 'admin' : 'operator';
          await setDoc(userRef, {
            uid: fbUser.uid,
            displayName: defaultName,
            email: (fbUser.email || 'user@sdn006.sch.id').slice(0, 160),
            role,
            photoURL: (fbUser.photoURL || '').slice(0, 500),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          profile = {
            uid: fbUser.uid,
            displayName: defaultName,
            email: fbUser.email || '',
            role,
            photoURL: fbUser.photoURL || undefined,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
        } else {
          const data = snap.data();
          profile = {
            uid: String(data.uid || fbUser.uid),
            displayName: String(data.displayName || defaultName),
            email: String(data.email || fbUser.email || ''),
            role: (data.role as UserProfile['role']) || 'operator',
            photoURL: data.photoURL ? String(data.photoURL) : undefined,
            createdAt: parseTimestamp(data.createdAt),
            updatedAt: parseTimestamp(data.updatedAt),
          };
        }
        setUser(profile);
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, userPath);
      }

      // Check if user already has school profile; if missing, create default SDN 006 Sungai Buluh profile
      const schoolRef = doc(db, 'school_profiles', fbUser.uid);
      try {
        const schoolSnap = await getDoc(schoolRef);
        if (!schoolSnap.exists()) {
          const defaultSchool = buildSeedSchoolProfile(fbUser.uid);
          await setDoc(schoolRef, {
            ...defaultSchool,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          setSchoolProfile(defaultSchool);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `school_profiles/${fbUser.uid}`);
      }

      // Check if user already has rooms; if empty, auto-seed realistic SDN 006 Sungai Buluh inventory
      try {
        const existingRooms = await getDocs(
          query(collection(db, 'rooms'), where('ownerId', '==', fbUser.uid))
        );
        if (existingRooms.empty) {
          await seedFirestoreForUser(fbUser.uid, defaultName);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'rooms');
      }
    },
    [seedFirestoreForUser]
  );

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        setFirebaseUser(fbUser);
        setAuthMode('firebase');
        setLoadingData(true);
        try {
          await ensureUserProfileAndSeed(fbUser);
        } catch (err) {
          console.error(err);
          setAuthError('Gagal memuat profil pengguna dari Firestore.');
        } finally {
          setLoadingAuth(false);
        }
      } else {
        setFirebaseUser(null);
        setAuthMode((prev) => (prev === 'demo' ? 'demo' : null));
        setLoadingAuth(false);
      }
    });
    return () => unsub();
  }, [ensureUserProfileAndSeed]);

  // Attach real-time onSnapshot listeners ONLY when authenticated with Firebase
  useEffect(() => {
    if (authMode !== 'firebase' || !firebaseUser) return;

    setLoadingData(true);
    const isAdmin =
      firebaseUser.email === 'muhamad.rafli@gmail.com' && firebaseUser.emailVerified;

    const roomsQuery = isAdmin
      ? query(collection(db, 'rooms'))
      : query(collection(db, 'rooms'), where('ownerId', '==', firebaseUser.uid));

    const itemsQuery = isAdmin
      ? query(collection(db, 'inventory_items'))
      : query(collection(db, 'inventory_items'), where('ownerId', '==', firebaseUser.uid));

    const logsQuery = isAdmin
      ? query(collection(db, 'audit_logs'))
      : query(collection(db, 'audit_logs'), where('ownerId', '==', firebaseUser.uid));

    let roomsLoaded = false;
    let itemsLoaded = false;
    const markReady = () => {
      if (roomsLoaded && itemsLoaded) {
        setLoadingData(false);
      }
    };

    const unsubRooms = onSnapshot(
      roomsQuery,
      (snap) => {
        const nextRooms: Room[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: String(data.id || d.id),
            kodeRuang: String(data.kodeRuang || ''),
            namaRuang: String(data.namaRuang || ''),
            penanggungJawab: String(data.penanggungJawab || ''),
            kapasitasBarang: Number(data.kapasitasBarang || 0),
            lokasi: String(data.lokasi || ''),
            ownerId: String(data.ownerId || ''),
            createdAt: parseTimestamp(data.createdAt),
            updatedAt: parseTimestamp(data.updatedAt),
          };
        });
        nextRooms.sort((a, b) => a.kodeRuang.localeCompare(b.kodeRuang));
        setRooms(nextRooms);
        roomsLoaded = true;
        markReady();
      },
      (error) => {
        setLoadingData(false);
        handleFirestoreError(error, OperationType.LIST, 'rooms');
      }
    );

    const unsubItems = onSnapshot(
      itemsQuery,
      (snap) => {
        const nextItems: InventoryItem[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: String(data.id || d.id),
            kodeBarang: String(data.kodeBarang || ''),
            namaBarang: String(data.namaBarang || ''),
            kategori: data.kategori,
            ruangan: String(data.ruangan || ''),
            roomId: String(data.roomId || ''),
            jumlah: Number(data.jumlah || 0),
            satuan: data.satuan,
            kondisi: data.kondisi,
            statusVerifikasi: data.statusVerifikasi,
            sumberDana: data.sumberDana,
            hargaSatuan: Number(data.hargaSatuan || 0),
            tanggalPerolehan: String(data.tanggalPerolehan || ''),
            keterangan: String(data.keterangan || ''),
            fotoBarang: data.fotoBarang ? String(data.fotoBarang) : '',
            ownerId: String(data.ownerId || ''),
            createdAt: parseTimestamp(data.createdAt),
            updatedAt: parseTimestamp(data.updatedAt),
          };
        });
        nextItems.sort((a, b) => b.tanggalPerolehan.localeCompare(a.tanggalPerolehan));
        setItems(nextItems);
        itemsLoaded = true;
        markReady();
      },
      (error) => {
        setLoadingData(false);
        handleFirestoreError(error, OperationType.LIST, 'inventory_items');
      }
    );

    const unsubLogs = onSnapshot(
      logsQuery,
      (snap) => {
        const nextLogs: AuditLog[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: String(data.id || d.id),
            itemId: String(data.itemId || ''),
            kodeBarang: String(data.kodeBarang || ''),
            namaBarang: String(data.namaBarang || ''),
            aksi: data.aksi,
            catatan: String(data.catatan || ''),
            petugas: String(data.petugas || ''),
            ownerId: String(data.ownerId || ''),
            createdAt: parseTimestamp(data.createdAt),
          };
        });
        nextLogs.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        setAuditLogs(nextLogs);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'audit_logs');
      }
    );

    const unsubSchool = onSnapshot(
      doc(db, 'school_profiles', firebaseUser.uid),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setSchoolProfile({
            id: String(data.id || snap.id),
            ownerId: String(data.ownerId || firebaseUser.uid),
            namaSekolah: String(data.namaSekolah || 'SDN 006 SUNGAI BULUH'),
            npsn: String(data.npsn || '10402006'),
            statusAkreditasi: data.statusAkreditasi || 'A',
            alamat: String(data.alamat || ''),
            kecamatan: String(data.kecamatan || ''),
            kabupaten: String(data.kabupaten || ''),
            provinsi: String(data.provinsi || ''),
            kodePos: String(data.kodePos || ''),
            telepon: String(data.telepon || ''),
            emailSekolah: String(data.emailSekolah || ''),
            kepalaSekolah: String(data.kepalaSekolah || ''),
            nipKepalaSekolah: String(data.nipKepalaSekolah || ''),
            pengurusBarang: String(data.pengurusBarang || ''),
            tahunAnggaran: String(data.tahunAnggaran || '2026'),
            createdAt: parseTimestamp(data.createdAt),
            updatedAt: parseTimestamp(data.updatedAt),
          });
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, `school_profiles/${firebaseUser.uid}`);
      }
    );

    return () => {
      unsubRooms();
      unsubItems();
      unsubLogs();
      unsubSchool();
    };
  }, [authMode, firebaseUser]);

  const loginWithGoogle = async () => {
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
      toast.success('Berhasil masuk dengan akun Google.');
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Gagal melakukan autentikasi Google.';
      if (message.includes('popup-closed-by-user')) {
        setAuthError('Jendela login Google ditutup sebelum selesai.');
      } else {
        setAuthError(`Autentikasi gagal: ${message}`);
      }
      toast.error('Gagal masuk dengan akun Google.');
    }
  };

  const loginDemoMode = () => {
    setAuthError(null);
    setAuthMode('demo');
    setUser({
      uid: DEMO_USER_ID,
      displayName: 'Operator Sarpras SDN 006',
      email: 'sarpras@sdn006sungaibuluh.sch.id',
      role: 'admin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    initDemoDataset();
    toast.success('Masuk ke Mode Pratinjau Lokal SDN 006 Sungai Buluh.');
  };

  const logout = async () => {
    if (authMode === 'firebase') {
      await signOut(auth);
    }
    setAuthMode(null);
    setUser(null);
    setSchoolProfile(null);
    setItems([]);
    setRooms([]);
    setAuditLogs([]);
    toast.info('Sesi telah diakhiri.');
  };

  const addItem = async (values: InventoryFormValues) => {
    const room = rooms.find((r) => r.id === values.roomId);
    if (!room) {
      toast.error('Ruangan penyimpanan tidak ditemukan.');
      return;
    }

    const ownerId = user?.uid || DEMO_USER_ID;
    const itemId = generateSafeId('inv');
    const logId = generateSafeId('log');
    const now = new Date().toISOString();

    const sanitizedPayload: InventoryItem = {
      id: itemId,
      kodeBarang: values.kodeBarang.trim().toUpperCase().slice(0, BLUEPRINT_CONSTRAINTS.maxKodeBarangLength),
      namaBarang: values.namaBarang.trim().slice(0, BLUEPRINT_CONSTRAINTS.maxNamaBarangLength),
      kategori: values.kategori,
      ruangan: room.namaRuang.slice(0, BLUEPRINT_CONSTRAINTS.maxRuanganLength),
      roomId: room.id,
      jumlah: Math.max(0, Math.min(1000000, Number(values.jumlah))),
      satuan: values.satuan,
      kondisi: values.kondisi,
      statusVerifikasi: values.statusVerifikasi,
      sumberDana: values.sumberDana,
      hargaSatuan: Math.max(0, Math.min(10000000000, Number(values.hargaSatuan))),
      tanggalPerolehan: values.tanggalPerolehan,
      keterangan: values.keterangan.trim().slice(0, BLUEPRINT_CONSTRAINTS.maxKeteranganLength),
      fotoBarang: sanitizeFotoBarang(values.fotoBarang),
      ownerId,
      createdAt: now,
      updatedAt: now,
    };

    const newLog: AuditLog = {
      id: logId,
      itemId,
      kodeBarang: sanitizedPayload.kodeBarang,
      namaBarang: sanitizedPayload.namaBarang,
      aksi: 'Tambah Barang',
      catatan: `Penambahan ${sanitizedPayload.jumlah} ${sanitizedPayload.satuan} ke ${room.namaRuang}.`,
      petugas: (user?.displayName || 'Petugas').slice(0, 100),
      ownerId,
      createdAt: now,
    };

    if (authMode === 'demo') {
      setItems((prev) => [sanitizedPayload, ...prev]);
      setAuditLogs((prev) => [newLog, ...prev]);
      toast.success(`"${sanitizedPayload.namaBarang}" berhasil ditambahkan.`);
      return;
    }

    setSyncing(true);
    try {
      await setDoc(doc(db, 'inventory_items', itemId), {
        ...sanitizedPayload,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      await setDoc(doc(db, 'audit_logs', logId), {
        ...newLog,
        createdAt: serverTimestamp(),
      });
      toast.success(`"${sanitizedPayload.namaBarang}" tersimpan ke Firestore.`);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `inventory_items/${itemId}`);
    } finally {
      setSyncing(false);
    }
  };

  const importItems = async (rows: InventoryFormValues[]): Promise<number> => {
    if (rows.length === 0) return 0;

    const ownerId = user?.uid || DEMO_USER_ID;
    const now = new Date().toISOString();
    const petugas = (user?.displayName || 'Petugas').slice(0, 100);

    const preparedItems: InventoryItem[] = [];
    const preparedLogs: AuditLog[] = [];

    rows.forEach((values, idx) => {
      const room = rooms.find((r) => r.id === values.roomId);
      if (!room) return;

      const itemId = generateSafeId(`imp${idx}`);
      const logId = generateSafeId(`log${idx}`);

      const sanitized: InventoryItem = {
        id: itemId,
        kodeBarang: values.kodeBarang
          .trim()
          .toUpperCase()
          .slice(0, BLUEPRINT_CONSTRAINTS.maxKodeBarangLength),
        namaBarang: values.namaBarang.trim().slice(0, BLUEPRINT_CONSTRAINTS.maxNamaBarangLength),
        kategori: values.kategori,
        ruangan: room.namaRuang.slice(0, BLUEPRINT_CONSTRAINTS.maxRuanganLength),
        roomId: room.id,
        jumlah: Math.max(0, Math.min(1000000, Number(values.jumlah))),
        satuan: values.satuan,
        kondisi: values.kondisi,
        statusVerifikasi: values.statusVerifikasi,
        sumberDana: values.sumberDana,
        hargaSatuan: Math.max(0, Math.min(10000000000, Number(values.hargaSatuan))),
        tanggalPerolehan: values.tanggalPerolehan,
        keterangan: values.keterangan.trim().slice(0, BLUEPRINT_CONSTRAINTS.maxKeteranganLength),
        fotoBarang: sanitizeFotoBarang(values.fotoBarang),
        ownerId,
        createdAt: now,
        updatedAt: now,
      };

      const logEntry: AuditLog = {
        id: logId,
        itemId,
        kodeBarang: sanitized.kodeBarang,
        namaBarang: sanitized.namaBarang,
        aksi: 'Tambah Barang',
        catatan: `Impor Excel (.xlsx): ${sanitized.jumlah} ${sanitized.satuan} ke ${room.namaRuang}.`.slice(
          0,
          BLUEPRINT_CONSTRAINTS.maxCatatanLength
        ),
        petugas,
        ownerId,
        createdAt: now,
      };

      preparedItems.push(sanitized);
      preparedLogs.push(logEntry);
    });

    if (preparedItems.length === 0) return 0;

    if (authMode === 'demo') {
      setItems((prev) => [...preparedItems, ...prev]);
      setAuditLogs((prev) => [...preparedLogs, ...prev]);
      toast.success(`${preparedItems.length} data barang berhasil diimpor dari Excel.`);
      return preparedItems.length;
    }

    setSyncing(true);
    try {
      const CHUNK_SIZE = 400;
      for (let i = 0; i < preparedItems.length; i += CHUNK_SIZE) {
        const chunk = preparedItems.slice(i, i + CHUNK_SIZE);
        const itemBatch = writeBatch(db);
        for (const item of chunk) {
          itemBatch.set(doc(db, 'inventory_items', item.id), {
            ...item,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
        await itemBatch.commit();
      }

      for (let i = 0; i < preparedLogs.length; i += CHUNK_SIZE) {
        const chunk = preparedLogs.slice(i, i + CHUNK_SIZE);
        const logBatch = writeBatch(db);
        for (const log of chunk) {
          logBatch.set(doc(db, 'audit_logs', log.id), {
            ...log,
            createdAt: serverTimestamp(),
          });
        }
        await logBatch.commit();
      }

      toast.success(`${preparedItems.length} data barang berhasil diimpor ke Firestore.`);
      return preparedItems.length;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'inventory_items');
    } finally {
      setSyncing(false);
    }
  };

  const updateItem = async (id: string, values: InventoryFormValues) => {
    const existing = items.find((it) => it.id === id);
    const room = rooms.find((r) => r.id === values.roomId);
    if (!existing || !room) {
      toast.error('Data barang atau ruangan tidak ditemukan.');
      return;
    }

    const now = new Date().toISOString();
    const logId = generateSafeId('log');
    const ownerId = user?.uid || DEMO_USER_ID;

    const updatedFields = {
      kodeBarang: values.kodeBarang.trim().toUpperCase().slice(0, BLUEPRINT_CONSTRAINTS.maxKodeBarangLength),
      namaBarang: values.namaBarang.trim().slice(0, BLUEPRINT_CONSTRAINTS.maxNamaBarangLength),
      kategori: values.kategori,
      ruangan: room.namaRuang.slice(0, BLUEPRINT_CONSTRAINTS.maxRuanganLength),
      roomId: room.id,
      jumlah: Math.max(0, Math.min(1000000, Number(values.jumlah))),
      satuan: values.satuan,
      kondisi: values.kondisi,
      statusVerifikasi: values.statusVerifikasi,
      sumberDana: values.sumberDana,
      hargaSatuan: Math.max(0, Math.min(10000000000, Number(values.hargaSatuan))),
      tanggalPerolehan: values.tanggalPerolehan,
      keterangan: values.keterangan.trim().slice(0, BLUEPRINT_CONSTRAINTS.maxKeteranganLength),
      fotoBarang: sanitizeFotoBarang(values.fotoBarang),
    };

    const logEntry: AuditLog = {
      id: logId,
      itemId: id,
      kodeBarang: updatedFields.kodeBarang,
      namaBarang: updatedFields.namaBarang,
      aksi: 'Perbarui Data',
      catatan: `Pembaruan data barang (${updatedFields.jumlah} ${updatedFields.satuan}, kondisi ${updatedFields.kondisi}).`,
      petugas: (user?.displayName || 'Petugas').slice(0, 100),
      ownerId,
      createdAt: now,
    };

    if (authMode === 'demo') {
      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, ...updatedFields, updatedAt: now } : item
        )
      );
      setAuditLogs((prev) => [logEntry, ...prev]);
      toast.success(`Data "${updatedFields.namaBarang}" diperbarui.`);
      return;
    }

    setSyncing(true);
    try {
      await updateDoc(doc(db, 'inventory_items', id), {
        ...updatedFields,
        updatedAt: serverTimestamp(),
      });
      await setDoc(doc(db, 'audit_logs', logId), {
        ...logEntry,
        createdAt: serverTimestamp(),
      });
      toast.success(`Data "${updatedFields.namaBarang}" diperbarui di Firestore.`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `inventory_items/${id}`);
    } finally {
      setSyncing(false);
    }
  };

  const verifyItem = async (
    id: string,
    kondisi: KondisiBarang,
    statusVerifikasi: StatusVerifikasi,
    catatan: string
  ) => {
    const existing = items.find((it) => it.id === id);
    if (!existing) return;

    const now = new Date().toISOString();
    const logId = generateSafeId('log');
    const ownerId = user?.uid || DEMO_USER_ID;
    const cleanNote = (catatan.trim() || `Status diubah menjadi ${statusVerifikasi} (${kondisi}).`).slice(
      0,
      BLUEPRINT_CONSTRAINTS.maxCatatanLength
    );

    const logEntry: AuditLog = {
      id: logId,
      itemId: id,
      kodeBarang: existing.kodeBarang,
      namaBarang: existing.namaBarang,
      aksi: 'Audit Kondisi',
      catatan: cleanNote,
      petugas: (user?.displayName || 'Petugas').slice(0, 100),
      ownerId,
      createdAt: now,
    };

    if (authMode === 'demo') {
      setItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, kondisi, statusVerifikasi, updatedAt: now }
            : item
        )
      );
      setAuditLogs((prev) => [logEntry, ...prev]);
      toast.success(`Audit "${existing.namaBarang}" disimpan.`);
      return;
    }

    setSyncing(true);
    try {
      await updateDoc(doc(db, 'inventory_items', id), {
        kondisi,
        statusVerifikasi,
        updatedAt: serverTimestamp(),
      });
      await setDoc(doc(db, 'audit_logs', logId), {
        ...logEntry,
        createdAt: serverTimestamp(),
      });
      toast.success(`Hasil audit "${existing.namaBarang}" disimpan.`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `inventory_items/${id}`);
    } finally {
      setSyncing(false);
    }
  };

  const deleteItem = async (id: string) => {
    const existing = items.find((it) => it.id === id);
    if (!existing) return;

    const now = new Date().toISOString();
    const logId = generateSafeId('log');
    const ownerId = user?.uid || DEMO_USER_ID;

    const logEntry: AuditLog = {
      id: logId,
      itemId: id,
      kodeBarang: existing.kodeBarang,
      namaBarang: existing.namaBarang,
      aksi: 'Hapus Barang',
      catatan: `Penghapusan data barang dari ${existing.ruangan}.`,
      petugas: (user?.displayName || 'Petugas').slice(0, 100),
      ownerId,
      createdAt: now,
    };

    if (authMode === 'demo') {
      setItems((prev) => prev.filter((item) => item.id !== id));
      setAuditLogs((prev) => [logEntry, ...prev]);
      toast.success(`"${existing.namaBarang}" telah dihapus.`);
      return;
    }

    setSyncing(true);
    try {
      // Write audit log BEFORE deleting item so relational exists() check in rules succeeds
      await setDoc(doc(db, 'audit_logs', logId), {
        ...logEntry,
        createdAt: serverTimestamp(),
      });
      await deleteDoc(doc(db, 'inventory_items', id));
      toast.success(`"${existing.namaBarang}" telah dihapus dari Firestore.`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `inventory_items/${id}`);
    } finally {
      setSyncing(false);
    }
  };

  const addRoom = async (values: RoomFormValues) => {
    const ownerId = user?.uid || DEMO_USER_ID;
    const roomId = generateSafeId('room');
    const now = new Date().toISOString();

    const newRoom: Room = {
      id: roomId,
      kodeRuang: values.kodeRuang.trim().toUpperCase().slice(0, BLUEPRINT_CONSTRAINTS.maxKodeRuangLength),
      namaRuang: values.namaRuang.trim().slice(0, BLUEPRINT_CONSTRAINTS.maxRuanganLength),
      penanggungJawab: values.penanggungJawab.trim().slice(0, BLUEPRINT_CONSTRAINTS.maxPenanggungJawabLength),
      kapasitasBarang: Math.max(1, Math.min(100000, Number(values.kapasitasBarang))),
      lokasi: values.lokasi.trim().slice(0, BLUEPRINT_CONSTRAINTS.maxLokasiLength),
      ownerId,
      createdAt: now,
      updatedAt: now,
    };

    if (authMode === 'demo') {
      setRooms((prev) => [...prev, newRoom]);
      toast.success(`Ruangan "${newRoom.namaRuang}" ditambahkan.`);
      return;
    }

    setSyncing(true);
    try {
      await setDoc(doc(db, 'rooms', roomId), {
        ...newRoom,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast.success(`Ruangan "${newRoom.namaRuang}" tersimpan.`);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `rooms/${roomId}`);
    } finally {
      setSyncing(false);
    }
  };

  const updateRoom = async (id: string, values: RoomFormValues) => {
    const now = new Date().toISOString();
    const updated = {
      kodeRuang: values.kodeRuang.trim().toUpperCase().slice(0, BLUEPRINT_CONSTRAINTS.maxKodeRuangLength),
      namaRuang: values.namaRuang.trim().slice(0, BLUEPRINT_CONSTRAINTS.maxRuanganLength),
      penanggungJawab: values.penanggungJawab.trim().slice(0, BLUEPRINT_CONSTRAINTS.maxPenanggungJawabLength),
      kapasitasBarang: Math.max(1, Math.min(100000, Number(values.kapasitasBarang))),
      lokasi: values.lokasi.trim().slice(0, BLUEPRINT_CONSTRAINTS.maxLokasiLength),
    };

    if (authMode === 'demo') {
      setRooms((prev) =>
        prev.map((r) => (r.id === id ? { ...r, ...updated, updatedAt: now } : r))
      );
      setItems((prev) =>
        prev.map((it) => (it.roomId === id ? { ...it, ruangan: updated.namaRuang } : it))
      );
      toast.success(`Ruangan "${updated.namaRuang}" diperbarui.`);
      return;
    }

    setSyncing(true);
    try {
      await updateDoc(doc(db, 'rooms', id), {
        ...updated,
        updatedAt: serverTimestamp(),
      });
      toast.success(`Ruangan "${updated.namaRuang}" diperbarui.`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `rooms/${id}`);
    } finally {
      setSyncing(false);
    }
  };

  const deleteRoom = async (id: string) => {
    const linkedCount = items.filter((it) => it.roomId === id).length;
    if (linkedCount > 0) {
      toast.error(`Ruangan masih digunakan oleh ${linkedCount} data barang. Pindahkan barang terlebih dahulu.`);
      return;
    }

    if (authMode === 'demo') {
      setRooms((prev) => prev.filter((r) => r.id !== id));
      toast.success('Ruangan berhasil dihapus.');
      return;
    }

    setSyncing(true);
    try {
      await deleteDoc(doc(db, 'rooms', id));
      toast.success('Ruangan berhasil dihapus.');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `rooms/${id}`);
    } finally {
      setSyncing(false);
    }
  };

  const updateSchoolProfile = async (values: SchoolProfileFormValues) => {
    const ownerId = user?.uid || DEMO_USER_ID;
    const now = new Date().toISOString();
    const sanitized = {
      namaSekolah: values.namaSekolah.trim().slice(0, 120),
      npsn: values.npsn.trim().slice(0, 16),
      statusAkreditasi: values.statusAkreditasi,
      alamat: values.alamat.trim().slice(0, 200),
      kecamatan: values.kecamatan.trim().slice(0, 80),
      kabupaten: values.kabupaten.trim().slice(0, 80),
      provinsi: values.provinsi.trim().slice(0, 80),
      kodePos: values.kodePos.trim().slice(0, 5),
      telepon: values.telepon.trim().slice(0, 30),
      emailSekolah: values.emailSekolah.trim().slice(0, 160),
      kepalaSekolah: values.kepalaSekolah.trim().slice(0, 100),
      nipKepalaSekolah: values.nipKepalaSekolah.trim().slice(0, 30),
      pengurusBarang: values.pengurusBarang.trim().slice(0, 100),
      tahunAnggaran: values.tahunAnggaran.trim().slice(0, 4),
    };

    if (authMode === 'demo') {
      setSchoolProfile((prev) => ({
        id: prev?.id || ownerId,
        ownerId,
        createdAt: prev?.createdAt || now,
        updatedAt: now,
        ...sanitized,
      }));
      toast.success('Profil sekolah berhasil diperbarui.');
      return;
    }

    setSyncing(true);
    try {
      const ref = doc(db, 'school_profiles', ownerId);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        await updateDoc(ref, {
          ...sanitized,
          updatedAt: serverTimestamp(),
        });
      } else {
        await setDoc(ref, {
          id: ownerId,
          ownerId,
          ...sanitized,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      toast.success('Profil sekolah tersimpan ke Firestore.');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `school_profiles/${ownerId}`);
    } finally {
      setSyncing(false);
    }
  };

  const updateAccountProfile = async (displayName: string, role?: UserRole) => {
    if (!user) return;
    const cleanName = displayName.trim().slice(0, 100);
    if (!cleanName) {
      toast.error('Nama tampilan tidak boleh kosong.');
      return;
    }

    const now = new Date().toISOString();
    const isAdmin = firebaseUser?.email === 'muhamad.rafli@gmail.com' && firebaseUser?.emailVerified;

    if (authMode === 'demo') {
      setUser((prev) =>
        prev
          ? {
              ...prev,
              displayName: cleanName,
              role: role || prev.role,
              updatedAt: now,
            }
          : null
      );
      toast.success('Pengaturan akun berhasil diperbarui.');
      return;
    }

    setSyncing(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      if (isAdmin && role) {
        await updateDoc(userRef, {
          displayName: cleanName,
          role,
          updatedAt: serverTimestamp(),
        });
      } else {
        await updateDoc(userRef, {
          displayName: cleanName,
          updatedAt: serverTimestamp(),
        });
      }
      setUser((prev) =>
        prev
          ? {
              ...prev,
              displayName: cleanName,
              role: isAdmin && role ? role : prev.role,
              updatedAt: now,
            }
          : null
      );
      toast.success('Profil akun berhasil diperbarui di Firestore.');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    } finally {
      setSyncing(false);
    }
  };

  const exportDatabaseBackup = (): DatabaseBackupPayload => {
    return {
      schemaVersion: '1.0',
      exportedAt: new Date().toISOString(),
      appName: schoolProfile?.namaSekolah || 'INVENTARIS BARANG SDN 006 SUNGAI BULUH',
      schoolProfile,
      rooms,
      items,
      auditLogs,
    };
  };

  const restoreDatabaseBackup = async (
    payload: DatabaseBackupPayload,
    mode: 'merge' | 'replace'
  ): Promise<{ roomsCount: number; itemsCount: number }> => {
    const ownerId = user?.uid || DEMO_USER_ID;
    const now = new Date().toISOString();
    const petugas = (user?.displayName || 'Petugas').slice(0, 100);

    // Remap room IDs & item IDs safely so every restored doc passes ownerId & regex constraints
    const roomIdMap = new Map<string, string>();
    const preparedRooms: Room[] = [];
    const existingRoomsSnapshot = mode === 'replace' ? [] : rooms;

    for (let i = 0; i < payload.rooms.length; i += 1) {
      const r = payload.rooms[i];
      const existingMatch = existingRoomsSnapshot.find(
        (er) => er.kodeRuang.toLowerCase() === String(r.kodeRuang || '').toLowerCase()
      );
      if (existingMatch && mode === 'merge') {
        roomIdMap.set(r.id, existingMatch.id);
        continue;
      }
      const nextRoomId =
        mode === 'replace' && BLUEPRINT_CONSTRAINTS.idRegex.test(String(r.id || ''))
          ? `${String(r.id).slice(0, 96)}_${ownerId.slice(0, 8)}`
          : generateSafeId(`rm${i}`);
      roomIdMap.set(r.id, nextRoomId);
      preparedRooms.push({
        id: nextRoomId,
        kodeRuang: String(r.kodeRuang || `R-${i + 1}`)
          .trim()
          .toUpperCase()
          .replace(/[^A-Z0-9._-]/g, '-')
          .slice(0, BLUEPRINT_CONSTRAINTS.maxKodeRuangLength),
        namaRuang: String(r.namaRuang || 'Ruangan')
          .trim()
          .slice(0, BLUEPRINT_CONSTRAINTS.maxRuanganLength),
        penanggungJawab: String(r.penanggungJawab || 'Pengurus Barang')
          .trim()
          .slice(0, BLUEPRINT_CONSTRAINTS.maxPenanggungJawabLength),
        kapasitasBarang: Math.max(1, Math.min(100000, Number(r.kapasitasBarang) || 50)),
        lokasi: String(r.lokasi || 'Gedung Sekolah')
          .trim()
          .slice(0, BLUEPRINT_CONSTRAINTS.maxLokasiLength),
        ownerId,
        createdAt: now,
        updatedAt: now,
      });
    }

    const fallbackRoom = preparedRooms[0] || existingRoomsSnapshot[0];
    const preparedItems: InventoryItem[] = [];
    const preparedLogs: AuditLog[] = [];

    for (let i = 0; i < payload.items.length; i += 1) {
      const it = payload.items[i];
      const mappedRoomId = roomIdMap.get(it.roomId) || fallbackRoom?.id;
      if (!mappedRoomId) continue;
      const roomObj =
        preparedRooms.find((rm) => rm.id === mappedRoomId) ||
        existingRoomsSnapshot.find((rm) => rm.id === mappedRoomId) ||
        fallbackRoom;

      const nextItemId = generateSafeId(`rst${i}`);
      const nextLogId = generateSafeId(`rlog${i}`);

      const cleanItem: InventoryItem = {
        id: nextItemId,
        kodeBarang: String(it.kodeBarang || `KIB-R.${i + 1}`)
          .trim()
          .toUpperCase()
          .replace(/[^A-Z0-9._-]/g, '-')
          .slice(0, BLUEPRINT_CONSTRAINTS.maxKodeBarangLength),
        namaBarang: String(it.namaBarang || 'Barang Inventaris')
          .trim()
          .slice(0, BLUEPRINT_CONSTRAINTS.maxNamaBarangLength),
        kategori: it.kategori,
        ruangan: (roomObj?.namaRuang || it.ruangan || 'Ruangan').slice(
          0,
          BLUEPRINT_CONSTRAINTS.maxRuanganLength
        ),
        roomId: mappedRoomId,
        jumlah: Math.max(0, Math.min(1000000, Number(it.jumlah) || 0)),
        satuan: it.satuan,
        kondisi: it.kondisi,
        statusVerifikasi: it.statusVerifikasi,
        sumberDana: it.sumberDana,
        hargaSatuan: Math.max(0, Math.min(10000000000, Number(it.hargaSatuan) || 0)),
        tanggalPerolehan: BLUEPRINT_CONSTRAINTS.dateRegex.test(String(it.tanggalPerolehan || ''))
          ? it.tanggalPerolehan
          : now.slice(0, 10),
        keterangan: String(it.keterangan || '').trim().slice(0, BLUEPRINT_CONSTRAINTS.maxKeteranganLength),
        fotoBarang: sanitizeFotoBarang(it.fotoBarang),
        ownerId,
        createdAt: now,
        updatedAt: now,
      };

      preparedItems.push(cleanItem);
      preparedLogs.push({
        id: nextLogId,
        itemId: nextItemId,
        kodeBarang: cleanItem.kodeBarang,
        namaBarang: cleanItem.namaBarang,
        aksi: 'Tambah Barang',
        catatan: `Pemulihan database (${mode === 'replace' ? 'Reset & Pulihkan' : 'Gabung Data'}).`,
        petugas,
        ownerId,
        createdAt: now,
      });
    }

    const restoredProfile: SchoolProfile | null = payload.schoolProfile
      ? {
          ...payload.schoolProfile,
          id: ownerId,
          ownerId,
          createdAt: schoolProfile?.createdAt || now,
          updatedAt: now,
        }
      : null;

    if (authMode === 'demo') {
      if (mode === 'replace') {
        setRooms(preparedRooms);
        setItems(preparedItems);
        setAuditLogs(preparedLogs);
      } else {
        setRooms((prev) => [...prev, ...preparedRooms]);
        setItems((prev) => [...preparedItems, ...prev]);
        setAuditLogs((prev) => [...preparedLogs, ...prev]);
      }
      if (restoredProfile) {
        setSchoolProfile(restoredProfile);
      }
      toast.success(
        `Pemulihan selesai: ${preparedRooms.length} ruangan & ${preparedItems.length} barang dipulihkan.`
      );
      return { roomsCount: preparedRooms.length, itemsCount: preparedItems.length };
    }

    setSyncing(true);
    try {
      const CHUNK = 400;
      if (mode === 'replace') {
        const ownedItems = items.filter((it) => it.ownerId === ownerId);
        for (let i = 0; i < ownedItems.length; i += CHUNK) {
          const delBatch = writeBatch(db);
          for (const it of ownedItems.slice(i, i + CHUNK)) {
            delBatch.delete(doc(db, 'inventory_items', it.id));
          }
          await delBatch.commit();
        }
        const ownedRooms = rooms.filter((r) => r.ownerId === ownerId);
        for (let i = 0; i < ownedRooms.length; i += CHUNK) {
          const delBatch = writeBatch(db);
          for (const r of ownedRooms.slice(i, i + CHUNK)) {
            delBatch.delete(doc(db, 'rooms', r.id));
          }
          await delBatch.commit();
        }
      }

      for (let i = 0; i < preparedRooms.length; i += CHUNK) {
        const batch = writeBatch(db);
        for (const r of preparedRooms.slice(i, i + CHUNK)) {
          batch.set(doc(db, 'rooms', r.id), {
            ...r,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
        await batch.commit();
      }

      for (let i = 0; i < preparedItems.length; i += CHUNK) {
        const batch = writeBatch(db);
        for (const it of preparedItems.slice(i, i + CHUNK)) {
          batch.set(doc(db, 'inventory_items', it.id), {
            ...it,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
        await batch.commit();
      }

      for (let i = 0; i < preparedLogs.length; i += CHUNK) {
        const batch = writeBatch(db);
        for (const log of preparedLogs.slice(i, i + CHUNK)) {
          batch.set(doc(db, 'audit_logs', log.id), {
            ...log,
            createdAt: serverTimestamp(),
          });
        }
        await batch.commit();
      }

      if (restoredProfile) {
        const profRef = doc(db, 'school_profiles', ownerId);
        const existingProf = await getDoc(profRef);
        if (existingProf.exists()) {
          await updateDoc(profRef, {
            namaSekolah: restoredProfile.namaSekolah,
            npsn: restoredProfile.npsn,
            statusAkreditasi: restoredProfile.statusAkreditasi,
            alamat: restoredProfile.alamat,
            kecamatan: restoredProfile.kecamatan,
            kabupaten: restoredProfile.kabupaten,
            provinsi: restoredProfile.provinsi,
            kodePos: restoredProfile.kodePos,
            telepon: restoredProfile.telepon,
            emailSekolah: restoredProfile.emailSekolah,
            kepalaSekolah: restoredProfile.kepalaSekolah,
            nipKepalaSekolah: restoredProfile.nipKepalaSekolah,
            pengurusBarang: restoredProfile.pengurusBarang,
            tahunAnggaran: restoredProfile.tahunAnggaran,
            updatedAt: serverTimestamp(),
          });
        } else {
          await setDoc(profRef, {
            ...restoredProfile,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      }

      toast.success(
        `Database berhasil dipulihkan (${preparedRooms.length} ruangan, ${preparedItems.length} barang).`
      );
      return { roomsCount: preparedRooms.length, itemsCount: preparedItems.length };
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'restore_database');
    } finally {
      setSyncing(false);
    }
  };

  const resetDatabaseToSeed = async () => {
    const ownerId = user?.uid || DEMO_USER_ID;
    const defaultProfile = buildSeedSchoolProfile(ownerId);
    const defaultRooms = buildSeedRooms(ownerId);
    const defaultItems = buildSeedInventory(ownerId, defaultRooms);
    const defaultLogs = buildSeedAuditLogs(
      ownerId,
      defaultItems,
      user?.displayName || 'Petugas Inventaris'
    );

    await restoreDatabaseBackup(
      {
        schemaVersion: '1.0',
        exportedAt: new Date().toISOString(),
        appName: defaultProfile.namaSekolah,
        schoolProfile: defaultProfile,
        rooms: defaultRooms,
        items: defaultItems,
        auditLogs: defaultLogs,
      },
      'replace'
    );
  };

  const seedInitialData = async () => {
    if (authMode === 'demo') {
      initDemoDataset();
      toast.success('Data awal inventaris SDN 006 Sungai Buluh dimuat ulang.');
      return;
    }
    if (!firebaseUser) return;
    setSyncing(true);
    try {
      await seedFirestoreForUser(
        firebaseUser.uid,
        user?.displayName || firebaseUser.displayName || 'Petugas'
      );
      toast.success('Data contoh SDN 006 Sungai Buluh berhasil disinkronkan.');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <InventoryContext.Provider
      value={{
        authMode,
        loadingAuth,
        loadingData,
        syncing,
        user,
        schoolProfile,
        items,
        rooms,
        auditLogs,
        authError,
        loginWithGoogle,
        loginDemoMode,
        logout,
        addItem,
        importItems,
        updateItem,
        verifyItem,
        deleteItem,
        addRoom,
        updateRoom,
        deleteRoom,
        updateSchoolProfile,
        updateAccountProfile,
        exportDatabaseBackup,
        restoreDatabaseBackup,
        resetDatabaseToSeed,
        seedInitialData,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
}

export function useInventory() {
  const ctx = useContext(InventoryContext);
  if (!ctx) throw new Error('useInventory harus digunakan di dalam InventoryProvider');
  return ctx;
}
