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
    const url = new URL(publicUrl);
    url.pathname = url.pathname.replace(/\/+$/g, "") + "/";
    return url.toString().replace(/\/+$/g, "/");
  }

  // If we're already on a nested path (GitHub Pages), use the current href base.
  try {
    const current = new URL(window.location.href);
    const parts = current.pathname.split("/").filter(Boolean);
    if (parts.length >= 1) {
      return `${current.origin}/${parts[0]}/`.replace(/\/+$/g, "/");
    }
  } catch {
    // ignore
  }

  // Prefer PUBLIC_URL as a path (GitHub Pages builds typically set this to "/<repo>").
  if (publicUrl) {
    const normalized = publicUrl.startsWith("/") ? publicUrl : `/${publicUrl}`;
    const url = new URL(normalized.replace(/\/+$/g, "") + "/", window.location.origin);
    url.pathname = url.pathname.replace(/\/+$/g, "") + "/";
    return url.toString().replace(/\/+$/g, "/");
  }

  // Fallback: infer a GitHub Pages-style base path from the current location.
  const parts = window.location.pathname.split("/").filter(Boolean);
  const inferredBase = parts.length ? `/${parts[0]}` : "";
  const url = new URL(inferredBase.replace(/\/+$/g, "") + "/", window.location.origin);
  url.pathname = url.pathname.replace(/\/+$/g, "") + "/";
  return url.toString().replace(/\/+$/g, "/");
}
