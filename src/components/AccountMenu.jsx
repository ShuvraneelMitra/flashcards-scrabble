import { useState } from "react";
import { ChevronDown, KeyRound, LogOut, Moon, Pencil, Sun, UserX } from "lucide-react";

export default function AccountMenu({
  user,
  theme = "dark",
  onToggleTheme,
  authMode = "local",
  onLogout,
  onDeleteAccount,
  onChangeUsername,
  onChangePassword,
  onError,
  onMessage,
}) {
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [changingUsername, setChangingUsername] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [menuError, setMenuError] = useState("");
  const [menuMessage, setMenuMessage] = useState("");
  const username = user?.username || user?.email || "ACCOUNT";

  const changeUsername = async () => {
    const nextUsername = window.prompt("Enter a new username. Use 3-24 letters, numbers, or underscores.", user?.username || "");
    if (nextUsername === null) return;
    const cleanUsername = nextUsername.trim();
    if (cleanUsername === username) return;
    setChangingUsername(true);
    setMenuError("");
    setMenuMessage("");
    onError?.("");
    onMessage?.("");
    try {
      const updatedUser = await onChangeUsername(cleanUsername);
      const nextMessage = `Username changed to ${updatedUser.username}.`;
      setMenuMessage(nextMessage);
      onMessage?.(nextMessage);
    } catch (err) {
      const nextError = err.message || "Could not change username.";
      setMenuError(nextError);
      onError?.(nextError);
    } finally {
      setChangingUsername(false);
    }
  };

  const deleteAccount = async () => {
    const confirmed = window.confirm("Delete your account and local word-list data? This cannot be undone.");
    if (!confirmed) return;
    setDeleting(true);
    setMenuError("");
    setMenuMessage("");
    onError?.("");
    onMessage?.("");
    try {
      await onDeleteAccount();
    } catch (err) {
      const nextError = err.message || "Could not delete account.";
      setMenuError(nextError);
      onError?.(nextError);
      setDeleting(false);
    }
  };

  const updatePasswordField = (key) => (event) => {
    setPasswordForm((current) => ({ ...current, [key]: event.target.value }));
  };

  const changePassword = async (event) => {
    event.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      const nextError = "New passwords do not match.";
      setMenuError(nextError);
      setMenuMessage("");
      onError?.(nextError);
      onMessage?.("");
      return;
    }

    setChangingPassword(true);
    setMenuError("");
    setMenuMessage("");
    onError?.("");
    onMessage?.("");
    try {
      await onChangePassword({
        currentPassword: authMode === "local" ? passwordForm.currentPassword : undefined,
        newPassword: passwordForm.newPassword,
      });
      const nextMessage = "Password changed.";
      setMenuMessage(nextMessage);
      onMessage?.(nextMessage);
      setShowPasswordForm(false);
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      const nextError = err.message || "Could not change password.";
      setMenuError(nextError);
      onError?.(nextError);
    } finally {
      setChangingPassword(false);
    }
  };

  const menuButtonStyle = (danger = false) => ({
    alignItems: "center",
    background: "transparent",
    border: "none",
    color: danger ? "#f87171" : "#e8e4d8",
    cursor: "pointer",
    display: "flex",
    fontFamily: "'Courier New', monospace",
    fontSize: 11,
    fontWeight: 700,
    gap: 8,
    justifyContent: "flex-start",
    letterSpacing: 1,
    padding: "11px 12px",
    textAlign: "left",
    width: "100%",
  });

  const passwordInputStyle = {
    background: "#0f0f13",
    border: "1px solid #333",
    borderRadius: 7,
    color: "#e8e4d8",
    fontFamily: "'Courier New', monospace",
    fontSize: 12,
    outline: "none",
    padding: "10px 11px",
    width: "100%",
    boxSizing: "border-box",
  };

  return (
    <div style={{ position: "fixed", right: 18, top: 18, zIndex: 20 }}>
      <button
        onClick={() => setOpen((value) => !value)}
        style={{
          alignItems: "center",
          background: "#16161c",
          border: "1px solid #2a2a35",
          borderRadius: 8,
          color: "#e8e4d8",
          cursor: "pointer",
          display: "flex",
          fontFamily: "'Courier New', monospace",
          fontSize: 11,
          fontWeight: 700,
          gap: 8,
          letterSpacing: 1,
          maxWidth: 220,
          padding: "10px 12px",
        }}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {username}
        </span>
        <ChevronDown size={14} />
      </button>

      {open && (
        <div
          style={{
            background: "#16161c",
            border: "1px solid #2a2a35",
            borderRadius: 8,
            boxShadow: "0 14px 30px rgba(0,0,0,0.35)",
            marginTop: 8,
            minWidth: 210,
            overflow: "hidden",
            position: "absolute",
            right: 0,
          }}
        >
          <button onClick={changeUsername} disabled={changingUsername} style={menuButtonStyle()}>
            <Pencil size={14} />
            {changingUsername ? "CHANGING..." : "CHANGE USERNAME"}
          </button>
          <div
            style={{
              alignItems: "center",
              borderTop: "1px solid #2a2a35",
              display: "flex",
              gap: 10,
              justifyContent: "space-between",
              padding: "11px 12px",
            }}
          >
            <div style={{
              alignItems: "center",
              color: "#e8e4d8",
              display: "flex",
              fontFamily: "'Courier New', monospace",
              fontSize: 11,
              fontWeight: 700,
              gap: 8,
              letterSpacing: 1,
            }}>
              {theme === "dark" ? <Moon size={14} /> : <Sun size={14} />}
              {theme === "dark" ? "DARK" : "LIGHT"}
            </div>
            <button
              type="button"
              aria-label="Toggle light and dark mode"
              onClick={onToggleTheme}
              style={{
                background: theme === "dark" ? "#0f0f13" : "#4ade80",
                border: `1px solid ${theme === "dark" ? "#333" : "#4ade80"}`,
                borderRadius: 999,
                cursor: "pointer",
                height: 24,
                padding: 2,
                position: "relative",
                width: 46,
              }}
            >
              <span
                style={{
                  background: theme === "dark" ? "#e8e4d8" : "#0f0f13",
                  borderRadius: "50%",
                  display: "block",
                  height: 18,
                  transform: theme === "dark" ? "translateX(0)" : "translateX(20px)",
                  transition: "transform 0.18s ease",
                  width: 18,
                }}
              />
            </button>
          </div>
          {(authMode === "local" || authMode === "supabase") && (
            <button
              onClick={() => {
                setShowPasswordForm((value) => !value);
                setMenuError("");
                setMenuMessage("");
                onError?.("");
                onMessage?.("");
              }}
              disabled={changingPassword}
              style={menuButtonStyle()}
            >
              <KeyRound size={14} />
              {changingPassword ? "CHANGING..." : "CHANGE PASSWORD"}
            </button>
          )}
          {(authMode === "local" || authMode === "supabase") && showPasswordForm && (
            <form
              onSubmit={changePassword}
              style={{
                borderTop: "1px solid #2a2a35",
                display: "flex",
                flexDirection: "column",
                gap: 8,
                padding: "10px 12px 12px",
              }}
            >
              {authMode === "local" && (
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={updatePasswordField("currentPassword")}
                  placeholder="Current password"
                  autoComplete="current-password"
                  required
                  style={passwordInputStyle}
                />
              )}
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={updatePasswordField("newPassword")}
                placeholder="New password"
                autoComplete="new-password"
                minLength={8}
                required
                style={passwordInputStyle}
              />
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={updatePasswordField("confirmPassword")}
                placeholder="Confirm new password"
                autoComplete="new-password"
                minLength={8}
                required
                style={passwordInputStyle}
              />
              <button
                type="submit"
                disabled={changingPassword}
                style={{
                  background: changingPassword ? "#223026" : "#4ade80",
                  border: "none",
                  borderRadius: 7,
                  color: changingPassword ? "#667066" : "#0f0f13",
                  cursor: changingPassword ? "not-allowed" : "pointer",
                  fontFamily: "'Courier New', monospace",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: 1,
                  padding: "10px 11px",
                }}
              >
                SAVE PASSWORD
              </button>
            </form>
          )}
          <button onClick={onLogout} style={menuButtonStyle()}>
            <LogOut size={14} />
            LOG OUT
          </button>
          {authMode === "local" && (
            <button onClick={deleteAccount} disabled={deleting} style={menuButtonStyle(true)}>
              <UserX size={14} />
              {deleting ? "DELETING..." : "DELETE ACCOUNT"}
            </button>
          )}
          {(menuError || menuMessage) && (
            <div
              style={{
                borderTop: "1px solid #2a2a35",
                color: menuError ? "#f87171" : "#4ade80",
                fontFamily: "'Courier New', monospace",
                fontSize: 11,
                lineHeight: 1.4,
                padding: "10px 12px",
              }}
            >
              {menuError || menuMessage}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
