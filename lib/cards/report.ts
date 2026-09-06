import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system/legacy";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

import type { AuditLog, DateRange, Package } from "./types";
import { dateRangeLabel, formatCurrency, formatDate } from "./utils";

function escapeHtml(value: string) { return value.replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char] ?? char); }
async function getArabicFontBase64() { const asset = Asset.fromModule(require("@/assets/fonts/NotoSansArabic.ttf")); await asset.downloadAsync(); if (!asset.localUri) throw new Error("تعذر تحميل الخط العربي."); return FileSystem.readAsStringAsync(asset.localUri, { encoding: FileSystem.EncodingType.Base64 }); }
async function getProfileImageDataUri(uri: string | null) { if (!uri) return null; try { const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 }); const extension = uri.split(".").pop()?.toLowerCase(); const mime = extension === "png" ? "image/png" : "image/jpeg"; return `data:${mime};base64,${base64}`; } catch { return null; } }

export async function exportArabicReport({ packages, auditLogs, range, profileImageUri, reportTitle }: { packages: Package[]; auditLogs: AuditLog[]; range: DateRange; profileImageUri?: string | null; reportTitle: string }) {
  const fontBase64 = await getArabicFontBase64();
  const profileImage = await getProfileImageDataUri(profileImageUri ?? null);
  const filteredRevenue = auditLogs.reduce((sum, log) => sum + log.packagePrice, 0);
  const filteredUsedGb = auditLogs.reduce((sum, log) => sum + log.packageSizeGb, 0);
  const selectedSubscriberCount = new Set(auditLogs.map((log) => log.subscriberId)).size;
  const selectedCardCount = auditLogs.length;
  const packageMap = new Map(packages.map((item) => [item.id, item]));
  const allocationRows = auditLogs.map((log) => { const currentPackage = packageMap.get(log.packageId); const currentSizeGb = currentPackage?.sizeGb ?? log.packageSizeGb; return `<tr><td>${escapeHtml(log.subscriberName)}</td><td>${escapeHtml(log.subscriberPhone)}</td><td>${escapeHtml(log.subscriberLocation || "—")}</td><td>${escapeHtml(log.subscriberNotes || "—")}</td><td dir="ltr">${escapeHtml(log.codeSnapshot)}</td><td>${currentSizeGb} GB</td><td>${formatDate(log.createdAt)}</td></tr>`; }).join("") || "<tr><td colspan=\"7\">لا توجد عمليات تخصيص ضمن الفترة المختارة.</td></tr>";
  const profileMarkup = profileImage ? `<div class="profile"><img src="${profileImage}" /></div>` : "";
  const html = `<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="utf-8" /><style>@font-face{font-family:NotoArabic;src:url(data:font/ttf;base64,${fontBase64}) format('truetype');}@page{margin:22px;}*{box-sizing:border-box;}body{font-family:NotoArabic,Arial,sans-serif;color:#16202A;direction:rtl;text-align:right;font-size:10px;}h1{font-size:24px;color:#0E2A47;margin:0 0 6px;text-align:center;}.profile{text-align:center;margin:0 0 10px;}.profile img{width:82px;height:82px;border-radius:50%;object-fit:cover;border:3px solid #087E8B;}.sub{color:#51606F;margin-bottom:18px;text-align:center;}.grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin:0 0 18px;}.metric{border:1px solid #D8E2E8;border-right:4px solid #087E8B;border-radius:10px;padding:10px;background:#FAFCFD;}.metric span{display:block;color:#637381;font-size:9px;}.metric strong{font-size:16px;color:#0E2A47;}table{width:100%;border-collapse:collapse;margin-top:10px;font-size:9px;}th{background:#0E2A47;color:#fff;padding:7px;text-align:right;}td{border-bottom:1px solid #DFE7EC;padding:7px;vertical-align:top;}.note{margin:10px 0 16px;padding:10px;background:#F6F1E9;border-radius:8px;color:#48545D;}</style></head><body>${profileMarkup}<h1>${escapeHtml(reportTitle)}</h1><div class="sub">الفترة: ${escapeHtml(dateRangeLabel(range))}<br/>تاريخ الإنشاء: ${formatDate(new Date().toISOString())}</div><section class="grid"><div class="metric"><span>إجمالي المشتركين</span><strong>${selectedSubscriberCount}</strong></div><div class="metric"><span>عدد البطاقات المرسلة</span><strong>${selectedCardCount}</strong></div><div class="metric"><span>الجيجا المستهلكة في الفترة</span><strong>${filteredUsedGb} GB</strong></div><div class="metric"><span>إجمالي المبلغ في الفترة</span><strong>${formatCurrency(filteredRevenue)}</strong></div></section><div class="note">يعرض الجدول التالي سجل التخصيصات ضمن الفترة المختارة، ويشمل موقع المشترك وملاحظاته وتاريخ التخصيص الفعلي كما حُفظت لحظة العملية.</div><h2>سجل التخصيصات</h2><table><thead><tr><th>المشترك</th><th>الهاتف</th><th>الموقع</th><th>الملاحظات</th><th>الرمز</th><th>الباقة</th><th>تاريخ التخصيص</th></tr></thead><tbody>${allocationRows}</tbody></table></body></html>`;
  const { uri } = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: "application/pdf", dialogTitle: "مشاركة التقرير التشغيلي" });
  return uri;
}
