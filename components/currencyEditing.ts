/** Format an editable VND amount without losing the cursor's digit position. */
export function formatCurrencyEdit(text: string, cursor: number) {
  const raw = text.replaceAll(',', '').trim();
  if (!/^\d*$/.test(raw) || (raw !== '' && !Number.isSafeInteger(Number(raw)))) {
    return null;
  }
  const digitsBeforeCursor = text.slice(0, cursor).replace(/\D/g, '').length;
  const formatted = raw.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  let position = 0;
  let digits = 0;
  while (position < formatted.length && digits < digitsBeforeCursor) {
    if (formatted[position] !== ',') digits++;
    position++;
  }
  return {text: formatted, value: raw === '' ? 0 : Number(raw), cursor: position};
}
