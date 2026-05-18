import { useEffect, useRef, useState } from "react";
import { KeyRound, LogIn, MailCheck, Send, UserPlus } from "lucide-react";
import {
  clearToken,
  getMe,
  googleLogin,
  login,
  requestPasswordReset,
  resendCode,
  signup,
  verifyEmail,
} from "../utils/authApi";
import { supabase, supabaseEnabled } from "../utils/supabaseClient";

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || "";

function Field({ label, ...props }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 7 }}>
      <span style={{ fontSize: 10, color: "#555", letterSpacing: 2 }}>{label}</span>
      <input
        {...props}
        style={{
          background: "#0f0f13",
          border: "1px solid #333",
          borderRadius: 8,
          color: "#e8e4d8",
          fontFamily: "'Courier New', monospace",
          fontSize: 14,
          outline: "none",
          padding: "13px 14px",
        }}
      />
    </label>
  );
}

function PrimaryButton({ children, disabled, icon, ...props }) {
  return (
    <button
      {...props}
      disabled={disabled}
      style={{
        alignItems: "center",
        background: disabled ? "#223026" : "#4ade80",
        border: "none",
        borderRadius: 8,
        color: disabled ? "#667066" : "#0f0f13",
        cursor: disabled ? "not-allowed" : "pointer",
        display: "flex",
        fontFamily: "'Courier New', monospace",
        fontSize: 12,
        fontWeight: 700,
        gap: 8,
        justifyContent: "center",
        letterSpacing: 2,
        padding: "14px 16px",
      }}
    >
      {icon}
      {children}
    </button>
  );
}

