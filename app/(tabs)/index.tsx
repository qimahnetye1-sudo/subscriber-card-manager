import { useRouter } from "expo-router";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { MetricCard } from "@/components/cards/metric-card";
import { ScreenHeader } from "@/components/cards/screen-header";
import { LoadingState } from "@/components/cards/loading-state";
import { ScreenContainer } from "@/components/screen-container";
import { useCards } from "@/lib/cards/store";
import { formatCurrency } from "@/lib/cards/utils";

export default function HomeScreen() {
  const router = useRouter();
  const { subscribers, stats, cards, getMonthlyCount, isReady } = useCards();
  if (!isReady) return <LoadingState />;

  return <ScreenContainer className="px-4" containerClassName="bg-background"><FlatList
    data={subscribers}
    keyExtractor={(item) => item.id}
    showsVerticalScrollIndicator={false}
    contentContainerStyle={styles.content}
    ListHeaderComponent={<>
      <ScreenHeader title="مركز العمليات" subtitle="إدارة المشتركين والبطاقات من شاشة واحدة" />
      <View style={styles.metrics}><MetricCard label="بطاقات متاحة" value={stats.availableCards} /><MetricCard label="تخصيصات الشهر" value={stats.monthlyAllocated} tone="navy" /></View>
      <View style={styles.metrics}><MetricCard label="إجمالي المشتركين" value={stats.totalSubscribers} tone="sand" /><MetricCard label="إيراد البطاقات" value={formatCurrency(stats.totalRevenue)} tone="gold" /></View>
      <View style={styles.quickActions}>
        <Pressable onPress={() => router.push("/(tabs)/subscribers" as never)} style={({ pressed }) => [styles.primaryAction, pressed && styles.pressed]}><Text style={styles.primaryText}>إضافة مشترك</Text></Pressable>
        <Pressable onPress={() => router.push("/(tabs)/packages" as never)} style={({ pressed }) => [styles.secondaryAction, pressed && styles.pressed]}><Text style={styles.secondaryText}>إدارة المخزون</Text></Pressable>
      </View>
      <Text style={styles.sectionTitle}>المشتركون</Text>
    </>}
    ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyTitle}>لا يوجد مشتركون حتى الآن</Text><Text style={styles.emptyText}>ابدأ بإضافة مشترك ثم أنشئ باقة وأدخل رموز بطاقاتها.</Text></View>}
    renderItem={({ item }) => {
      const count = getMonthlyCount(item.id);
      const activeCards = cards.filter((card) => card.subscriberId === item.id).length;
      return <Pressable onPress={() => router.push(`/subscriber/${item.id}` as never)} style={({ pressed }) => [styles.row, pressed && styles.pressed]}><View style={styles.rowTop}><View style={styles.avatar}><Text style={styles.avatarText}>{item.name.slice(0, 1)}</Text></View><View style={styles.rowText}><Text style={styles.name}>{item.name}</Text><Text style={styles.phone}>{item.phone}</Text></View><Text style={[styles.status, count >= 3 && styles.statusLimit]}>{count >= 3 ? "بلغ الحد" : `${3 - count} متبقي`}</Text></View><View style={styles.rowBottom}><Text style={styles.detail}>{activeCards} بطاقة مرسلة</Text><Text style={styles.detail}>{item.location || "بدون موقع"}</Text></View></Pressable>;
    }}
  /></ScreenContainer>;
}

const styles = StyleSheet.create({ content: { paddingTop: 20, paddingBottom: 32 }, metrics: { flexDirection: "row", gap: 10, marginBottom: 10 }, quickActions: { flexDirection: "row", gap: 10, marginVertical: 16 }, primaryAction: { flex: 1, backgroundColor: "#0E2A47", borderRadius: 14, paddingVertical: 14, alignItems: "center" }, secondaryAction: { flex: 1, backgroundColor: "#FFFFFF", borderRadius: 14, paddingVertical: 14, alignItems: "center", borderWidth: 1, borderColor: "#D8E2E8" }, pressed: { opacity: 0.72, transform: [{ scale: 0.98 }] }, primaryText: { color: "#FFFFFF", fontWeight: "700" }, secondaryText: { color: "#0E2A47", fontWeight: "700" }, sectionTitle: { textAlign: "right", color: "#16202A", fontSize: 18, fontWeight: "700", marginBottom: 10 }, empty: { backgroundColor: "#FFFFFF", borderRadius: 18, padding: 22, alignItems: "flex-end", borderWidth: 1, borderColor: "#D8E2E8" }, emptyTitle: { color: "#16202A", fontWeight: "700", fontSize: 16 }, emptyText: { color: "#637381", textAlign: "right", lineHeight: 21, marginTop: 6 }, row: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 14, marginBottom: 9, borderWidth: 1, borderColor: "#D8E2E8" }, rowTop: { flexDirection: "row-reverse", alignItems: "center" }, avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#E2F1F2", justifyContent: "center", alignItems: "center" }, avatarText: { color: "#087E8B", fontWeight: "800", fontSize: 18 }, rowText: { flex: 1, marginHorizontal: 10, alignItems: "flex-end" }, name: { color: "#16202A", fontWeight: "700", fontSize: 15 }, phone: { color: "#637381", marginTop: 2, fontSize: 12 }, status: { color: "#087E8B", backgroundColor: "#E6F5F4", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, fontSize: 11 }, statusLimit: { color: "#B93838", backgroundColor: "#FCECEC" }, rowBottom: { flexDirection: "row-reverse", justifyContent: "space-between", marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: "#EEF2F4" }, detail: { color: "#637381", fontSize: 12 } });
