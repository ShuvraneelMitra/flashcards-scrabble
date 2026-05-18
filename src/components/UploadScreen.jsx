import { useState, useRef } from "react";
import { Play, Save, Trash2, Upload } from "lucide-react";
import AccountMenu from "./AccountMenu";
import { parseWordList } from "../utils/wordUtils";
import { getWordLists, removeWordList, saveWordList, wordListToGamePayload } from "../utils/wordListStore";

export default function UploadScreen({
  onLoad,
  onLogout,
  onDeleteAccount,
  onChangeUsername,
  onChangePassword,
  onToggleTheme,
  theme,
  user,
}) {
  const [dragging3, setDragging3] = useState(false);
  const [dragging4, setDragging4] = useState(false);
  const [threeFile, setThreeFile] = useState(null);
  const [fourFile, setFourFile] = useState(null);
  const [listName, setListName] = useState("");
  const [savedLists, setSavedLists] = useState(() => getWordLists(user));
  const [selectedId, setSelectedId] = useState(() => getWordLists(user)[0]?.id || "");
  const [practiceMode, setPracticeMode] = useState("endless");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const threeInputRef = useRef();
  const fourInputRef = useRef();

  const parseFile = (file, len) =>
    new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(parseWordList(e.target.result, len));
      reader.readAsText(file);
    });

  const refreshSavedLists = () => {
    const lists = getWordLists(user);
    setSavedLists(lists);
    if (!lists.some((list) => list.id === selectedId)) {
      setSelectedId(lists[0]?.id || "");
    }
    return lists;
  };

  const loadSelected = () => {
    const selected = savedLists.find((list) => list.id === selectedId);
    if (!selected) {
      setError("Choose a saved word list first.");
      return;
    }
    onLoad({ ...wordListToGamePayload(selected), practiceMode });
  };

  const deleteSelected = () => {
    if (!selectedId) return;
    removeWordList(user, selectedId);
    const lists = refreshSavedLists();
    setSelectedId(lists[0]?.id || "");
    setMessage("Word list deleted.");
    setError("");
  };

  const saveAndLoadBoth = async () => {
    if (!threeFile || !fourFile) {
      setError("Please upload both 3-letter and 4-letter wordlists.");
      return;
    }

    const threeSet = await parseFile(threeFile, 3);
    const fourSet = await parseFile(fourFile, 4);

    if (threeSet.size < 10 || fourSet.size < 10) {
      setError("Invalid wordlists.");
      return;
    }

    const saved = saveWordList(user, {
      name: listName.trim() || `${threeFile.name} + ${fourFile.name}`,
      threeName: threeFile.name,
      fourName: fourFile.name,
      threeWords: [...threeSet],
      fourWords: [...fourSet],
    });
    setError("");
    setMessage("");
    setSelectedId(saved.id);
    refreshSavedLists();
    onLoad({
      threeSet,
      fourSet,
      threeName: threeFile.name,
      fourName: fourFile.name,
      listName: saved.name,
      listId: saved.id,
      practiceMode,
    });
  };

  const dropZoneStyle = (dragging) => ({
    border: `2px dashed ${dragging ? "#4ade80" : "#333"}`,
    borderRadius: 12,
    padding: "42px 24px",
    textAlign: "center",
    cursor: "pointer",
    background: dragging ? "#0d2018" : "#16161c",
    transition: "all 0.2s",
  });

  const renderDropZone = ({ label, file, setFile, dragging, setDragging, inputRef }) => (
    <div>
      <div style={{ fontSize: 11, color: "#555", letterSpacing: 2, marginBottom: 8 }}>
        {label}
      </div>
      <div
        onClick={() => inputRef.current.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); setFile(e.dataTransfer.files[0]); }}
        style={dropZoneStyle(dragging)}
      >
        <Upload size={28} color={dragging ? "#4ade80" : "#444"} style={{ marginBottom: 14 }} />
        <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 2, marginBottom: 8 }}>
          DROP {label} HERE
        </div>
        <div style={{ fontSize: 11, color: "#555" }}>
          {file ? file.name : "or click to browse"}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".txt"
          style={{ display: "none" }}
          onChange={(e) => setFile(e.target.files[0])}
        />
      </div>
    </div>
  );

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0f0f13",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Courier New', monospace",
      color: "#e8e4d8",
      filter: theme === "light" ? "invert(1) hue-rotate(180deg)" : "none",
      padding: 24,
    }}>
      <AccountMenu
        user={user}
        theme={theme}
        onToggleTheme={onToggleTheme}
        onLogout={onLogout}
        onDeleteAccount={onDeleteAccount}
        onChangeUsername={onChangeUsername}
        onChangePassword={onChangePassword}
        onError={setError}
        onMessage={setMessage}
      />
      <div style={{ fontSize: 11, letterSpacing: 6, color: "#555", marginBottom: 8 }}>
        THREE-LETTER WORDS
      </div>
      <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: 2, marginBottom: 40 }}>
        Tribble
      </div>

      <div style={{ width: "100%", maxWidth: 460, display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{
          background: "#16161c",
          border: "1px solid #2a2a35",
          borderRadius: 12,
          padding: "18px 16px",
        }}>
          <div style={{ fontSize: 11, color: "#555", letterSpacing: 2, marginBottom: 10 }}>
            PRACTICE MODE
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {[
              ["endless", "ENDLESS RANDOM"],
              ["scheduled", "SCHEDULED REVIEW"],
            ].map(([mode, label]) => (
              <button
                key={mode}
                onClick={() => setPracticeMode(mode)}
                style={{
                  background: practiceMode === mode ? "#4ade80" : "#0f0f13",
                  border: "1px solid #2a2a35",
                  borderRadius: 8,
                  color: practiceMode === mode ? "#0f0f13" : "#e8e4d8",
                  cursor: "pointer",
                  flex: 1,
                  fontFamily: "'Courier New', monospace",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: 1,
                  minHeight: 42,
                  padding: "10px 8px",
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {savedLists.length > 0 && (
          <div style={{
            background: "#16161c",
            border: "1px solid #2a2a35",
            borderRadius: 12,
            padding: "18px 16px",
          }}>
            <div style={{ fontSize: 11, color: "#555", letterSpacing: 2, marginBottom: 10 }}>
              SAVED WORD LISTS
            </div>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              style={{
                width: "100%",
                background: "#0f0f13",
                border: "1px solid #333",
                borderRadius: 8,
                color: "#e8e4d8",
                fontFamily: "'Courier New', monospace",
                fontSize: 12,
                marginBottom: 10,
                outline: "none",
                padding: "12px 10px",
              }}
            >
              {savedLists.map((list) => (
                <option key={list.id} value={list.id}>
                  {list.name} ({list.threeWords?.length || 0}/{list.fourWords?.length || 0})
                </option>
              ))}
            </select>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={loadSelected}
                style={{
                  alignItems: "center",
                  background: "#4ade80",
                  border: "none",
                  borderRadius: 8,
                  color: "#0f0f13",
                  cursor: "pointer",
                  display: "flex",
                  flex: 1,
                  fontFamily: "'Courier New', monospace",
                  fontSize: 11,
                  fontWeight: 700,
                  gap: 7,
                  justifyContent: "center",
                  letterSpacing: 2,
                  padding: "12px 10px",
                }}
              >
                <Play size={14} />
                PLAY
              </button>
              <button
                onClick={deleteSelected}
                style={{
                  alignItems: "center",
                  background: "#201113",
                  border: "1px solid #4a2428",
                  borderRadius: 8,
                  color: "#f87171",
                  cursor: "pointer",
                  display: "flex",
                  fontFamily: "'Courier New', monospace",
                  fontSize: 11,
                  fontWeight: 700,
                  gap: 7,
                  justifyContent: "center",
                  letterSpacing: 2,
                  padding: "12px 12px",
                }}
              >
                <Trash2 size={14} />
                DELETE
              </button>
            </div>
          </div>
        )}

        <div>
          <div style={{ fontSize: 11, color: "#555", letterSpacing: 2, marginBottom: 8 }}>
            NEW LIST NAME
          </div>
          <input
            value={listName}
            onChange={(e) => setListName(e.target.value)}
            placeholder="e.g. CSW practice set"
            style={{
              width: "100%",
              boxSizing: "border-box",
              background: "#0f0f13",
              border: "1px solid #333",
              borderRadius: 8,
              color: "#e8e4d8",
              fontFamily: "'Courier New', monospace",
              fontSize: 13,
              outline: "none",
              padding: "13px 14px",
            }}
          />
        </div>

        {renderDropZone({
          label: "3-LETTER WORDLIST",
          file: threeFile,
          setFile: setThreeFile,
          dragging: dragging3,
          setDragging: setDragging3,
          inputRef: threeInputRef,
        })}
        {renderDropZone({
          label: "4-LETTER WORDLIST",
          file: fourFile,
          setFile: setFourFile,
          dragging: dragging4,
          setDragging: setDragging4,
          inputRef: fourInputRef,
        })}

        <button
          onClick={saveAndLoadBoth}
          style={{
            marginTop: 6,
            background: "#4ade80",
            color: "#0f0f13",
            border: "none",
            borderRadius: 10,
            padding: "15px 18px",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: 2,
            cursor: "pointer",
            fontFamily: "'Courier New', monospace",
          }}
        >
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
            <Save size={14} />
            SAVE AND PLAY
          </span>
        </button>

        {(error || message) && (
          <div style={{ color: error ? "#f87171" : "#4ade80", fontSize: 12, textAlign: "center", marginTop: 4 }}>
            {error || message}
          </div>
        )}
      </div>
    </div>
  );
}
