export function imageStoragePath(value: string): string | null {
  let path = value;
  try {
    if (value.startsWith('/api/images?')) {
      path = new URL(value, 'https://local.invalid').searchParams.get('path') ?? '';
    } else if (/^https?:\/\//.test(value)) {
      const marker = '/storage/v1/object/public/land-images/';
      const url = new URL(value);
      if (!url.pathname.startsWith(marker)) return null;
      path = decodeURIComponent(url.pathname.slice(marker.length));
    }
  } catch { return null; }
  if (!path || path.startsWith('/') || path.includes('\\') || path.includes('\0') ||
      path.split('/').some(part => part === '..' || part === '.' || !part)) return null;
  return path;
}

export function protectedImageUrl(value: string): string {
  const path = imageStoragePath(value);
  return path ? `/api/images?path=${encodeURIComponent(path)}` : value;
}
