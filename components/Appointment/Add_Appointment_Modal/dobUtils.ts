export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/** Returns clamped y/m/d parts and `full` as YYYY-MM-DD when all set (for API). */
export function normalizeDobParts(y: string, m: string, d: string) {
  const now = new Date();
  const maxY = now.getFullYear();
  const maxM = now.getMonth() + 1;
  const maxDnow = now.getDate();

  let yy = y;
  let mm = m;
  let dd = d;

  if (yy && parseInt(yy, 10) > maxY) yy = String(maxY);

  if (yy && mm) {
    const yi = parseInt(yy, 10);
    const mi = parseInt(mm, 10);
    if (yi === maxY && mi > maxM) mm = String(maxM).padStart(2, "0");
  }

  if (yy && mm && dd) {
    const yi = parseInt(yy, 10);
    const mi = parseInt(mm, 10);
    const di = parseInt(dd, 10);
    let cap = daysInMonth(yi, mi);
    if (yi === maxY && mi === maxM) cap = Math.min(cap, maxDnow);
    if (di > cap) dd = String(cap).padStart(2, "0");
  }

  const full =
    yy && mm && dd ? `${yy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}` : "";

  return { y: yy, m: mm, d: dd, full };
}

export function monthShortLabel(mm: string) {
  const n = parseInt(mm, 10);
  if (n < 1 || n > 12) return mm;
  return new Date(2024, n - 1, 1).toLocaleString(undefined, { month: "short" });
}

export function buildYearOptions(): string[] {
  const y = new Date().getFullYear();
  return Array.from({ length: 121 }, (_, i) => String(y - i));
}

export function buildMonthOptionsForYear(yearStr: string): string[] {
  const now = new Date();
  const maxY = now.getFullYear();
  const maxM = now.getMonth() + 1;
  const sy = parseInt(yearStr, 10);
  const cap = !yearStr || Number.isNaN(sy) ? 12 : sy === maxY ? maxM : 12;
  return Array.from({ length: cap }, (_, i) => String(i + 1).padStart(2, "0"));
}

export function buildDayOptionsForDate(yearStr: string, monthStr: string): string[] {
  const now = new Date();
  const maxY = now.getFullYear();
  const maxM = now.getMonth() + 1;
  const maxD = now.getDate();
  if (!yearStr || !monthStr) {
    return Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, "0"));
  }
  const yi = parseInt(yearStr, 10);
  const mi = parseInt(monthStr, 10);
  if (Number.isNaN(yi) || Number.isNaN(mi)) {
    return Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, "0"));
  }
  let cap = daysInMonth(yi, mi);
  if (yi === maxY && mi === maxM) cap = Math.min(cap, maxD);
  return Array.from({ length: cap }, (_, i) => String(i + 1).padStart(2, "0"));
}
