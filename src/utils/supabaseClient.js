import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || "";
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || "";

export const supabaseEnabled = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = supabaseEnabled
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export function getAppRedirectUrl() {
  const publicUrl = String(process.env.PUBLIC_URL || "").trim();

  // If CRA PUBLIC_URL is already absolute (some build setups do this), use it as-is.
  if (/^https?:\/\//i.test(publicUrl)) {
    return publicUrl.replace(/\/+$/g, "");
  }

  // Prefer PUBLIC_URL as a path (GitHub Pages builds typically set this to "/<repo>").
  if (publicUrl) {
    const normalized = publicUrl.startsWith("/") ? publicUrl : `/${publicUrl}`;
    return `${window.location.origin}${normalized}`.replace(/\/+$/g, "");
  }

  // Fallback: infer a GitHub Pages-style base path from the current location.
  const parts = window.location.pathname.split("/").filter(Boolean);
  const inferredBase = parts.length ? `/${parts[0]}` : "";
  return `${window.location.origin}${inferredBase}`.replace(/\/+$/g, "");
}
