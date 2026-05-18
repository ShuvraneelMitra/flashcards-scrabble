import { getAppRedirectUrl, supabase, supabaseEnabled } from "./supabaseClient";

const TOKEN_KEY = "flashcards_scrabble_auth_token";

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function storeToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function request(path, options = {}) {
  const token = getStoredToken();
  const response = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Request failed.");
  if (data.token) storeToken(data.token);
  return data;
}

export function signup(payload) {
  if (supabaseEnabled) {
    const email = String(payload.email || "").trim();
    const password = String(payload.password || "");
    const fullName = String(payload.fullName || "").trim();
    const username = String(payload.username || "").trim().toLowerCase();
    return supabase.auth
      .signUp({
        email,
        password,
        options: {
          data: { fullName, username },
          emailRedirectTo: getAppRedirectUrl(),
        },
      })
      .then(({ data, error }) => {
        if (error) throw new Error(error.message);
        return {
          user: {
            id: data.user?.id,
            fullName,
            username,
            email,
            emailVerified: Boolean(data.user?.email_confirmed_at),
            provider: "password",
          },
          message: "Check your email to confirm your account.",
        };
      });
  }
  return request("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function login(payload) {
  if (supabaseEnabled) {
    const emailOrUsername = String(payload.emailOrUsername || "").trim();
    if (!emailOrUsername.includes("@")) {
      throw new Error("Supabase login requires email. Use your email address.");
    }
    return supabase.auth
      .signInWithPassword({
        email: emailOrUsername,
        password: String(payload.password || ""),
      })
      .then(({ data, error }) => {
        if (error) throw new Error(error.message);
        const user = data.user;
        const meta = user?.user_metadata || {};
        return {
          user: {
            id: user?.id,
            fullName: meta.fullName || "",
            username: meta.username || "",
            email: user?.email || "",
            emailVerified: Boolean(user?.email_confirmed_at),
            provider: user?.app_metadata?.provider || "password",
          },
        };
      });
  }
  return request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function requestPasswordReset(emailOrUsername) {
  if (supabaseEnabled) {
    const email = String(emailOrUsername || "").trim();
    if (!email.includes("@")) throw new Error("Supabase password reset requires an email address.");
    return supabase.auth.resetPasswordForEmail(email, { redirectTo: getAppRedirectUrl() }).then(({ error }) => {
      if (error) throw new Error(error.message);
      return { email, message: "Password reset email sent." };
    });
  }
  return request("/api/auth/request-password-reset", {
    method: "POST",
    body: JSON.stringify({ emailOrUsername }),
  });
}

export function resetPassword(payload) {
  if (supabaseEnabled) {
    throw new Error("Supabase password reset is handled via the email link.");
  }
  return request("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function verifyEmail(payload) {
  if (supabaseEnabled) {
    throw new Error("Supabase email verification is handled via the email link.");
  }
  return request("/api/auth/verify-email", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function resendCode(email) {
  if (supabaseEnabled) {
    const cleanEmail = String(email || "").trim();
    return supabase.auth.resend({ type: "signup", email: cleanEmail }).then(({ error }) => {
      if (error) throw new Error(error.message);
      return { message: "Confirmation email resent." };
    });
  }
  return request("/api/auth/resend-code", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function getMe() {
  if (supabaseEnabled) {
    return supabase.auth.getUser().then(({ data, error }) => {
      if (error) throw new Error(error.message);
      const user = data.user;
      if (!user) throw new Error("Not authenticated.");
      const meta = user.user_metadata || {};
      return {
        user: {
          id: user.id,
          fullName: meta.fullName || "",
          username: meta.username || "",
          email: user.email,
          emailVerified: Boolean(user.email_confirmed_at),
          provider: user.app_metadata?.provider || "password",
        },
      };
    });
  }
  return request("/api/auth/me");
}

export function changeUsername(username) {
  if (supabaseEnabled) {
    const cleanUsername = String(username || "").trim().toLowerCase();
    return supabase.auth.updateUser({ data: { username: cleanUsername } }).then(({ data, error }) => {
      if (error) throw new Error(error.message);
      const user = data.user;
      const meta = user?.user_metadata || {};
      return {
        user: {
          id: user?.id,
          fullName: meta.fullName || "",
          username: meta.username || cleanUsername,
          email: user?.email || "",
          emailVerified: Boolean(user?.email_confirmed_at),
          provider: user?.app_metadata?.provider || "password",
        },
      };
    });
  }
  return request("/api/auth/change-username", {
    method: "POST",
    body: JSON.stringify({ username }),
  });
}

export function changePassword(payload) {
  if (supabaseEnabled) {
    throw new Error("Use Forgot Password to change password when using Supabase.");
  }
  return request("/api/auth/change-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function deleteAccount() {
  if (supabaseEnabled) {
    throw new Error("Account deletion requires a backend when using Supabase Auth.");
  }
  return request("/api/auth/delete-account", {
    method: "POST",
  });
}
