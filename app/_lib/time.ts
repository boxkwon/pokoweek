const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DATE_OVERRIDE_ENABLED = process.env.NEXT_PUBLIC_ENABLE_DATE_OVERRIDE === "true";

export function isDateKey(value: string | undefined): value is string {
  if (!value || !DATE_KEY_PATTERN.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return parsed.getUTCFullYear() === year
    && parsed.getUTCMonth() === month - 1
    && parsed.getUTCDate() === day;
}

export function getDateAtSeoulNoon(dateKey: string) {
  return new Date(`${dateKey}T12:00:00+09:00`);
}

export function getAppNow(dateOverride?: string, fallback?: Date) {
  if (isValidDateOverride(dateOverride)) {
    const overridden = getDateAtSeoulNoon(dateOverride);
    if (!Number.isNaN(overridden.getTime())) return overridden;
  }
  return fallback ?? new Date();
}

export function isValidDateOverride(value: string | undefined): value is string {
  return DATE_OVERRIDE_ENABLED && isDateKey(value);
}
