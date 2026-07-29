export const taskSchemaLimits = {
  maxTasks: 10_000,
  maxIdLength: 200,
  maxTitleLength: 500,
  maxNotesLength: 20_000,
  maxProjectLength: 200,
  maxLabels: 50,
  maxLabelLength: 100,
} as const;

export function isCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export function isIsoTimestamp(value: string): boolean {
  const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/.exec(value);
  if (!match) return false;
  const [, date, hours, minutes, seconds, timezone] = match;
  if (!isCalendarDate(date) || Number(hours) > 23 || Number(minutes) > 59 || (seconds !== undefined && Number(seconds) > 59)) return false;
  if (timezone !== 'Z') {
    const [offsetHours, offsetMinutes] = timezone.slice(1).split(':').map(Number);
    if (offsetHours > 14 || offsetMinutes > 59 || (offsetHours === 14 && offsetMinutes !== 0)) return false;
  }
  return !Number.isNaN(Date.parse(value));
}
