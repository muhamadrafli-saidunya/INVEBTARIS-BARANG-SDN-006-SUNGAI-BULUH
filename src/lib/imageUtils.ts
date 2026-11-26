import { BLUEPRINT_CONSTRAINTS } from '@/src/types/inventory';

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
]);

export function sanitizeFotoBarang(value?: string): string {
  const trimmed = String(value ?? '').trim();
  if (!trimmed) return '';
  if (trimmed.length > BLUEPRINT_CONSTRAINTS.maxFotoBarangLength) {
    return '';
  }
  if (/^https?:\/\/\S+$/i.test(trimmed)) {
    return trimmed;
  }
  if (/^data:image\/(jpeg|jpg|png|webp);base64,[A-Za-z0-9+/=]+$/i.test(trimmed)) {
    return trimmed;
  }
  return '';
}

export function isValidFotoBarangInput(value?: string): boolean {
  const trimmed = String(value ?? '').trim();
  if (!trimmed) return true;
  if (trimmed.length > BLUEPRINT_CONSTRAINTS.maxFotoBarangLength) {
    return false;
  }
  return (
    /^https?:\/\/\S+$/i.test(trimmed) ||
    /^data:image\/(jpeg|jpg|png|webp);base64,[A-Za-z0-9+/=]+$/i.test(trimmed)
  );
}

export async function compressInventoryImage(file: File): Promise<string> {
  if (!ALLOWED_MIME_TYPES.has(file.type.toLowerCase())) {
    throw new Error('Format gambar harus JPG, PNG, WebP, atau GIF.');
  }

  const maxRawBytes = 10 * 1024 * 1024;
  if (file.size > maxRawBytes) {
    throw new Error('Ukuran file gambar maksimal 10 MB.');
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('File gambar tidak dapat dibaca.'));
      el.src = objectUrl;
    });

    const attempts: Array<{ maxDim: number; quality: number }> = [
      { maxDim: 800, quality: 0.78 },
      { maxDim: 640, quality: 0.68 },
      { maxDim: 480, quality: 0.58 },
      { maxDim: 360, quality: 0.5 },
    ];

    for (const attempt of attempts) {
      const scale = Math.min(1, attempt.maxDim / Math.max(img.width, img.height, 1));
      const targetWidth = Math.max(1, Math.round(img.width * scale));
      const targetHeight = Math.max(1, Math.round(img.height * scale));

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Browser tidak mendukung pemrosesan gambar kanvas.');
      }

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, targetWidth, targetHeight);
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      const dataUrl = canvas.toDataURL('image/jpeg', attempt.quality);
      if (dataUrl.length <= BLUEPRINT_CONSTRAINTS.maxFotoBarangLength) {
        return dataUrl;
      }
    }

    throw new Error(
      'Ukuran gambar hasil kompresi masih terlalu besar. Gunakan gambar dengan resolusi lebih kecil.'
    );
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
