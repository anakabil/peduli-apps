import { db } from "./db";
import { DEFAULT_SETTINGS, type AppSettings } from "./constants";

const KEY = "alur";

export async function getSettings(): Promise<AppSettings> {
  const row = await db.setting.findUnique({ where: { key: KEY } });
  if (!row) return DEFAULT_SETTINGS;
  try {
    const parsed = JSON.parse(row.value) as Partial<AppSettings>;
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      verificationRequired: true,
      points: { ...DEFAULT_SETTINGS.points, ...(parsed.points ?? {}) },
      levels: { ...DEFAULT_SETTINGS.levels, ...(parsed.levels ?? {}) },
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(value: AppSettings, updatedBy?: string) {
  await db.setting.upsert({
    where: { key: KEY },
    create: { key: KEY, value: JSON.stringify(value), updatedBy },
    update: { value: JSON.stringify(value), updatedBy },
  });
}
