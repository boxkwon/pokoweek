const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function getAppNow(dateOverride?: string, fallback?: Date) {
  if (process.env.NODE_ENV === "development" && dateOverride && DATE_KEY_PATTERN.test(dateOverride)) {
    const overridden = new Date(`${dateOverride}T12:00:00+09:00`);
    if (!Number.isNaN(overridden.getTime())) return overridden;
  }
  return fallback ?? new Date();
}

export function isValidDateOverride(value: string | undefined) {
  return Boolean(value && DATE_KEY_PATTERN.test(value));
}
