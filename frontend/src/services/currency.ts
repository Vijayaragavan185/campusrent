const inrCurrencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
});

const inrWholeFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

function toValidNumber(value: number | string | null | undefined) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatINR(value: number | string | null | undefined) {
  return inrCurrencyFormatter.format(toValidNumber(value));
}

export function formatINRWhole(value: number | string | null | undefined) {
  return inrWholeFormatter.format(toValidNumber(value));
}
