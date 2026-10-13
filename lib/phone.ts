/** Malaysia mobiles as shown on the login screen: prefix +6, local part starting with 01. */
export function normalizeMalaysiaPhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  let full = digits;
  if (digits.startsWith("0")) full = `6${digits}`;
  else if (digits.startsWith("1")) full = `60${digits}`;
  if (!/^601\d{8,9}$/.test(full)) return null;
  return full;
}

export function displayLocalPhone(full: string): string {
  return full.startsWith("6") ? full.slice(1) : full;
}
