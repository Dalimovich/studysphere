// Security event logger. Writes to the security_events table via service-role key.
// Fails silently — logging must never break the main request flow.

import { supaRequest } from './supabase-admin';

export async function logSecurityEvent(
  serviceKey: string,
  userId: string | null | undefined,
  eventType: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    await supaRequest(
      'POST',
      'security_events',
      {
        user_id: userId || null,
        event_type: eventType,
        metadata: metadata || {},
        created_at: new Date().toISOString()
      },
      serviceKey,
      { Prefer: 'return=minimal' }
    );
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[Security Logger Error]:', msg);
  }
}
