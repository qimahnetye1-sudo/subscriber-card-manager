import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

import type { CardData } from "./types";
import { makeBackupEnvelope, validateBackupPayload } from "./backup-validation";

export { BACKUP_VERSION, makeBackupEnvelope, validateBackupPayload } from "./backup-validation";

export const BACKUP_DIRECTORY_NAME = "backups";

export async function getBackupDirectoryUri() {
  const directory = `${FileSystem.documentDirectory}${BACKUP_DIRECTORY_NAME}/`;
  const info = await FileSystem.getInfoAsync(directory);
  if (!info.exists) await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
  return directory;
}

export async function createAndShareBackup(data: CardData) {
  const directory = await getBackupDirectoryUri();
  const uri = `${directory}subscriber-card-manager-backup-${Date.now()}.json`;
  await FileSystem.writeAsStringAsync(uri, JSON.stringify(makeBackupEnvelope(data), null, 2), { encoding: FileSystem.EncodingType.UTF8 });
  if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: "application/json", dialogTitle: "حفظ النسخة الاحتياطية" });
  return uri;
}

export async function listLocalBackups() {
  const directory = await getBackupDirectoryUri();
  const names = await FileSystem.readDirectoryAsync(directory);
  return names.filter((name) => name.endsWith(".json")).map((name) => `${directory}${name}`);
}

export async function pickAndReadBackup() {
  const result = await DocumentPicker.getDocumentAsync({ type: "application/json", copyToCacheDirectory: true });
  if (result.canceled || !result.assets?.[0]) return { ok: false as const, canceled: true as const };
  const content = await FileSystem.readAsStringAsync(result.assets[0].uri, { encoding: FileSystem.EncodingType.UTF8 });
  let parsed: unknown;
  try { parsed = JSON.parse(content); } catch { return { ok: false as const, canceled: false as const, message: "تعذر قراءة الملف لأنه ليس JSON صالحًا." }; }
  const validation = validateBackupPayload(parsed);
  return validation.ok ? { ok: true as const, data: validation.data, fileName: result.assets[0].name } : { ok: false as const, canceled: false as const, message: validation.message };
}
