export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function formatDate(value: string): string {
  if (!value) return '无日期';
  return new Intl.DateTimeFormat('zh-CN', { month: 'short', day: 'numeric' }).format(new Date(`${value}T00:00:00`));
}
