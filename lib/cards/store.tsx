import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { allocationBlockReason, getReportStats, monthlyAllocationCount, normalizePhone, parseCardCodes } from "./utils";
import { DEFAULT_CARD_MESSAGE_TEMPLATE } from "./types";
import type { AppSettings, AuditLog, CardData, PackageDraft, SubscriberDraft } from "./types";

const STORAGE_KEY = "subscriber-card-manager-data-v1";
const INITIAL_DATA: CardData = { subscribers: [], packages: [], cards: [], auditLogs: [], settings: { profileImageUri: null, cardMessageTemplate: DEFAULT_CARD_MESSAGE_TEMPLATE } };

type OperationResult = { ok: true; message: string } | { ok: false; message: string };

type CardsContextValue = CardData & {
  isReady: boolean;
  stats: ReturnType<typeof getReportStats>;
  addSubscriber: (draft: SubscriberDraft, existingId?: string) => OperationResult;
  addPackage: (draft: PackageDraft, existingId?: string) => OperationResult;
  addCodes: (packageId: string, rawCodes: string) => OperationResult;
  allocateCard: (subscriberId: string, cardId: string) => OperationResult;
  getMonthlyCount: (subscriberId: string) => number;
  replaceData: (nextData: CardData) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
};

const CardsContext = createContext<CardsContextValue | null>(null);

