import type { AuditLog, CardData, Card, Package, Subscriber } from "./types";

export const BACKUP_VERSION = 1;

export type BackupEnvelope = {
  app: "بطاقات المشتركين";
  version: number;
  createdAt: string;
  data: CardData;
};

function isString(value: unknown): value is string { return typeof value === "string"; }
function isFiniteNumber(value: unknown): value is number { return typeof value === "number" && Number.isFinite(value); }
function hasUniqueValues<T>(items: T[], key: (item: T) => string) { const values = items.map(key); return new Set(values).size === values.length; }

function isSubscriber(value: unknown): value is Subscriber { if (!value || typeof value !== "object") return false; const item = value as Subscriber; return isString(item.id) && isString(item.name) && isString(item.phone) && isString(item.location) && isString(item.notes) && isFiniteNumber(item.monthlyCount) && isString(item.createdAt); }
function isPackage(value: unknown): value is Package { if (!value || typeof value !== "object") return false; const item = value as Package; return isString(item.id) && isString(item.name) && isFiniteNumber(item.price) && isFiniteNumber(item.sizeGb) && isString(item.createdAt); }
function isCard(value: unknown): value is Card { if (!value || typeof value !== "object") return false; const item = value as Card; return isString(item.id) && isString(item.code) && isString(item.packageId) && (item.subscriberId === null || isString(item.subscriberId)) && typeof item.isFrozen === "boolean" && (item.sentAt === null || isString(item.sentAt)); }
function isAuditLog(value: unknown): value is AuditLog { if (!value || typeof value !== "object") return false; const item = value as AuditLog; return isString(item.id) && item.action === "allocation" && isString(item.createdAt) && isString(item.cardId) && isString(item.packageId) && isString(item.subscriberId) && isString(item.codeSnapshot) && isString(item.subscriberName) && isString(item.subscriberPhone) && isString(item.subscriberLocation) && isString(item.subscriberNotes) && isString(item.packageName) && isFiniteNumber(item.packageSizeGb) && isFiniteNumber(item.packagePrice); }

export function validateBackupPayload(value: unknown): { ok: true; data: CardData } | { ok: false; message: string } {
  if (!value || typeof value !== "object") return { ok: false, message: "الملف ليس نسخة احتياطية بصيغة صحيحة." };
  const envelope = value as Partial<BackupEnvelope>;
  const data = envelope.data as Partial<CardData> | undefined;
  if (envelope.app !== "بطاقات المشتركين" || envelope.version !== BACKUP_VERSION || !data) return { ok: false, message: "إصدار النسخة الاحتياطية غير مدعوم." };
  if (!Array.isArray(data.subscribers) || !Array.isArray(data.packages) || !Array.isArray(data.cards) || !Array.isArray(data.auditLogs)) return { ok: false, message: "النسخة الاحتياطية ناقصة أو تالفة." };
  if (!data.subscribers.every(isSubscriber) || !data.packages.every(isPackage) || !data.cards.every(isCard) || !data.auditLogs.every(isAuditLog)) return { ok: false, message: "تحتوي النسخة الاحتياطية على بيانات غير صالحة." };
  if (!hasUniqueValues(data.subscribers, (item) => item.id) || !hasUniqueValues(data.packages, (item) => item.id) || !hasUniqueValues(data.cards, (item) => item.id) || !hasUniqueValues(data.cards, (item) => item.code) || !hasUniqueValues(data.auditLogs, (item) => item.id)) return { ok: false, message: "تحتوي النسخة الاحتياطية على معرفات أو رموز مكررة." };
  const subscriberIds = new Set(data.subscribers.map((item) => item.id));
  const packageIds = new Set(data.packages.map((item) => item.id));
  if (data.cards.some((item) => !packageIds.has(item.packageId) || (item.subscriberId !== null && !subscriberIds.has(item.subscriberId)))) return { ok: false, message: "توجد بطاقة مرتبطة ببيانات غير موجودة." };
  if (data.auditLogs.some((item) => !subscriberIds.has(item.subscriberId) || !packageIds.has(item.packageId))) return { ok: false, message: "يوجد سجل تدقيق مرتبط ببيانات غير موجودة." };
  return { ok: true, data: { subscribers: data.subscribers, packages: data.packages, cards: data.cards, auditLogs: data.auditLogs } };
}

export function makeBackupEnvelope(data: CardData): BackupEnvelope { return { app: "بطاقات المشتركين", version: BACKUP_VERSION, createdAt: new Date().toISOString(), data }; }
