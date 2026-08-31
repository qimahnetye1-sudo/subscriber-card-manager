import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Platform, StyleSheet, Text, View } from "react-native";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

export default function TabLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === "web" ? 12 : Math.max(insets.bottom, 8);
  const tabBarHeight = 58 + bottomPadding;

  return <Tabs screenOptions={{ headerShown: false, tabBarButton: HapticTab, tabBarActiveTintColor: colors.tint, tabBarStyle: { paddingTop: 7, paddingBottom: bottomPadding, height: tabBarHeight, backgroundColor: colors.background, borderTopColor: colors.border, borderTopWidth: 0.5 }, tabBarLabelStyle: styles.label }}>
    <Tabs.Screen name="index" options={{ title: "الرئيسية", tabBarIcon: ({ color }) => <IconSymbol size={25} name="house.fill" color={color} /> }} />
    <Tabs.Screen name="reports" options={{ title: "التقارير", tabBarIcon: ({ color }) => <IconSymbol size={25} name="chart.bar.fill" color={color} /> }} />
    <Tabs.Screen name="send" options={{ title: "إرسال", tabBarActiveTintColor: "#FFFFFF", tabBarItemStyle: styles.sendItem, tabBarLabelStyle: styles.sendLabel, tabBarIcon: ({ color }) => <View style={styles.sendIcon}><IconSymbol size={31} name="paperplane.fill" color={color} /><Text style={styles.plus}>+</Text></View> }} />
    <Tabs.Screen name="settings" options={{ title: "الإعدادات", tabBarIcon: ({ color }) => <IconSymbol size={25} name="gearshape.fill" color={color} /> }} />
    <Tabs.Screen name="subscribers" options={{ href: null }} />
    <Tabs.Screen name="packages" options={{ href: null }} />
    <Tabs.Screen name="audit" options={{ href: null }} />
  </Tabs>;
}

const styles = StyleSheet.create({ label: { fontSize: 11, fontWeight: "700" }, sendItem: { backgroundColor: "#0E2A47", borderRadius: 18, marginTop: -14, marginBottom: 4, marginHorizontal: 8, height: 70, paddingTop: 3 }, sendLabel: { color: "#FFFFFF", fontSize: 12, fontWeight: "800" }, sendIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", position: "relative" }, plus: { position: "absolute", right: -5, top: -6, width: 18, height: 18, borderRadius: 9, backgroundColor: "#C88719", color: "#FFFFFF", textAlign: "center", lineHeight: 17, fontWeight: "900" } });
