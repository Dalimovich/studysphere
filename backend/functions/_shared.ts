export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error('Missing required environment variable: ' + name);
  return value;
}

export function getAllowedOrigin(): string {
  return requireEnv('ALLOWED_ORIGIN');
}

export function getSupabaseUrl(): string {
  return requireEnv('SUPABASE_URL');
}
