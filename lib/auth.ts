import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Singleton browser client — prevents "Multiple GoTrueClient instances" and hanging
let browserClient: SupabaseClient | null = null;

export function createBrowserClient() {
  if (browserClient) return browserClient;
  browserClient = createClient(supabaseUrl, supabaseAnonKey);
  return browserClient;
}

// Server-side Supabase client (used in API routes — new instance per request is fine)
export function createServerClient() {
  return createClient(supabaseUrl, supabaseAnonKey);
}

// Auth helpers
export async function signUp(email: string, password: string) {
  const supabase = createBrowserClient();
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

export async function signIn(email: string, password: string) {
  const supabase = createBrowserClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const supabase = createBrowserClient();
  await supabase.auth.signOut();
}

export async function getUser() {
  const supabase = createBrowserClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getSession() {
  const supabase = createBrowserClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}
