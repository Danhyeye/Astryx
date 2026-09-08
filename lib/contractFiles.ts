export const CONTRACT_FILE_BUCKET = 'contract-file';
export const MAX_CONTRACT_FILE_SIZE = 10 * 1024 * 1024;
export const CONTRACT_FILE_ACCEPT = '.pdf,.docx';
export const CONTRACT_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export function detectContractFile(bytes: Uint8Array, name: string): string | null {
  if (/\.pdf$/i.test(name) && new TextDecoder().decode(bytes.slice(0,5)) === '%PDF-') return CONTRACT_MIME_TYPES[0];
  if (!/\.docx$/i.test(name) || bytes[0] !== 0x50 || bytes[1] !== 0x4b) return null;
  // Read ZIP central-directory filenames without decompressing untrusted contents.
  const names = new Set<string>();
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  for (let offset = 0; offset + 46 <= bytes.length; offset++) {
    if (view.getUint32(offset, true) !== 0x02014b50) continue;
    const nameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);
    if (offset + 46 + nameLength + extraLength + commentLength > bytes.length) return null;
    names.add(new TextDecoder().decode(bytes.slice(offset + 46, offset + 46 + nameLength)));
    offset += 45 + nameLength + extraLength + commentLength;
  }
  return names.has('[Content_Types].xml') && names.has('word/document.xml') ? CONTRACT_MIME_TYPES[1] : null;
}

export function contractFileName(name: string) {
  return name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[đĐ]/g,'d')
    .replace(/[^a-zA-Z0-9._-]/g,'_').replace(/\.{2,}/g,'_').slice(-160);
}