export default function AuthScreen({ onAuthenticated }) {
  const [mode, setMode] = useState("login");
  const [pendingEmail, setPendingEmail] = useState("");
  const [form, setForm] = useState({
    fullName: "",
    username: "",
    email: "",
    emailOrUsername: "",
    password: "",
    code: "",
    resetCode: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const googleButtonRef = useRef(null);

  useEffect(() => {
    let alive = true;
    getMe()
      .then(({ user }) => {
        if (alive && user.emailVerified) onAuthenticated(user);
      })
      .catch(() => clearToken());
    return () => {
      alive = false;
    };
  }, [onAuthenticated]);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !googleButtonRef.current) return;
    const existing = document.querySelector("script[data-google-identity]");
    const initGoogle = () => {
      if (!window.google || !googleButtonRef.current) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async ({ credential }) => {
          await run(async () => {
            const { user } = await googleLogin(credential);
            onAuthenticated(user);
          });
        },
      });
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: "filled_black",
        size: "large",
        width: 330,
      });
    };

    if (existing) {
      initGoogle();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.dataset.googleIdentity = "true";
    script.onload = initGoogle;
    document.body.appendChild(script);
  }, [onAuthenticated]);

  const update = (key) => (event) => {
    setForm((current) => ({ ...current, [key]: event.target.value }));
  };

  const run = async (action) => {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      await action();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = (event) => {
    event.preventDefault();
    run(async () => {
      const { user, message: nextMessage } = await signup({
        fullName: form.fullName,
        username: form.username,
        email: form.email,
        password: form.password,
      });
      setPendingEmail(user.email);
      setMode("verify");
      setMessage(nextMessage || "Check your email for the verification code.");
    });
  };

  const handleLogin = (event) => {
    event.preventDefault();
    run(async () => {
      const { user } = await login({
        emailOrUsername: form.emailOrUsername,
        password: form.password,
      });
      if (!user.emailVerified) {
        setPendingEmail(user.email);
        setMode("verify");
        setMessage("Verify your email before continuing.");
        return;
      }
      onAuthenticated(user);
    });
  };

  const handleVerify = (event) => {
    event.preventDefault();
    run(async () => {
      const { user } = await verifyEmail({ email: pendingEmail || form.email, code: form.code });
      onAuthenticated(user);
    });
  };

  const handleResend = () => {
    run(async () => {
      const { message: nextMessage } = await resendCode(pendingEmail || form.email);
      setMessage(nextMessage);
    });
  };

  const handleRequestPasswordReset = (event) => {
    event.preventDefault();
    run(async () => {
      const { message: nextMessage } = await requestPasswordReset(form.emailOrUsername);
      setMode("login");
      setMessage(nextMessage || "Password reset email sent.");
    });
  };

  return (
    <div
      style={{
        alignItems: "center",
        background: "#0f0f13",
        color: "#e8e4d8",
        display: "flex",
        flexDirection: "column",
        fontFamily: "'Courier New', monospace",
        justifyContent: "center",
        minHeight: "100vh",
        padding: 24,
      }}
    >
      <div style={{ fontSize: 11, letterSpacing: 6, color: "#555", marginBottom: 8 }}>
        THREE-LETTER WORDS
      </div>
      <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: 2, marginBottom: 28 }}>
        Tribble
      </div>

      <div
        style={{
          background: "#16161c",
          border: "1px solid #2a2a35",
          borderRadius: 12,
          maxWidth: 430,
          padding: "24px 22px",
          width: "100%",
        }}
      >
        <div style={{ display: "flex", gap: 8, marginBottom: 22 }}>
          {[
            ["login", "LOGIN"],
            ["signup", "SIGN UP"],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => {
                setMode(key);
                setError("");
                setMessage("");
              }}
              style={{
                background: mode === key ? "#4ade80" : "#0f0f13",
                border: "1px solid #2a2a35",
                borderRadius: 8,
                color: mode === key ? "#0f0f13" : "#e8e4d8",
                cursor: "pointer",
                flex: 1,
                fontFamily: "'Courier New', monospace",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 2,
                padding: "11px 10px",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {mode === "login" && (
          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Field
              label={supabaseEnabled ? "EMAIL" : "EMAIL OR USERNAME"}
              value={form.emailOrUsername}
              onChange={update("emailOrUsername")}
              autoComplete="username"
              required
            />
            <Field label="PASSWORD" type="password" value={form.password} onChange={update("password")} autoComplete="current-password" required />
            <PrimaryButton disabled={loading} icon={<LogIn size={15} />}>LOGIN</PrimaryButton>
            <button
              type="button"
              onClick={() => {
                setMode("forgotPassword");
                setError("");
                setMessage("");
              }}
              style={{
                background: "transparent",
                border: "none",
                color: "#60a5fa",
                cursor: "pointer",
                fontFamily: "'Courier New', monospace",
                fontSize: 11,
                letterSpacing: 1,
                padding: 4,
              }}
            >
              FORGOT PASSWORD?
            </button>
          </form>
        )}

        {mode === "signup" && (
          <form onSubmit={handleSignup} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Field label="FULL NAME" value={form.fullName} onChange={update("fullName")} autoComplete="name" required />
            <Field label="USERNAME" value={form.username} onChange={update("username")} autoComplete="username" required />
            <Field label="EMAIL" type="email" value={form.email} onChange={update("email")} autoComplete="email" required />
            <Field label="PASSWORD" type="password" value={form.password} onChange={update("password")} autoComplete="new-password" minLength={8} required />
            <PrimaryButton disabled={loading} icon={<UserPlus size={15} />}>CREATE ACCOUNT</PrimaryButton>
          </form>
        )}

        {mode === "verify" && (
          <form onSubmit={handleVerify} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ color: "#777", fontSize: 12, lineHeight: 1.6 }}>
              Enter the 6-digit code for {pendingEmail || form.email}.
            </div>
            <Field label="VERIFICATION CODE" value={form.code} onChange={update("code")} inputMode="numeric" maxLength={6} required />
            <PrimaryButton disabled={loading} icon={<MailCheck size={15} />}>VERIFY EMAIL</PrimaryButton>
            <button
              type="button"
              onClick={handleResend}
              disabled={loading}
              style={{
                background: "transparent",
                border: "none",
                color: "#60a5fa",
                cursor: loading ? "not-allowed" : "pointer",
                fontFamily: "'Courier New', monospace",
                fontSize: 11,
                letterSpacing: 1,
                padding: 4,
              }}
            >
              RESEND CODE
            </button>
          </form>
        )}

        {mode === "forgotPassword" && (
          <form onSubmit={handleRequestPasswordReset} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ color: "#777", fontSize: 12, lineHeight: 1.6 }}>
              Enter your email{supabaseEnabled ? "" : " or username"}. A password reset email will be sent.
            </div>
            <Field
              label={supabaseEnabled ? "EMAIL" : "EMAIL OR USERNAME"}
              value={form.emailOrUsername}
              onChange={update("emailOrUsername")}
              autoComplete="username"
              required
            />
            <PrimaryButton disabled={loading} icon={<Send size={15} />}>SEND RESET CODE</PrimaryButton>
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError("");
                setMessage("");
              }}
              style={{
                background: "transparent",
                border: "none",
                color: "#60a5fa",
                cursor: "pointer",
                fontFamily: "'Courier New', monospace",
                fontSize: 11,
                letterSpacing: 1,
                padding: 4,
              }}
            >
              BACK TO LOGIN
            </button>
          </form>
        )}

        <div style={{ alignItems: "center", display: "flex", gap: 12, margin: "22px 0" }}>
          <div style={{ background: "#2a2a35", flex: 1, height: 1 }} />
          <span style={{ color: "#444", fontSize: 10, letterSpacing: 2 }}>GOOGLE</span>
          <div style={{ background: "#2a2a35", flex: 1, height: 1 }} />
        </div>
        {supabaseEnabled ? (
          <PrimaryButton
            disabled={loading}
            icon={<KeyRound size={15} />}
            onClick={() =>
              run(async () => {
                const { error } = await supabase.auth.signInWithOAuth({
                  provider: "google",
                  options: { redirectTo: window.location.origin },
                });
                if (error) throw new Error(error.message);
              })
            }
            type="button"
          >
            CONTINUE WITH GOOGLE
          </PrimaryButton>
        ) : GOOGLE_CLIENT_ID ? (
          <div ref={googleButtonRef} style={{ display: "flex", justifyContent: "center", minHeight: 44 }} />
        ) : (
          <div style={{ color: "#555", fontSize: 11, lineHeight: 1.5, textAlign: "center" }}>
            Set REACT_APP_GOOGLE_CLIENT_ID and GOOGLE_CLIENT_ID to enable Google sign-in.
          </div>
        )}

        {(error || message) && (
          <div
            style={{
              color: error ? "#f87171" : "#4ade80",
              fontSize: 12,
              lineHeight: 1.5,
              marginTop: 18,
              textAlign: "center",
            }}
          >
            {error || message}
          </div>
        )}
      </div>
    </div>
  );
}
