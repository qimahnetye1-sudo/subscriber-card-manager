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

export type CardData = {
  subscribers: Subscriber[];
  packages: Package[];
  cards: Card[];
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
};
