/** Первый день месяца в формате YYYY-MM-DD */
export function getMonthStart(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}-01`;
}

/** Последний день месяца в формате YYYY-MM-DD */
export function getMonthEnd(d: Date): string {
  const next = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return next.toISOString().slice(0, 10);
}

/** Сегодня в формате YYYY-MM-DD */
export function getToday(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Начало текущего месяца — сегодня (для периода «по сегодня») */
export function getDefaultDateFrom(): string {
  return getMonthStart(new Date());
}

/** Конец периода по умолчанию — сегодня */
export function getDefaultDateTo(): string {
  return getToday();
}

const ruDateOptions: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "short",
  year: "numeric",
};

/** Форматирует период для отображения (например: "1 мар 2025 – 14 мар 2025") */
export function formatDateRange(dateFrom: string, dateTo: string): string {
  const from = new Date(dateFrom + "T00:00:00");
  const to = new Date(dateTo + "T00:00:00");
  return `${from.toLocaleDateString("ru-RU", ruDateOptions)} – ${to.toLocaleDateString("ru-RU", ruDateOptions)}`;
}