function createId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function CardsProvider({ children }: PropsWithChildren) {
  const [data, setData] = useState<CardData>(INITIAL_DATA);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (stored) {
          const parsed = JSON.parse(stored) as Partial<CardData>;
          setData({ subscribers: parsed.subscribers ?? [], packages: parsed.packages ?? [], cards: parsed.cards ?? [], auditLogs: parsed.auditLogs ?? [], settings: { ...INITIAL_DATA.settings, ...(parsed.settings ?? {}) } });
        }
      })
      .finally(() => setIsReady(true));
  }, []);

  useEffect(() => {
    if (isReady) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data, isReady]);

  const addSubscriber = useCallback((draft: SubscriberDraft, existingId?: string): OperationResult => {
    const name = draft.name.trim();
    const phone = normalizePhone(draft.phone);
    if (!name) return { ok: false, message: "اسم المشترك مطلوب." };
    if (!phone) return { ok: false, message: "رقم الهاتف مطلوب." };
    if (!/^\+?\d{7,15}$/.test(phone)) return { ok: false, message: "أدخل رقم هاتف صالحًا." };
    if (data.subscribers.some((item) => normalizePhone(item.phone) === phone && item.id !== existingId)) return { ok: false, message: "رقم الهاتف مسجل لمشترك آخر." };

    setData((current) => {
      if (existingId) return { ...current, subscribers: current.subscribers.map((item) => item.id === existingId ? { ...item, ...draft, name, phone } : item) };
      return { ...current, subscribers: [{ id: createId("sub"), name, phone, location: draft.location.trim(), notes: draft.notes.trim(), monthlyCount: 0, createdAt: new Date().toISOString() }, ...current.subscribers] };
    });
    return { ok: true, message: existingId ? "تم تعديل بيانات المشترك." : "تمت إضافة المشترك." };
  }, [data.subscribers]);

  const addPackage = useCallback((draft: PackageDraft, existingId?: string): OperationResult => {
    const name = draft.name.trim();
    if (!name) return { ok: false, message: "اسم الباقة مطلوب." };
    if (!(draft.price > 0) || !(draft.sizeGb > 0)) return { ok: false, message: "أدخل سعراً وحجماً أكبر من صفر." };
    setData((current) => existingId ? { ...current, packages: current.packages.map((item) => item.id === existingId ? { ...item, ...draft, name } : item) } : { ...current, packages: [{ id: createId("pkg"), name, price: draft.price, sizeGb: draft.sizeGb, createdAt: new Date().toISOString() }, ...current.packages] });
    return { ok: true, message: existingId ? "تم تعديل الباقة." : "تم إنشاء الباقة." };
  }, []);

  const addCodes = useCallback((packageId: string, rawCodes: string): OperationResult => {
    if (!data.packages.some((item) => item.id === packageId)) return { ok: false, message: "اختر باقة صالحة أولاً." };
    const parsed = parseCardCodes(rawCodes);
    const existingCodes = new Set(data.cards.map((card) => card.code));
    const insertable = parsed.codes.filter((code) => !existingCodes.has(code));
    if (!insertable.length) return { ok: false, message: "لم تُعثر على رموز رقمية جديدة لإضافتها." };
    setData((current) => ({ ...current, cards: [...current.cards, ...insertable.map((code) => ({ id: createId("card"), code, packageId, subscriberId: null, isFrozen: false, sentAt: null }))] }));
    const ignored = parsed.invalidCount + parsed.duplicateCount + (parsed.codes.length - insertable.length);
    return { ok: true, message: `تمت إضافة ${insertable.length} بطاقة${ignored ? `، وتجاهل ${ignored} سطر` : ""}.` };
  }, [data.cards, data.packages]);

  const allocateCard = useCallback((subscriberId: string, cardId: string): OperationResult => {
    const subscriber = data.subscribers.find((item) => item.id === subscriberId);
    const card = data.cards.find((item) => item.id === cardId);
    if (!subscriber || !card) return { ok: false, message: "تعذر العثور على المشترك أو البطاقة." };
    const blocked = allocationBlockReason(card, data.cards, subscriberId);
    if (blocked) return { ok: false, message: blocked };
    const currentMonth = monthlyAllocationCount(data.cards, subscriberId);
    const now = new Date().toISOString();
    const packageItem = data.packages.find((item) => item.id === card.packageId);
    if (!packageItem) return { ok: false, message: "تعذر العثور على الباقة الخاصة بالبطاقة." };
    const auditLog: AuditLog = {
      id: createId("audit"), action: "allocation", createdAt: now, cardId: card.id, packageId: packageItem.id, subscriberId,
      codeSnapshot: card.code, subscriberName: subscriber.name, subscriberPhone: subscriber.phone, subscriberLocation: subscriber.location,
      subscriberNotes: subscriber.notes, packageName: packageItem.name, packageSizeGb: packageItem.sizeGb, packagePrice: packageItem.price,
    };
    setData((current) => ({ ...current, cards: current.cards.map((item) => item.id === cardId ? { ...item, subscriberId, isFrozen: true, sentAt: now } : item), subscribers: current.subscribers.map((item) => item.id === subscriberId ? { ...item, monthlyCount: currentMonth + 1 } : item), auditLogs: [auditLog, ...current.auditLogs] }));
    return { ok: true, message: "تم تخصيص البطاقة وتجميدها بنجاح." };
  }, [data.cards, data.packages, data.subscribers]);

  const getMonthlyCount = useCallback((subscriberId: string) => monthlyAllocationCount(data.cards, subscriberId), [data.cards]);
  const replaceData = useCallback((nextData: CardData) => setData({ subscribers: nextData.subscribers, packages: nextData.packages, cards: nextData.cards, auditLogs: nextData.auditLogs, settings: { ...INITIAL_DATA.settings, ...(nextData.settings ?? {}) } }), []);
  const updateSettings = useCallback((nextSettings: Partial<AppSettings>) => setData((current) => ({ ...current, settings: { ...current.settings, ...nextSettings } })), []);
  const stats = useMemo(() => getReportStats(data.subscribers, data.packages, data.cards), [data]);
  const value = useMemo(() => ({ ...data, isReady, stats, addSubscriber, addPackage, addCodes, allocateCard, getMonthlyCount, replaceData, updateSettings }), [data, isReady, stats, addSubscriber, addPackage, addCodes, allocateCard, getMonthlyCount, replaceData, updateSettings]);
  return <CardsContext.Provider value={value}>{children}</CardsContext.Provider>;
}

export function useCards() {
  const context = useContext(CardsContext);
  if (!context) throw new Error("useCards must be used within CardsProvider");
  return context;
}
