import { Text, View } from "react-native";
export function ScreenHeader({ title, subtitle }: { title: string; subtitle?: string }) { return <View className="mb-5"><Text className="text-right text-3xl font-bold text-foreground">{title}</Text>{subtitle ? <Text className="mt-1 text-right text-sm text-muted">{subtitle}</Text> : null}</View>; }
