const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DATE_OVERRIDE_ENABLED = process.env.NEXT_PUBLIC_ENABLE_DATE_OVERRIDE === "true";

export function getAppNow(dateOverride?: string, fallback?: Date) {
  if (isValidDateOverride(dateOverride)) {
    const overridden = new Date(`${dateOverride}T12:00:00+09:00`);
    if (!Number.isNaN(overridden.getTime())) return overridden;
  }
  return fallback ?? new Date();
}

export function isValidDateOverride(value: string | undefined): value is string {
  return DATE_OVERRIDE_ENABLED && Boolean(value && DATE_KEY_PATTERN.test(value));
}
