import { db } from "./db";

export async function notify(userIds: Array<string | null | undefined>, title: string, body?: string, link?: string) {
  const ids = Array.from(new Set(userIds.filter((x): x is string => !!x)));
  if (!ids.length) return;
  await db.notification.createMany({ data: ids.map((userId) => ({ userId, title, body, link })) });
}

export async function audit(actorId: string | null, action: string, entity?: string, entityId?: string, detail?: unknown) {
  await db.auditLog.create({
    data: { actorId, action, entity, entityId, detail: detail === undefined ? null : JSON.stringify(detail) },
  });
}
