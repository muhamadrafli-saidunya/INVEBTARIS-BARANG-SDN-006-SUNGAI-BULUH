# Spesifikasi Keamanan Firestore — INVENTARIS BARANG SDN 006 SUNGAI BULUH

## 1. Data Invariants
1. **Isolasi Kepemilikan & Admin Terverifikasi**: Setiap catatan inventaris (`inventory_items`), ruangan (`rooms`), dan log audit (`audit_logs`) memiliki `ownerId` yang wajib cocok dengan `request.auth.uid` saat pembuatan dan tidak dapat diubah saat pembaruan. Hanya pengguna terverifikasi (`email_verified == true`) yang dapat membaca atau menulis, dengan admin bootstrap (`muhamad.rafli@gmail.com`) sebagai pengawas penuh.
2. **Integritas Relasional Ruangan**: Dokumen `inventory_items` tidak dapat dibuat atau dipindahkan ke `roomId` yang tidak ada di koleksi `/rooms/{roomId}` atau bukan milik `ownerId` yang sama.
3. **Perlindungan PII Pengguna**: Koleksi `/users/{userId}` hanya dapat dibaca oleh pemilik akun (`uid == userId`) atau admin terverifikasi. Pengguna tidak dapat menetapkan atau menaikkan `role` menjadi `'admin'` secara mandiri.
4. **Integritas Temporal & Immutabilitas**: `createdAt` wajib sama dengan `request.time` saat pembuatan dan bersifat permanen (`immutable`) pada pembaruan; `updatedAt` wajib sama dengan `request.time` pada pembuatan dan pembaruan.
5. **Validasi Batas & Format Ketat**: Seluruh field string memiliki batas panjang eksplisit (`maxLength`) dan pola regex untuk ID (`^[a-zA-Z0-9_-]+$`), kode barang (`^[A-Z0-9._-]+$`), dan tanggal (`^[0-9]{4}-[0-9]{2}-[0-9]{2}$`).
6. **Jejak Audit Append-Only**: Dokumen `/audit_logs/{logId}` hanya dapat dibuat oleh pemilik yang sah dan tidak dapat dimodifikasi atau dihapus oleh pengguna non-admin.

## 2. "Dirty Dozen" Payloads (12 Skenario Serangan)
1. **Unauthenticated Read/Write**: Membaca/menulis `/inventory_items` tanpa `request.auth` -> `PERMISSION_DENIED`.
2. **Unverified Email Bypass**: Menulis dengan `email_verified: false` meskipun email cocok dengan admin -> `PERMISSION_DENIED`.
3. **Identity Spoofing on Create**: Membuat `inventory_items` dengan `ownerId: "victim-uid"` -> `PERMISSION_DENIED`.
4. **Shadow Field Injection**: Mengirim field tak dikenal (`isVerifiedAdmin: true`) pada payload `create` atau `update` -> `PERMISSION_DENIED`.
5. **Privilege Escalation on User Profile**: Membuat/memperbarui `/users/{uid}` dengan `role: "admin"` oleh pengguna biasa -> `PERMISSION_DENIED`.
6. **Cross-User PII Read**: Membaca `/users/{otherUid}` sebagai pengguna terautentikasi lain -> `PERMISSION_DENIED`.
7. **Orphaned Inventory Item**: Membuat `inventory_items` dengan `roomId: "non_existent_room"` -> `PERMISSION_DENIED`.
8. **Path Variable Poisoning**: Menulis dokumen dengan ID sepanjang >128 karakter atau karakter ilegal (`../admin`) -> `PERMISSION_DENIED`.
9. **Value / Type Poisoning**: Mengirim `hargaSatuan: "gratis"` atau `namaBarang` > 120 karakter saat `update` -> `PERMISSION_DENIED`.
10. **Immutable Field Tampering**: Mengubah `ownerId` atau `createdAt` saat `update` dokumen inventaris -> `PERMISSION_DENIED`.
11. **Timestamp Forgery**: Mengirim `createdAt` atau `updatedAt` dengan waktu lampau palsu selain `request.time` -> `PERMISSION_DENIED`.
12. **Blanket List Scraping**: Menjalankan query `list` pada `/inventory_items` tanpa membatasi ke `ownerId == auth.uid` -> `PERMISSION_DENIED`.
