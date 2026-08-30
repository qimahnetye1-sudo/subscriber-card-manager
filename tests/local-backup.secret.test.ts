import { describe, expect, it } from "vitest";

describe("إعداد النسخ الاحتياطي المحلي", () => {
  it("يقبل إعداد الميزة عند فحص نقطة الخدمة المحلية", async () => {
    const response = await fetch("http://127.0.0.1:3000/health", {
      headers: { "x-local-backup-feature": process.env.LOCAL_BACKUP_FEATURE ?? "" },
    });
    expect(process.env.LOCAL_BACKUP_FEATURE).toBe("enabled");
    expect(response.status).toBeLessThan(500);
  });
});
