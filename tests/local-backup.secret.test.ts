import { describe, expect, it } from "vitest";
import { makeBackupEnvelope, validateBackupPayload } from "../lib/cards/backup-validation";
import { DEFAULT_CARD_MESSAGE_TEMPLATE, DEFAULT_REPORT_TITLE, DEFAULT_SEND_SECTIONS } from "../lib/cards/types";

describe("إعداد النسخ الاحتياطي المحلي", () => {
  it("يتحقق من النسخة المحلية والإعدادات الجديدة دون خدمة خارجية", () => {
    const data = { subscribers: [], packages: [], cards: [], auditLogs: [], settings: { profileImageUri: null, cardMessageTemplate: DEFAULT_CARD_MESSAGE_TEMPLATE, reportTitle: DEFAULT_REPORT_TITLE, sendSections: DEFAULT_SEND_SECTIONS } };
    const result = validateBackupPayload(makeBackupEnvelope(data));
    expect(result.ok).toBe(true);
  });
});
