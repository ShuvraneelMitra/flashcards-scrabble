import { useState } from "react";
import AuthScreen from "./components/AuthScreen";
import UploadScreen from "./components/UploadScreen";
import Game from "./components/Game";
import { clearToken, deleteAccount } from "./utils/authApi";
import { clearSchedules } from "./utils/scheduleStore";
import { clearWordLists } from "./utils/wordListStore";

export default function App() {
  const [user, setUser] = useState(null);
  const [threeSet, setThreeSet] = useState(null);
  const [fourSet, setFourSet] = useState(null);
  const [threeName, setThreeName] = useState("");
  const [fourName, setFourName] = useState("");
  const [listName, setListName] = useState("");
  const [listId, setListId] = useState("");
  const [practiceMode, setPracticeMode] = useState("endless");

  const leaveAccount = () => {
    clearToken();
    setUser(null);
    setThreeSet(null);
    setFourSet(null);
    setListName("");
    setListId("");
  };

  const handleLogout = () => {
    leaveAccount();
  };

  const handleDeleteAccount = async () => {
    await deleteAccount();
    clearWordLists(user);
    clearSchedules(user);
    leaveAccount();
  };

  if (!user) {
    return <AuthScreen onAuthenticated={setUser} />;
  }

  if (!threeSet || !fourSet) {
    return (
      <UploadScreen
        user={user}
        onLogout={handleLogout}
        onDeleteAccount={handleDeleteAccount}
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
      onLogout={handleLogout}
      onDeleteAccount={handleDeleteAccount}
      onReset={() => {
        setThreeSet(null);
        setFourSet(null);
        setListName("");
        setListId("");
      }}
    />
  );
}
