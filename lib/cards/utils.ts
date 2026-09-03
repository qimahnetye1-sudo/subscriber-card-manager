import type { AuditLog, Card, DateRange, Package, ReportStats, Subscriber } from "./types";

export function normalizePhone(value: string) {
  return value.replace(/[\s()-]/g, "").trim();
}

export function parseCardCodes(input: string) {
  const lines = input.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const valid = lines.filter((line) => /^\d+$/.test(line));
  const unique = Array.from(new Set(valid));

  return {
    codes: unique,
    invalidCount: lines.length - valid.length,
    duplicateCount: valid.length - unique.length,
  };
}

export function isCurrentCalendarMonth(iso: string | null, reference = new Date()) {
  if (!iso) return false;
  const date = new Date(iso);
  return date.getFullYear() === reference.getFullYear() && date.getMonth() === reference.getMonth();
}

export function monthlyAllocationCount(cards: Card[], subscriberId: string, reference = new Date()) {
  return cards.filter((card) => card.subscriberId === subscriberId && isCurrentCalendarMonth(card.sentAt, reference)).length;
}

export function allocationBlockReason(card: Card, cards: Card[], subscriberId: string, reference = new Date()) {
  if (card.isFrozen || card.subscriberId) return "هذه البطاقة مجمدة أو خُصصت مسبقًا.";
  if (monthlyAllocationCount(cards, subscriberId, reference) >= 3) return "بلغ المشترك الحد الشهري: 3 بطاقات.";
  return null;
}

export function cardsForPackage(cards: Card[], packageId: string) {
  return cards.filter((card) => card.packageId === packageId);
}

export function availableCardsForPackage(cards: Card[], packageId: string) {
  return cardsForPackage(cards, packageId).filter((card) => !card.isFrozen && !card.subscriberId);
}

export function getReportStats(subscribers: Subscriber[], packages: Package[], cards: Card[]): ReportStats {
  const allocated = cards.filter((card) => card.isFrozen && card.subscriberId);
  const packageMap = new Map(packages.map((item) => [item.id, item]));
  const totalRevenue = allocated.reduce((sum, card) => sum + (packageMap.get(card.packageId)?.price ?? 0), 0);
  const usedGb = allocated.reduce((sum, card) => sum + (packageMap.get(card.packageId)?.sizeGb ?? 0), 0);
  const monthlyAllocatedCards = allocated.filter((card) => isCurrentCalendarMonth(card.sentAt));
  const monthlyAllocated = monthlyAllocatedCards.length;
  const monthlyUsedGb = monthlyAllocatedCards.reduce((sum, card) => sum + (packageMap.get(card.packageId)?.sizeGb ?? 0), 0);

  return {
    totalSubscribers: subscribers.length,
    totalPackages: packages.length,
    totalCards: cards.length,
    allocatedCards: allocated.length,
    availableCards: cards.filter((card) => !card.isFrozen && !card.subscriberId).length,
    totalRevenue,
    averagePackagePrice: packages.length ? packages.reduce((sum, item) => sum + item.price, 0) / packages.length : 0,
    monthlyAllocated,
    usedGb,
    monthlyUsedGb,
  };
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("ar", { maximumFractionDigits: 2 }).format(value);
}

export function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("ar", { year: "numeric", month: "long", day: "numeric" }).format(new Date(value));
}

function startOfDay(value: string) {
  const normalized = value.trim().replace(/\//g, "-");
  const date = new Date(`${normalized}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function endOfDay(value: string) {
  const normalized = value.trim().replace(/\//g, "-");
  const date = new Date(`${normalized}T23:59:59.999`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function isWithinDateRange(value: string, range: DateRange) {
  const date = new Date(value);
  const from = range.from ? startOfDay(range.from) : null;
  const to = range.to ? endOfDay(range.to) : null;
  if (Number.isNaN(date.getTime())) return false;
  if (from && date < from) return false;
  if (to && date > to) return false;
  return true;
}

export function auditLogsInRange(logs: AuditLog[], range: DateRange) {
  return logs.filter((log) => isWithinDateRange(log.createdAt, range));
}

export function auditLogsSearch(logs: AuditLog[], query: string) {
  const normalized = query.trim().toLocaleLowerCase();
  if (!normalized) return logs;
  return logs.filter((log) => log.subscriberName.toLocaleLowerCase().includes(normalized) || log.codeSnapshot.toLocaleLowerCase().includes(normalized));
}

export type QuickPeriod = "today" | "last7" | "currentMonth" | "previousMonth" | "custom";

function padDatePart(value: number) { return String(value).padStart(2, "0"); }

export function formatDateInput(date: Date) {
  return `${date.getFullYear()}/${padDatePart(date.getMonth() + 1)}/${padDatePart(date.getDate())}`;
}

export function getQuickDateRange(period: Exclude<QuickPeriod, "custom">, reference = new Date()): DateRange {
  const end = new Date(reference.getFullYear(), reference.getMonth(), reference.getDate());
  let start = new Date(end);
  if (period === "last7") start.setDate(start.getDate() - 6);
  if (period === "currentMonth") start = new Date(end.getFullYear(), end.getMonth(), 1);
  if (period === "previousMonth") {
    start = new Date(end.getFullYear(), end.getMonth() - 1, 1);
    end.setTime(new Date(end.getFullYear(), end.getMonth(), 0).getTime());
  }
  return { from: formatDateInput(start), to: formatDateInput(end) };
}

export function dateRangeLabel(range: DateRange) {
  if (!range.from && !range.to) return "كل الفترات";
  if (range.from && range.to) return `من ${range.from} إلى ${range.to}`;
  return range.from ? `من ${range.from}` : `حتى ${range.to}`;
}
