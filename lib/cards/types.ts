export type Subscriber = {
  id: string;
  name: string;
  phone: string;
  location: string;
  notes: string;
  monthlyCount: number;
  createdAt: string;
};

export type Package = {
  id: string;
  name: string;
  price: number;
  sizeGb: number;
  createdAt: string;
};

export type Card = {
  id: string;
  code: string;
  packageId: string;
  subscriberId: string | null;
  isFrozen: boolean;
  sentAt: string | null;
};

export type AuditLog = {
  id: string;
  action: "allocation";
  createdAt: string;
  cardId: string;
  packageId: string;
  subscriberId: string;
  codeSnapshot: string;
  subscriberName: string;
  subscriberPhone: string;
  subscriberLocation: string;
  subscriberNotes: string;
  packageName: string;
  packageSizeGb: number;
  packagePrice: number;
};

export type DateRange = {
  from: string;
  to: string;
};

export type AppSettings = {
  profileImageUri: string | null;
  cardMessageTemplate: string;
};

export const DEFAULT_CARD_MESSAGE_TEMPLATE = "مرحباً! كرتك: {card} | فئة: {category} | شبكة: {network} - {wallet}";

export type CardData = {
  subscribers: Subscriber[];
  packages: Package[];
  cards: Card[];
  auditLogs: AuditLog[];
  settings: AppSettings;
};

export type SubscriberDraft = Omit<Subscriber, "id" | "monthlyCount" | "createdAt">;
export type PackageDraft = Omit<Package, "id" | "createdAt">;

export type ReportStats = {
  totalSubscribers: number;
  totalPackages: number;
  totalCards: number;
  allocatedCards: number;
  availableCards: number;
  totalRevenue: number;
  averagePackagePrice: number;
  monthlyAllocated: number;
  usedGb: number;
  monthlyUsedGb: number;
};
