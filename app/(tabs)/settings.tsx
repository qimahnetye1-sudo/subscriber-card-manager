import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { LoadingState } from "@/components/cards/loading-state";
import { ScreenHeader } from "@/components/cards/screen-header";
import { ScreenContainer } from "@/components/screen-container";
import { createAndShareBackup, pickAndReadBackup } from "@/lib/cards/backup";
import { useCards } from "@/lib/cards/store";
import type { CardData } from "@/lib/cards/types";

export default function SettingsScreen() {
  const { subscribers, packages, cards, auditLogs, replaceData, isReady } = useCards();
  const [busy, setBusy] = useState(false);
  if (!isReady) return <LoadingState />;

  const currentData: CardData = { subscribers, packages, cards, auditLogs };
  const exportBackup = async () => {
    setBusy(true);
    try { await createAndShareBackup(currentData); Alert.alert("تم إنشاء النسخة", "يمكنك حفظ ملف JSON في مكان آمن أو إرساله إلى جهاز آخر."); }
    catch { Alert.alert("تعذر إنشاء النسخة", "تعذر تجهيز ملف النسخة الاحتياطية على هذا الجهاز."); }
    finally { setBusy(false); }
  };
  const importBackup = async () => {
    setBusy(true);
    try {
      const result = await pickAndReadBackup();
      if (result.canceled) return;
      if (!result.ok) return Alert.alert("ملف غير صالح", result.message);
      Alert.alert("تأكيد الاستعادة", `سيتم استبدال البيانات الحالية ببيانات الملف «${result.fileName}». لا يمكن التراجع عن هذه العملية.`, [
        { text: "إلغاء", style: "cancel" },
        { text: "استعادة البيانات", style: "destructive", onPress: () => { replaceData(result.data); Alert.alert("تمت الاستعادة", "تم تحميل المشتركين والباقات والبطاقات وسجل التدقيق بنجاح."); } },
      ]);
    } catch { Alert.alert("تعذر الاستعادة", "تعذر قراءة الملف. اختر نسخة JSON صادرة من تطبيق بطاقات المشتركين."); }
    finally { setBusy(false); }
  };

  return <ScreenContainer className="px-4" containerClassName="bg-background"><ScrollView contentContainerStyle={styles.content}><ScreenHeader title="الإعدادات" subtitle="حماية بيانات التطبيق وإدارتها محليًا" /><View style={styles.hero}><Text style={styles.heroTitle}>بياناتك على جهازك</Text><Text style={styles.heroText}>ينشئ التطبيق نسخة JSON تحتوي على المشتركين والباقات والبطاقات وسجل التدقيق. يمكنك حفظها واستعادتها عند تغيير الجهاز أو إعادة التثبيت.</Text></View><View style={styles.card}><Text style={styles.cardTitle}>النسخ الاحتياطي والاستعادة</Text><Text style={styles.cardText}>عدد المشتركين: {subscribers.length} · عدد البطاقات: {cards.length} · سجلات التدقيق: {auditLogs.length}</Text><Pressable disabled={busy} onPress={exportBackup} style={({ pressed }) => [styles.primary, busy && styles.disabled, pressed && styles.pressed]}><Text style={styles.primaryText}>{busy ? "جارٍ تجهيز الملف…" : "إنشاء نسخة احتياطية"}</Text></Pressable><Pressable disabled={busy} onPress={importBackup} style={({ pressed }) => [styles.secondary, busy && styles.disabled, pressed && styles.pressed]}><Text style={styles.secondaryText}>استعادة من ملف JSON</Text></Pressable></View><View style={styles.notice}><Text style={styles.noticeTitle}>قبل الاستعادة</Text><Text style={styles.noticeText}>تحقق من أن الملف حديث وصادر من هذا التطبيق. الاستعادة تستبدل البيانات الحالية بالكامل، وتقبل فقط الملفات ذات البنية والإصدار الصحيحين.</Text></View></ScrollView></ScreenContainer>;
}

const styles = StyleSheet.create({ content: { paddingTop: 20, paddingBottom: 32 }, hero: { backgroundColor: "#0E2A47", borderRadius: 18, padding: 18, alignItems: "flex-end" }, heroTitle: { color: "#FFFFFF", fontSize: 20, fontWeight: "800", textAlign: "right" }, heroText: { color: "#C8E5E7", lineHeight: 21, textAlign: "right", marginTop: 8, fontSize: 12 }, card: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#D8E2E8", borderRadius: 18, padding: 16, marginTop: 14, alignItems: "flex-end" }, cardTitle: { color: "#16202A", fontSize: 18, fontWeight: "800", textAlign: "right" }, cardText: { color: "#637381", fontSize: 12, textAlign: "right", marginTop: 8, alignSelf: "stretch" }, primary: { alignSelf: "stretch", backgroundColor: "#0E2A47", borderRadius: 12, padding: 14, alignItems: "center", marginTop: 16 }, primaryText: { color: "#FFFFFF", fontWeight: "800" }, secondary: { alignSelf: "stretch", backgroundColor: "#EAF5F4", borderRadius: 12, padding: 14, alignItems: "center", marginTop: 9 }, secondaryText: { color: "#087E8B", fontWeight: "800" }, disabled: { opacity: 0.5 }, pressed: { opacity: 0.72, transform: [{ scale: 0.98 }] }, notice: { backgroundColor: "#FFF7E8", borderWidth: 1, borderColor: "#F0D9A3", borderRadius: 16, padding: 15, marginTop: 14, alignItems: "flex-end" }, noticeTitle: { color: "#9A6714", fontWeight: "800", textAlign: "right" }, noticeText: { color: "#87652A", lineHeight: 20, fontSize: 12, textAlign: "right", marginTop: 6 } });
