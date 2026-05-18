import { useState, useCallback, useRef } from "react";
import { Check, RotateCcw, ChevronRight, ChevronLeft, Shuffle } from "lucide-react";
import AccountMenu from "./AccountMenu";
import { ALPHABET } from "../constants";
import { cardFromKey, generateCard, getFrontHooks, getBackHooks } from "../utils/wordUtils";
import { getDueCardKeys, getScheduleStats, gradeScheduledCard } from "../utils/scheduleStore";

const STYLES = `
  @keyframes shake {
    0%,100%{transform:translateX(0)}
    20%{transform:translateX(-6px)}
    40%{transform:translateX(6px)}
    60%{transform:translateX(-4px)}
    80%{transform:translateX(4px)}
  }
  @keyframes popIn {
    0%{transform:scale(0.7);opacity:0}
    70%{transform:scale(1.15)}
    100%{transform:scale(1);opacity:1}
  }
`;

function WordTile({ ch }) {
  return (
    <div style={{
      width: 64,
      height: 70,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 38,
      fontWeight: 700,
      borderRadius: 6,
      background: ch === "_" ? "#0f0f13" : "#1e1e28",
      border: ch === "_" ? "2px dashed #4a4a5a" : "2px solid #2a2a38",
      color: ch === "_" ? "#4ade80" : "#e8e4d8",
    }}>
      {ch}
    </div>
  );
}

function LetterGrid({ found, answers, showAnswers, pulse }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
      {ALPHABET.map((letter) => {
        const isFound = found.has(letter);
        const revealed = showAnswers && answers.includes(letter) && !isFound;
        return (
          <div key={letter} style={{
            width: 34,
            height: 34,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
            fontWeight: 700,
            borderRadius: 4,
            border: isFound ? "1px solid #4ade80" : revealed ? "1px solid #f59e0b" : "1px solid #222",
            background: isFound ? "#14291e" : revealed ? "#2a1f08" : "#0f0f13",
            color: isFound ? "#4ade80" : revealed ? "#f59e0b" : "#2a2a35",
            animation: pulse === letter ? "popIn 0.4s ease" : "none",
          }}>
            {isFound || revealed ? letter : "·"}
          </div>
        );
      })}
    </div>
  );
}

