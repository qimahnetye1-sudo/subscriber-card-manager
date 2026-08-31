import { Alert, Linking, Share } from "react-native";
import * as Clipboard from "expo-clipboard";
import * as SMS from "expo-sms";

import { DEFAULT_CARD_MESSAGE_TEMPLATE } from "./types";
import { renderCardMessage, type CardMessageValues } from "./message-template";

export { renderCardMessage } from "./message-template";
export type { CardMessageValues } from "./message-template";

export function cardMessage(code: string, template = DEFAULT_CARD_MESSAGE_TEMPLATE, values?: Omit<CardMessageValues, "card">) { return renderCardMessage(template, { card: code, ...values }); }
export async function copyCardCode(code: string, template = DEFAULT_CARD_MESSAGE_TEMPLATE, values?: Omit<CardMessageValues, "card">) { await Clipboard.setStringAsync(cardMessage(code, template, values)); Alert.alert("تم النسخ", "تم نسخ رسالة البطاقة إلى الحافظة."); }
export async function sendCardSms(phone: string, code: string, template = DEFAULT_CARD_MESSAGE_TEMPLATE, values?: Omit<CardMessageValues, "card">) { const available = await SMS.isAvailableAsync(); if (!available) return Alert.alert("الرسائل غير متاحة", "لا تتوفر خدمة الرسائل النصية على هذا الجهاز."); await SMS.sendSMSAsync(phone, cardMessage(code, template, values)); }
export async function shareCardViaWhatsApp(code: string, template = DEFAULT_CARD_MESSAGE_TEMPLATE, values?: Omit<CardMessageValues, "card">) { const message = encodeURIComponent(cardMessage(code, template, values)); const nativeUrl = `whatsapp://send?text=${message}`; try { const supported = await Linking.canOpenURL(nativeUrl); await Linking.openURL(supported ? nativeUrl : `https://wa.me/?text=${message}`); } catch { await Share.share({ message: cardMessage(code, template, values), title: "مشاركة رمز البطاقة" }); } }
export async function shareCardWithSystem(code: string, template = DEFAULT_CARD_MESSAGE_TEMPLATE, values?: Omit<CardMessageValues, "card">) { await Share.share({ message: cardMessage(code, template, values), title: "مشاركة رمز البطاقة" }); }
