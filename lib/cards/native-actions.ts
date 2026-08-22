import { Alert, Linking, Platform, Share } from "react-native";
import * as Clipboard from "expo-clipboard";
import * as SMS from "expo-sms";

export function cardMessage(code: string) { return `رمز بطاقة البيانات: ${code}`; }
export async function copyCardCode(code: string) { await Clipboard.setStringAsync(cardMessage(code)); Alert.alert("تم النسخ", "تم نسخ رمز البطاقة إلى الحافظة."); }
export async function sendCardSms(phone: string, code: string) { const available = await SMS.isAvailableAsync(); if (!available) return Alert.alert("الرسائل غير متاحة", "لا تتوفر خدمة الرسائل النصية على هذا الجهاز."); await SMS.sendSMSAsync(phone, cardMessage(code)); }
export async function shareCardViaWhatsApp(code: string) { const message = encodeURIComponent(cardMessage(code)); const nativeUrl = `whatsapp://send?text=${message}`; try { const supported = await Linking.canOpenURL(nativeUrl); await Linking.openURL(supported ? nativeUrl : `https://wa.me/?text=${message}`); } catch { await Share.share({ message: cardMessage(code), title: "مشاركة رمز البطاقة" }); } }
export async function shareCardWithSystem(code: string) { await Share.share({ message: cardMessage(code), title: Platform.OS === "web" ? "مشاركة الرمز" : "مشاركة رمز البطاقة" }); }
