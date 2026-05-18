import { useEffect, useState } from "react";
import AuthScreen from "./components/AuthScreen";
import UploadScreen from "./components/UploadScreen";
import Game from "./components/Game";
import { changePassword, changeUsername, clearToken } from "./utils/authApi";
import { supabase, supabaseEnabled } from "./utils/supabaseClient";

export default function App() {
  const [user, setUser] = useState(null);
  const [threeSet, setThreeSet] = useState(null);
  const [fourSet, setFourSet] = useState(null);
  const [threeName, setThreeName] = useState("");
  const [fourName, setFourName] = useState("");
  const [listName, setListName] = useState("");
  const [listId, setListId] = useState("");
  const [practiceMode, setPracticeMode] = useState("endless");
  const [theme, setTheme] = useState(() => localStorage.getItem("flashcards_scrabble_theme") || "dark");

  useEffect(() => {
    localStorage.setItem("flashcards_scrabble_theme", theme);
  }, [theme]);

  const leaveAccount = () => {
    clearToken();
    setUser(null);
    setThreeSet(null);
    setFourSet(null);
    setListName("");
    setListId("");
  };

  const handleLogout = () => {
    if (supabaseEnabled && supabase) {
      supabase.auth.signOut().catch(() => {});
    }
    leaveAccount();
  };

  const handleChangeUsername = async (username) => {
    const cleanUsername = username.trim();
    if (!cleanUsername) throw new Error("Username is required.");
    const { user: updatedUser } = await changeUsername(cleanUsername);
    if (!updatedUser) throw new Error("Username change did not return an updated user.");
    setUser(updatedUser);
    return updatedUser;
  };

  const handleChangePassword = async ({ currentPassword, newPassword }) => {
    if (!newPassword || newPassword.length < 8) throw new Error("New password must be at least 8 characters.");
    if (supabaseEnabled && supabase) {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw new Error(error.message);
      return;
    }
    if (!currentPassword) throw new Error("Current password is required.");
    await changePassword({ currentPassword, newPassword });
  };

  if (!user) {
    return <AuthScreen onAuthenticated={setUser} />;
  }

  if (!threeSet || !fourSet) {
    return (
      <UploadScreen
        user={user}
        authMode={supabaseEnabled ? "supabase" : "local"}
        onLogout={handleLogout}
        onChangeUsername={handleChangeUsername}
        onChangePassword={handleChangePassword}
        theme={theme}
        onToggleTheme={() => setTheme((value) => (value === "dark" ? "light" : "dark"))}
        onLoad={({ threeSet, fourSet, threeName, fourName, listName, listId, practiceMode }) => {
          setThreeSet(threeSet);
          setFourSet(fourSet);
          setThreeName(threeName);
          setFourName(fourName);
          setListName(listName || "");
          setListId(listId || "");
          setPracticeMode(practiceMode || "endless");
        }}
      />
    );
  }

  return (
    <Game
      wordSet={threeSet}
      fourSet={fourSet}
      fileName={listName || `${threeName} + ${fourName}`}
      listId={listId}
      practiceMode={practiceMode}
      user={user}
      authMode={supabaseEnabled ? "supabase" : "local"}
      onLogout={handleLogout}
      onChangeUsername={handleChangeUsername}
      onChangePassword={handleChangePassword}
      theme={theme}
      onToggleTheme={() => setTheme((value) => (value === "dark" ? "light" : "dark"))}
      onReset={() => {
        setThreeSet(null);
        setFourSet(null);
        setListName("");
        setListId("");
      }}
    />
  );
}
