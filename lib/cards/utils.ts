import type { Card, Package, ReportStats, Subscriber } from "./types";

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
  const monthlyAllocated = allocated.filter((card) => isCurrentCalendarMonth(card.sentAt)).length;

  return {
    totalSubscribers: subscribers.length,
    totalPackages: packages.length,
    totalCards: cards.length,
    allocatedCards: allocated.length,
    availableCards: cards.filter((card) => !card.isFrozen && !card.subscriberId).length,
    totalRevenue,
    averagePackagePrice: packages.length ? packages.reduce((sum, item) => sum + item.price, 0) / packages.length : 0,
    monthlyAllocated,
  };
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("ar", { maximumFractionDigits: 2 }).format(value);
}

export function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("ar", { year: "numeric", month: "long", day: "numeric" }).format(new Date(value));
}
