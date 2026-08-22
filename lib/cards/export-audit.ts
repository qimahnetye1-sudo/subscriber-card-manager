import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

import type { AuditLog, DateRange } from "./types";
import { dateRangeLabel, formatDate } from "./utils";

function csvCell(value: string | number) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

export async function exportAuditCsv(logs: AuditLog[], range: DateRange) {
  const headers = ["التاريخ", "العملية", "المشترك", "الهاتف", "الموقع", "الملاحظات", "الرمز", "الباقة", "الحجم GB", "السعر"];
  const rows = logs.map((log) => [formatDate(log.createdAt), "تخصيص بطاقة", log.subscriberName, log.subscriberPhone, log.subscriberLocation || "—", log.subscriberNotes || "—", log.codeSnapshot, log.packageName, log.packageSizeGb, log.packagePrice]);
  const content = `\uFEFF${headers.map(csvCell).join(",")}\n${rows.map((row) => row.map(csvCell).join(",")).join("\n")}`;
  const uri = `${FileSystem.cacheDirectory}audit-log-${Date.now()}.csv`;
  await FileSystem.writeAsStringAsync(uri, content, { encoding: FileSystem.EncodingType.UTF8 });
  if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: "text/csv", dialogTitle: `تصدير سجل التدقيق: ${dateRangeLabel(range)}` });
  return uri;
}
