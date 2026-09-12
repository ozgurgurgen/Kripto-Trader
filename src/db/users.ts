import { db } from './index.ts';
import { users } from './schema.ts';
import { eq } from 'drizzle-orm';

export async function getOrCreateUser(uid: string, email: string, displayName?: string) {
  try {
    const result = await db.insert(users)
      .values({
        uid,
        email,
        displayName: displayName || email.split('@')[0],
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email,
          displayName: displayName || email.split('@')[0],
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error("Error in getOrCreateUser:", error);
    // Fallback search
    try {
      const existing = await db.select().from(users).where(eq(users.uid, uid));
      if (existing.length > 0) return existing[0];
    } catch {}
    throw new Error("Kullanıcı veritabanına kaydedilemedi.", { cause: error });
  }
}