function AnswerList({ card, fourSet }) {
  return (
    <div style={{
      marginTop: 18,
      padding: "18px 16px",
      background: "#111",
      border: "1px solid #2a2a35",
      borderRadius: 8,
      display: "flex",
      flexDirection: "column",
      gap: 10,
    }}>
      {card.answers.map((letter) => {
        const fullWord = card.baseWord.slice(0, card.pos) + letter + card.baseWord.slice(card.pos + 1);
        const frontHooks = getFrontHooks(fullWord, fourSet);
        const backHooks = getBackHooks(fullWord, fourSet);
        return (
          <div key={fullWord} style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "'Courier New', monospace",
            fontSize: 14,
            fontWeight: 300,
            letterSpacing: 3,
            lineHeight: 1.2,
          }}>
            <div style={{ width: 180, textAlign: "right", color: "#60a5fa", overflow: "hidden", whiteSpace: "nowrap" }}>
              {frontHooks || "—"}
            </div>
            <div style={{ width: 120, textAlign: "center", color: "#e8e4d8" }}>
              {fullWord}
            </div>
            <div style={{ width: 180, textAlign: "left", color: "#f59e0b", overflow: "hidden", whiteSpace: "nowrap" }}>
              {backHooks || "—"}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function Game({
  wordSet,
  fourSet,
  fileName,
  listId,
  practiceMode,
  onReset,
  onLogout,
  onDeleteAccount,
  onChangeUsername,
  onChangePassword,
  onToggleTheme,
  theme,
  user,
}) {
  const usedRef = useRef(new Set());
  const gradedRef = useRef(new Set());
  const cardsSinceReviewRef = useRef(0);
  const missedRef = useRef(false);
  const revealedRef = useRef(false);
  const isScheduledMode = practiceMode === "scheduled";

  const makeRandomCard = useCallback(() => {
    let next = generateCard(wordSet, fourSet, usedRef.current);
    if (!next) {
      usedRef.current.clear();
      next = generateCard(wordSet, fourSet, usedRef.current);
    }
    if (!next) return null;
    usedRef.current.add(next.key);
    return { ...next, source: "random" };
  }, [wordSet, fourSet]);

  const makeReviewCard = useCallback(() => {
    if (!isScheduledMode || cardsSinceReviewRef.current < 2) return null;
    const dueKey = getDueCardKeys(user, listId).find((key) => !usedRef.current.has(`review-${key}`));
    if (!dueKey) return null;
    const dueCard = cardFromKey(dueKey, wordSet, fourSet);
    if (!dueCard) return null;
    usedRef.current.add(`review-${dueKey}`);
    cardsSinceReviewRef.current = 0;
    return dueCard;
  }, [fourSet, isScheduledMode, listId, user, wordSet]);

  const makeNextCard = useCallback(() => {
    const review = makeReviewCard();
    if (review) return review;
    const random = makeRandomCard();
    if (random) cardsSinceReviewRef.current += 1;
    return random;
  }, [makeRandomCard, makeReviewCard]);

  const [history, setHistory] = useState(() => {
    const firstCard = makeNextCard();
    return firstCard ? [firstCard] : [];
  });
  const [idx, setIdx] = useState(0);
  const card = history[idx];

  const [found, setFound] = useState(new Set());
  const [input, setInput] = useState("");
  const [shake, setShake] = useState(false);
  const [pulse, setPulse] = useState(null);
  const [done, setDone] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);
  const [solvedCount, setSolvedCount] = useState(0);
  const [scheduleStats, setScheduleStats] = useState(() => getScheduleStats(user, listId));
  const [accountError, setAccountError] = useState("");
  const [accountMessage, setAccountMessage] = useState("");

  const resetCardState = useCallback(() => {
    setFound(new Set());
    setInput("");
    setDone(false);
    setShowAnswers(false);
    missedRef.current = false;
    revealedRef.current = false;
  }, []);

  const refreshScheduleStats = useCallback(() => {
    setScheduleStats(getScheduleStats(user, listId));
  }, [listId, user]);

  const gradeCurrentCard = useCallback((passed) => {
    if (!isScheduledMode || !card || gradedRef.current.has(card.key)) return;
    gradeScheduledCard(user, listId, card, passed);
    gradedRef.current.add(card.key);
    refreshScheduleStats();
  }, [card, isScheduledMode, listId, refreshScheduleStats, user]);

  const nextCard = useCallback(() => {
    if (idx < history.length - 1) {
      setIdx((v) => v + 1);
      resetCardState();
      return;
    }

    const next = makeNextCard();
    if (next) {
      setHistory((prev) => [...prev, next]);
      setIdx((prev) => prev + 1);
      resetCardState();
    }
  }, [idx, history.length, makeNextCard, resetCardState]);

  const prevCard = () => {
    if (idx > 0) { setIdx((v) => v - 1); resetCardState(); }
  };

  const handleSubmit = () => {
    const letter = input.trim().toUpperCase();
    if (letter.length !== 1 || !/[A-Z]/.test(letter)) { setInput(""); return; }
    if (found.has(letter)) { setInput(""); return; }

    if (card.answers.includes(letter)) {
      const next = new Set(found);
      next.add(letter);
      setFound(next);
      setPulse(letter);
      setTimeout(() => setPulse(null), 400);
      setInput("");
      if (next.size === card.answers.length) {
        setDone(true);
        setSolvedCount((v) => v + 1);
        gradeCurrentCard(!missedRef.current && !revealedRef.current);
      }
    } else {
      missedRef.current = true;
      setShake(true);
      setTimeout(() => setShake(false), 400);
      setInput("");
    }
  };

  const buttons = [
    { content: <ChevronLeft size={15} />, action: prevCard, disabled: idx === 0 },
    { content: <ChevronRight size={15} />, action: nextCard },
    { content: <RotateCcw size={15} />, action: resetCardState },
    {
      content: showAnswers ? "HIDE" : "REVEAL",
      action: () => {
        const nextShowAnswers = !showAnswers;
        if (nextShowAnswers) {
          revealedRef.current = true;
          gradeCurrentCard(false);
        }
        setShowAnswers(nextShowAnswers);
      },
      accent: showAnswers,
    },
    {
      content: <><Shuffle size={13} /><span style={{ marginLeft: 5 }}>RESET POOL</span></>,
      action: () => { usedRef.current.clear(); },
    },
    { content: "CHANGE FILE", action: onReset },
  ];

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0f0f13",
      fontFamily: "'Courier New', monospace",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px 16px",
      color: "#e8e4d8",
      filter: theme === "light" ? "invert(1) hue-rotate(180deg)" : "none",
    }}>
      <style>{STYLES}</style>
      <AccountMenu
        user={user}
        theme={theme}
        onToggleTheme={onToggleTheme}
        onLogout={onLogout}
        onDeleteAccount={onDeleteAccount}
        onChangeUsername={onChangeUsername}
        onChangePassword={onChangePassword}
        onError={setAccountError}
        onMessage={setAccountMessage}
      />

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 6, color: "#555", marginBottom: 7 }}>
          THREE-LETTER WORDS
        </div>
        <div style={{ fontSize: 32, fontWeight: 900, letterSpacing: 2 }}>
          Tribble
        </div>
        <div style={{ fontSize: 12, fontWeight: 800, color: "#4f4f62", marginTop: 7, letterSpacing: 2 }}>
          {fileName}
        </div>
        <div style={{ fontSize: 12, fontWeight: 900, color: "#5f5f72", marginTop: 10, letterSpacing: 2 }}>
          {isScheduledMode
            ? `SCHEDULED REVIEW · ${scheduleStats.due} DUE · ${scheduleStats.total} SAVED`
            : "ENDLESS RANDOM"}
        </div>
        <div style={{ fontSize: 12, fontWeight: 800, color: "#555", marginTop: 9 }}>
          CARD {idx + 1} · SOLVED {solvedCount}
        </div>
        {card?.source === "scheduled" && (
          <div style={{ fontSize: 12, fontWeight: 900, color: "#f59e0b", marginTop: 6, letterSpacing: 2 }}>
            REVIEW CARD
          </div>
        )}
        <div style={{ fontSize: 11, fontWeight: 800, color: "#444", marginTop: 6 }}>
          HISTORY: {history.length}
        </div>
      </div>

      {/* Card */}
      <div style={{
        width: "100%",
        maxWidth: 540,
        background: "#16161c",
        border: "1px solid #2a2a35",
        borderRadius: 12,
        padding: "30px 26px",
        marginBottom: 14,
      }}>
        {/* Prompt */}
        <div style={{ textAlign: "center", marginBottom: 26 }}>
          <div style={{ fontSize: 10, letterSpacing: 4, color: "#555", marginBottom: 16 }}>
            WHICH LETTERS FIT THE BLANK?
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: 10 }}>
            {card.display.split("").map((ch, i) => <WordTile key={i} ch={ch} />)}
          </div>
          <div style={{ fontSize: 11, color: "#444", letterSpacing: 2 }}>
            {found.size} / {card.answers.length} LETTERS FOUND
          </div>
        </div>

        {/* Input */}
        <div style={{
          display: "flex",
          gap: 10,
          marginBottom: 22,
          animation: shake ? "shake 0.4s ease" : "none",
        }}>
          <input
            type="text"
            maxLength={1}
            value={input}
            onChange={(e) => setInput(e.target.value.toUpperCase().replace(/[^A-Z]/g, ""))}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            disabled={done}
            placeholder="A–Z"
            style={{
              flex: 1,
              background: "#0f0f13",
              border: "1px solid #333",
              borderRadius: 8,
              padding: "13px 18px",
              fontSize: 22,
              fontWeight: 700,
              color: "#e8e4d8",
              letterSpacing: 4,
              textAlign: "center",
              outline: "none",
            }}
            autoFocus
          />
          <button
            onClick={handleSubmit}
            disabled={done}
            style={{
              background: done ? "#222" : "#4ade80",
              color: done ? "#444" : "#0f0f13",
              border: "none",
              borderRadius: 8,
              padding: "13px 22px",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: 2,
              cursor: done ? "not-allowed" : "pointer",
            }}
          >
            CHECK
          </button>
        </div>

        {/* Letter grid */}
        <div>
          <div style={{ fontSize: 10, letterSpacing: 3, color: "#444", marginBottom: 10 }}>
            VALID LETTERS FOUND
          </div>
          <LetterGrid found={found} answers={card.answers} showAnswers={showAnswers} pulse={pulse} />
        </div>

        {(done || showAnswers) && <AnswerList card={card} fourSet={fourSet} />}

        {done && (
          <div style={{
            marginTop: 18,
            padding: "13px 16px",
            background: "#0d2018",
            border: "1px solid #4ade80",
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}>
            <Check size={16} color="#4ade80" />
            <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, color: "#4ade80" }}>
              ALL {card.answers.length} LETTERS FOUND!
            </span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div style={{
        display: "flex",
        gap: 8,
        width: "100%",
        maxWidth: 540,
        flexWrap: "wrap",
      }}>
        {buttons.map((btn, i) => (
          <button
            key={i}
            onClick={btn.action}
            disabled={btn.disabled}
            style={{
              flex: 1,
              minWidth: 40,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "11px 6px",
              background: "#16161c",
              border: `1px solid ${btn.accent ? "#f59e0b" : "#2a2a35"}`,
              borderRadius: 8,
              color: btn.disabled ? "#333" : btn.accent ? "#f59e0b" : "#e8e4d8",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 1,
              cursor: btn.disabled ? "not-allowed" : "pointer",
            }}
          >
            {btn.content}
          </button>
        ))}
      </div>

      <div style={{
        marginTop: 16,
        fontSize: 12,
        fontWeight: 800,
        color: "#77788a",
        letterSpacing: 1.5,
        textAlign: "center",
        textTransform: "uppercase",
      }}>
        type a letter · press enter or check
      </div>
      {(accountError || accountMessage) && (
        <div style={{ marginTop: 10, fontSize: 11, color: accountError ? "#f87171" : "#4ade80", textAlign: "center" }}>
          {accountError || accountMessage}
        </div>
      )}
    </div>
  );
}
