import { lastDayOfMonth } from "date-fns";

export function nextQuincena(from: Date): Date {
  const day = from.getDate();
  if (day <= 15) {
    const d = new Date(from);
    d.setDate(15);
    return stripTime(d);
  }
  return stripTime(lastDayOfMonth(from));
}

export function daysBetweenInclusiveStartExclusiveEnd(start: Date, end: Date): number {
  const ms = stripTime(end).getTime() - stripTime(start).getTime();
  return Math.max(0, Math.round(ms / (1000 * 60 * 60 * 24)));
}

export function daysBetweenExclusiveStartInclusiveEnd(start: Date, end: Date): number {
  const startNext = new Date(start);
  startNext.setDate(startNext.getDate() + 1);
  const ms = stripTime(end).getTime() - stripTime(startNext).getTime();
  return Math.max(0, Math.round(ms / (1000 * 60 * 60 * 24))) + 1;
}

export function stripTime(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}


