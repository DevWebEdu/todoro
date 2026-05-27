const TZ = 'America/Lima';

/** Returns today's date as YYYY-MM-DD in Peru timezone */
export function todayPeru(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: TZ });
}

/** Converts any Date to YYYY-MM-DD using Peru timezone */
export function toDateStrPeru(d: Date): string {
  return d.toLocaleDateString('en-CA', { timeZone: TZ });
}

/** Formats an ISO timestamp as HH:MM am/pm in Peru timezone */
export function formatTimePeru(isoStr: string): string {
  return new Intl.DateTimeFormat('es-PE', {
    timeZone: TZ,
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(isoStr));
}
