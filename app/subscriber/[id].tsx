import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, FlatList, Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { LoadingState } from "@/components/cards/loading-state";
import { ScreenContainer } from "@/components/screen-container";
import { copyCardCode, sendCardSms, shareCardViaWhatsApp, shareCardWithSystem } from "@/lib/cards/native-actions";
import { useCards } from "@/lib/cards/store";
import { availableCardsForPackage, formatDate } from "@/lib/cards/utils";

export default function SubscriberDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { subscribers, packages, cards, settings, getMonthlyCount, allocateCard, isReady } = useCards();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [allocatedCode, setAllocatedCode] = useState<string | null>(null);
  const [allocatedContext, setAllocatedContext] = useState<{ category: string } | null>(null);
  const subscriber = subscribers.find((item) => item.id === id);
  const available = useMemo(
    () => packages.flatMap((item) => availableCardsForPackage(cards, item.id).map((card) => ({ ...card, packageName: item.name, sizeGb: item.sizeGb }))),
    [packages, cards],
  );

  if (!isReady) return <LoadingState />;
  if (!subscriber) return <ScreenContainer className="items-center justify-center px-4"><Text className="text-muted">لم يتم العثور على المشترك.</Text><Pressable onPress={() => router.back()} style={styles.back}><Text style={styles.backText}>عودة</Text></Pressable></ScreenContainer>;

  const monthlyCount = getMonthlyCount(subscriber.id);
  const subscriberCards = cards.filter((card) => card.subscriberId === subscriber.id);
  const allocate = (cardId: string) => {
    const card = available.find((item) => item.id === cardId);
    const result = allocateCard(subscriber.id, cardId);
    if (!result.ok) return Alert.alert("لا يمكن التخصيص", result.message);
    setPickerOpen(false);
    setAllocatedCode(card?.code ?? null);
    setAllocatedContext(card ? { category: card.packageName } : null);
  };

  return (
    <ScreenContainer className="px-4" containerClassName="bg-background">
      <FlatList
        data={subscriberCards}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={<>
          <Pressable onPress={() => router.back()} style={styles.back}><Text style={styles.backText}>← عودة</Text></Pressable>
          <View style={styles.hero}>
            <Text style={styles.name}>{subscriber.name}</Text>
            <Text style={styles.phone}>{subscriber.phone}</Text>
            <Text style={styles.place}>{subscriber.location || "بدون موقع"}</Text>
            <View style={styles.limit}><Text style={styles.limitText}>{monthlyCount} من 3 بطاقات خلال الشهر</Text></View>
          </View>
          <Pressable disabled={monthlyCount >= 3 || !available.length} onPress={() => setPickerOpen(true)} style={({ pressed }) => [styles.allocate, (monthlyCount >= 3 || !available.length) && styles.disabled, pressed && styles.pressed]}>
            <Text style={styles.allocateText}>{monthlyCount >= 3 ? "بلغ الحد الشهري" : available.length ? "تخصيص بطاقة من المخزون" : "لا توجد بطاقات متاحة"}</Text>
          </Pressable>
          <Text style={styles.section}>البطاقات المخصصة</Text>
        </>}
        ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyText}>لم يستلم هذا المشترك أي بطاقة بعد.</Text></View>}
        renderItem={({ item }) => <View style={styles.cardRow}><View><Text style={styles.code}>{item.code}</Text><Text style={styles.date}>أرسلت في {formatDate(item.sentAt)}</Text></View><Text style={styles.frozen}>مجمدة</Text></View>}
      />
      <Modal visible={pickerOpen} transparent animationType="slide" onRequestClose={() => setPickerOpen(false)}>
        <View style={styles.backdrop}><View style={styles.sheet}>
          <Text style={styles.sheetTitle}>اختر بطاقة متاحة</Text><Text style={styles.helper}>سيتم تجميد البطاقة بعد التخصيص ولا يمكن استخدامها لمشترك آخر.</Text>
          <FlatList data={available} keyExtractor={(item) => item.id} style={{ maxHeight: 360 }} renderItem={({ item }) => <Pressable onPress={() => allocate(item.id)} style={({ pressed }) => [styles.choice, pressed && styles.pressed]}><View><Text style={styles.choiceCode}>{item.code}</Text><Text style={styles.choiceMeta}>{item.packageName} • {item.sizeGb} GB</Text></View><Text style={styles.choiceAction}>تخصيص</Text></Pressable>} ListEmptyComponent={<Text style={styles.emptyText}>لا توجد بطاقات متاحة.</Text>} />
          <Pressable onPress={() => setPickerOpen(false)} style={styles.close}><Text style={styles.closeText}>إلغاء</Text></Pressable>
        </View></View>
      </Modal>
      <Modal visible={!!allocatedCode} transparent animationType="fade" onRequestClose={() => setAllocatedCode(null)}>
        <View style={styles.centerBackdrop}><View style={styles.successSheet}>
          <Text style={styles.successTitle}>تم تخصيص البطاقة</Text><Text style={styles.successCode}>{allocatedCode}</Text><Text style={styles.successText}>اختر طريقة إرسال الرمز الآن. بعد إغلاق هذه النافذة تبقى البطاقة مجمدة ولا يمكن تخصيصها مجددًا.</Text>
          <View style={styles.shareGrid}><Pressable onPress={() => allocatedCode && sendCardSms(subscriber.phone, allocatedCode, settings.cardMessageTemplate, allocatedContext ?? undefined)} style={styles.share}><Text style={styles.shareText}>SMS</Text></Pressable><Pressable onPress={() => allocatedCode && shareCardViaWhatsApp(allocatedCode, settings.cardMessageTemplate, allocatedContext ?? undefined)} style={styles.share}><Text style={styles.shareText}>WhatsApp</Text></Pressable><Pressable onPress={() => allocatedCode && copyCardCode(allocatedCode, settings.cardMessageTemplate, allocatedContext ?? undefined)} style={styles.share}><Text style={styles.shareText}>نسخ</Text></Pressable></View>
          <Pressable onPress={() => allocatedCode && shareCardWithSystem(allocatedCode, settings.cardMessageTemplate, allocatedContext ?? undefined)} style={styles.systemShare}><Text style={styles.systemShareText}>مشاركة عبر تطبيق آخر</Text></Pressable><Pressable onPress={() => { setAllocatedCode(null); setAllocatedContext(null); }} style={styles.done}><Text style={styles.doneText}>تم</Text></Pressable>
        </View></View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 20, paddingBottom: 28 }, back: { alignSelf: "flex-end", paddingVertical: 8 }, backText: { color: "#087E8B", fontWeight: "700" }, hero: { backgroundColor: "#FFFFFF", borderRadius: 18, padding: 18, alignItems: "flex-end", borderWidth: 1, borderColor: "#D8E2E8", marginTop: 6 }, name: { color: "#16202A", fontSize: 25, fontWeight: "800" }, phone: { color: "#637381", marginTop: 5 }, place: { color: "#637381", marginTop: 4, fontSize: 12 }, limit: { marginTop: 14, backgroundColor: "#E6F5F4", paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999 }, limitText: { color: "#087E8B", fontWeight: "700", fontSize: 12 }, allocate: { marginTop: 12, backgroundColor: "#0E2A47", borderRadius: 14, padding: 15, alignItems: "center" }, disabled: { backgroundColor: "#99A6AE" }, allocateText: { color: "#FFFFFF", fontWeight: "800" }, section: { color: "#16202A", fontSize: 17, fontWeight: "800", textAlign: "right", marginTop: 22, marginBottom: 8 }, empty: { backgroundColor: "#FFFFFF", padding: 18, borderRadius: 14 }, emptyText: { color: "#637381", textAlign: "right" }, cardRow: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center", backgroundColor: "#FFFFFF", padding: 15, borderRadius: 14, marginBottom: 8, borderWidth: 1, borderColor: "#D8E2E8" }, code: { color: "#0E2A47", fontFamily: "monospace", fontWeight: "800", fontSize: 16, textAlign: "right" }, date: { color: "#637381", marginTop: 5, fontSize: 11 }, frozen: { color: "#B93838", backgroundColor: "#FCECEC", padding: 6, borderRadius: 999, fontSize: 11 }, pressed: { opacity: 0.72, transform: [{ scale: 0.98 }] }, backdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(14,42,71,0.34)" }, centerBackdrop: { flex: 1, justifyContent: "center", padding: 24, backgroundColor: "rgba(14,42,71,0.34)" }, sheet: { backgroundColor: "#F6F1E9", padding: 20, borderTopLeftRadius: 24, borderTopRightRadius: 24 }, sheetTitle: { color: "#16202A", textAlign: "right", fontSize: 22, fontWeight: "800" }, helper: { color: "#637381", textAlign: "right", lineHeight: 20, marginVertical: 9, fontSize: 12 }, choice: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center", backgroundColor: "#FFFFFF", borderRadius: 12, padding: 13, marginBottom: 8, borderWidth: 1, borderColor: "#D8E2E8" }, choiceCode: { color: "#0E2A47", fontFamily: "monospace", fontWeight: "800", textAlign: "right" }, choiceMeta: { color: "#637381", fontSize: 11, marginTop: 3, textAlign: "right" }, choiceAction: { color: "#087E8B", fontWeight: "800" }, close: { padding: 14, alignItems: "center", backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#D8E2E8", borderRadius: 12, marginTop: 10 }, closeText: { color: "#0E2A47", fontWeight: "800" }, successSheet: { backgroundColor: "#FFFFFF", borderRadius: 22, padding: 20, alignItems: "center" }, successTitle: { color: "#087E8B", fontWeight: "800", fontSize: 21 }, successCode: { color: "#0E2A47", fontFamily: "monospace", fontWeight: "800", fontSize: 26, marginVertical: 12 }, successText: { color: "#637381", textAlign: "center", lineHeight: 20, fontSize: 12 }, shareGrid: { flexDirection: "row", gap: 8, marginTop: 16 }, share: { flex: 1, paddingVertical: 11, backgroundColor: "#E6F5F4", borderRadius: 10, alignItems: "center" }, shareText: { color: "#087E8B", fontWeight: "800", fontSize: 12 }, systemShare: { alignSelf: "stretch", backgroundColor: "#F6F1E9", borderRadius: 10, padding: 12, alignItems: "center", marginTop: 9 }, systemShareText: { color: "#0E2A47", fontWeight: "700" }, done: { alignSelf: "stretch", backgroundColor: "#0E2A47", borderRadius: 10, padding: 13, alignItems: "center", marginTop: 9 }, doneText: { color: "#FFFFFF", fontWeight: "800" },
});
