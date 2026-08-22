import { ActivityIndicator, Text, View } from "react-native";
export function LoadingState() { return <View className="flex-1 items-center justify-center gap-3 bg-background"><ActivityIndicator size="large" color="#087E8B" /><Text className="text-muted">جارٍ تجهيز بياناتك…</Text></View>; }
