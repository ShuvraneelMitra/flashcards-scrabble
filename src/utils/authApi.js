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
  return request("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function login(payload) {
  return request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function requestPasswordReset(emailOrUsername) {
  return request("/api/auth/request-password-reset", {
    method: "POST",
    body: JSON.stringify({ emailOrUsername }),
  });
}

export function resetPassword(payload) {
  return request("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function verifyEmail(payload) {
  return request("/api/auth/verify-email", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function resendCode(email) {
  return request("/api/auth/resend-code", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function googleLogin(credential) {
  return request("/api/auth/google", {
    method: "POST",
    body: JSON.stringify({ credential }),
  });
}

export function getMe() {
  return request("/api/auth/me");
}

export function changeUsername(username) {
  return request("/api/auth/change-username", {
    method: "POST",
    body: JSON.stringify({ username }),
  });
}

export function changePassword(payload) {
  return request("/api/auth/change-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function deleteAccount() {
  return request("/api/auth/delete-account", {
    method: "POST",
  });
}
