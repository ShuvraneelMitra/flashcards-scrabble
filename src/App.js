import { useState, useCallback, useRef } from "react";
import {
  Check,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  Shuffle,
  Upload,
} from "lucide-react";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

function parseWordList(text, len) {
  const words = new Set();

  text.split(/\s+/).forEach((w) => {
    const clean = w
      .trim()
      .toUpperCase()
      .replace(/[^A-Z]/g, "");

    if (clean.length === len) {
      words.add(clean);
    }
  });

  return words;
}

function findValidLetters(wordSet, word, blankPos) {
  const valid = [];

  for (const letter of ALPHABET) {
    const candidate =
      word.slice(0, blankPos) +
      letter +
      word.slice(blankPos + 1);

    if (wordSet.has(candidate)) {
      valid.push(letter);
    }
  }

  return valid;
}

function getFrontHooks(word, fourSet) {
  const hooks = [];

  for (const letter of ALPHABET) {
    if (fourSet.has(letter + word)) {
      hooks.push(letter);
    }
  }

  return hooks.join("");
}

function getBackHooks(word, fourSet) {
  const hooks = [];

  for (const letter of ALPHABET) {
    if (fourSet.has(word + letter)) {
      hooks.push(letter);
    }
  }

  return hooks.join("");
}

function generateCard(
  wordSet,
  fourSet,
  usedKeys = new Set()
) {
  const words = [...wordSet];

  let attempts = 0;

  while (attempts < 300) {
    const word =
      words[Math.floor(Math.random() * words.length)];

    const pos = Math.floor(
      Math.random() * word.length
    );

    const key = `${word}-${pos}`;

    if (usedKeys.has(key)) {
      attempts++;
      continue;
    }

    const valid = findValidLetters(
      wordSet,
      word,
      pos
    );

    if (valid.length >= 2) {
      const display = [...word]
        .map((c, i) => (i === pos ? "_" : c))
        .join("");

      return {
        key,
        display,
        pos,
        baseWord: word,
        answers: valid,

        frontHooks: getFrontHooks(
          word,
          fourSet
        ),

        backHooks: getBackHooks(
          word,
          fourSet
        ),
      };
    }

    attempts++;
  }

  return null;
}

function UploadScreen({ onLoad }) {
  const [dragging3, setDragging3] = useState(false);
  const [dragging4, setDragging4] = useState(false);

  const [threeFile, setThreeFile] = useState(null);
  const [fourFile, setFourFile] = useState(null);

  const [error, setError] = useState("");

  const threeInputRef = useRef();
  const fourInputRef = useRef();

  const parseFile = (file, len) =>
    new Promise((resolve) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        resolve(
          parseWordList(e.target.result, len)
        );
      };

      reader.readAsText(file);
    });

  const loadBoth = async () => {
    if (!threeFile || !fourFile) {
      setError(
        "Please upload both 3-letter and 4-letter wordlists."
      );

      return;
    }

    const threeSet = await parseFile(
      threeFile,
      3
    );

    const fourSet = await parseFile(
      fourFile,
      4
    );

    if (
      threeSet.size < 10 ||
      fourSet.size < 10
    ) {
      setError("Invalid wordlists.");
      return;
    }

    onLoad({
      threeSet,
      fourSet,
      threeName: threeFile.name,
      fourName: fourFile.name,
    });
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0f0f13",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Courier New', monospace",
        color: "#e8e4d8",
        padding: 24,
      }}
    >
      <div
        style={{
          fontSize: 11,
          letterSpacing: 6,
          color: "#555",
          marginBottom: 8,
        }}
      >
        COLLINS SCRABBLE WORDS
      </div>

      <div
        style={{
          fontSize: 26,
          fontWeight: 700,
          letterSpacing: 2,
          marginBottom: 40,
        }}
      >
        3-Letter Fill-In
      </div>

      <div
        style={{
          width: "100%",
          maxWidth: 460,
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        {/* 3 LETTER */}
        <div>
          <div
            style={{
              fontSize: 11,
              color: "#555",
              letterSpacing: 2,
              marginBottom: 8,
            }}
          >
            3-LETTER WORDLIST
          </div>

          <div
            onClick={() =>
              threeInputRef.current.click()
            }
            onDragOver={(e) => {
              e.preventDefault();
              setDragging3(true);
            }}
            onDragLeave={() =>
              setDragging3(false)
            }
            onDrop={(e) => {
              e.preventDefault();

              setDragging3(false);

              setThreeFile(
                e.dataTransfer.files[0]
              );
            }}
            style={{
              border: `2px dashed ${
                dragging3
                  ? "#4ade80"
                  : "#333"
              }`,
              borderRadius: 12,
              padding: "42px 24px",
              textAlign: "center",
              cursor: "pointer",
              background: dragging3
                ? "#0d2018"
                : "#16161c",
              transition: "all 0.2s",
            }}
          >
            <Upload
              size={28}
              color={
                dragging3
                  ? "#4ade80"
                  : "#444"
              }
              style={{ marginBottom: 14 }}
            />

            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: 2,
                marginBottom: 8,
              }}
            >
              DROP 3-LIST HERE
            </div>

            <div
              style={{
                fontSize: 11,
                color: "#555",
              }}
            >
              {threeFile
                ? threeFile.name
                : "or click to browse"}
            </div>

            <input
              ref={threeInputRef}
              type="file"
              accept=".txt"
              style={{ display: "none" }}
              onChange={(e) =>
                setThreeFile(
                  e.target.files[0]
                )
              }
            />
          </div>
        </div>

        {/* 4 LETTER */}
        <div>
          <div
            style={{
              fontSize: 11,
              color: "#555",
              letterSpacing: 2,
              marginBottom: 8,
            }}
          >
            4-LETTER WORDLIST
          </div>

          <div
            onClick={() =>
              fourInputRef.current.click()
            }
            onDragOver={(e) => {
              e.preventDefault();
              setDragging4(true);
            }}
            onDragLeave={() =>
              setDragging4(false)
            }
            onDrop={(e) => {
              e.preventDefault();

              setDragging4(false);

              setFourFile(
                e.dataTransfer.files[0]
              );
            }}
            style={{
              border: `2px dashed ${
                dragging4
                  ? "#4ade80"
                  : "#333"
              }`,
              borderRadius: 12,
              padding: "42px 24px",
              textAlign: "center",
              cursor: "pointer",
              background: dragging4
                ? "#0d2018"
                : "#16161c",
              transition: "all 0.2s",
            }}
          >
            <Upload
              size={28}
              color={
                dragging4
                  ? "#4ade80"
                  : "#444"
              }
              style={{ marginBottom: 14 }}
            />

            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: 2,
                marginBottom: 8,
              }}
            >
              DROP 4-LIST HERE
            </div>

            <div
              style={{
                fontSize: 11,
                color: "#555",
              }}
            >
              {fourFile
                ? fourFile.name
                : "or click to browse"}
            </div>

            <input
              ref={fourInputRef}
              type="file"
              accept=".txt"
              style={{ display: "none" }}
              onChange={(e) =>
                setFourFile(
                  e.target.files[0]
                )
              }
            />
          </div>
        </div>

        <button
          onClick={loadBoth}
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
            fontFamily:
              "'Courier New', monospace",
          }}
        >
          LOAD WORDLISTS
        </button>

        {error && (
          <div
            style={{
              color: "#f87171",
              fontSize: 12,
              textAlign: "center",
              marginTop: 4,
            }}
          >
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

function Game({
  wordSet,
  fourSet,
  fileName,
  onReset,
}) {
  const usedRef = useRef(new Set());

  const firstCard = generateCard(
    wordSet,
    fourSet,
    usedRef.current
  );

  if (firstCard) {
    usedRef.current.add(firstCard.key);
  }

  const [history, setHistory] = useState(
    firstCard ? [firstCard] : []
  );

  const [idx, setIdx] = useState(0);

  const card = history[idx];

  const [found, setFound] = useState(
    new Set()
  );

  const [input, setInput] = useState("");

  const [shake, setShake] =
    useState(false);

  const [pulse, setPulse] =
    useState(null);

  const [done, setDone] = useState(false);

  const [showAnswers, setShowAnswers] =
    useState(false);

  const [solvedCount, setSolvedCount] =
    useState(0);

  const resetCardState = useCallback(() => {
    setFound(new Set());
    setInput("");
    setDone(false);
    setShowAnswers(false);
  }, []);

  const nextCard = useCallback(() => {
    if (idx < history.length - 1) {
      setIdx((v) => v + 1);

      resetCardState();

      return;
    }

    let next = generateCard(
      wordSet,
      fourSet,
      usedRef.current
    );

    if (!next) {
      usedRef.current.clear();

      next = generateCard(
        wordSet,
        fourSet,
        usedRef.current
      );
    }

    if (next) {
      usedRef.current.add(next.key);

      setHistory((prev) => [
        ...prev,
        next,
      ]);

      setIdx((prev) => prev + 1);

      resetCardState();
    }
  }, [
    idx,
    history.length,
    wordSet,
    fourSet,
    resetCardState,
  ]);

  const prevCard = () => {
    if (idx > 0) {
      setIdx((v) => v - 1);

      resetCardState();
    }
  };

  const handleSubmit = () => {
    const letter = input
      .trim()
      .toUpperCase();

    if (
      letter.length !== 1 ||
      !/[A-Z]/.test(letter)
    ) {
      setInput("");
      return;
    }

    if (found.has(letter)) {
      setInput("");
      return;
    }

    if (card.answers.includes(letter)) {
      const next = new Set(found);

      next.add(letter);

      setFound(next);

      setPulse(letter);

      setTimeout(() => {
        setPulse(null);
      }, 400);

      setInput("");

      if (next.size === card.answers.length) {
        setDone(true);

        setSolvedCount((v) => v + 1);
      }
    } else {
      setShake(true);

      setTimeout(() => {
        setShake(false);
      }, 400);

      setInput("");
    }
  };

  const parts = card.display.split("");

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0f0f13",
        fontFamily: "'Courier New', monospace",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
        color: "#e8e4d8",
      }}
    >
      <style>{`
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
      `}</style>

      <div
        style={{
          textAlign: "center",
          marginBottom: 24,
        }}
      >
        <div
          style={{
            fontSize: 11,
            letterSpacing: 6,
            color: "#555",
            marginBottom: 6,
          }}
        >
          COLLINS SCRABBLE WORDS
        </div>

        <div
          style={{
            fontSize: 24,
            fontWeight: 700,
            letterSpacing: 2,
          }}
        >
          3-Letter Fill-In
        </div>

        <div
          style={{
            fontSize: 10,
            color: "#3a3a4a",
            marginTop: 5,
            letterSpacing: 2,
          }}
        >
          {fileName}
        </div>

        <div
          style={{
            fontSize: 10,
            color: "#444",
            marginTop: 8,
          }}
        >
          CARD {idx + 1} · SOLVED{" "}
          {solvedCount}
        </div>

        <div
          style={{
            fontSize: 10,
            color: "#333",
            marginTop: 4,
          }}
        >
          HISTORY: {history.length}
        </div>
      </div>

      <div
        style={{
          width: "100%",
          maxWidth: 540,
          background: "#16161c",
          border: "1px solid #2a2a35",
          borderRadius: 12,
          padding: "30px 26px",
          marginBottom: 14,
        }}
      >
        <div
          style={{
            textAlign: "center",
            marginBottom: 26,
          }}
        >
          <div
            style={{
              fontSize: 10,
              letterSpacing: 4,
              color: "#555",
              marginBottom: 16,
            }}
          >
            WHICH LETTERS FIT THE BLANK?
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 10,
              marginBottom: 10,
            }}
          >
            {parts.map((ch, i) => (
              <div
                key={i}
                style={{
                  width: 64,
                  height: 70,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 38,
                  fontWeight: 700,
                  borderRadius: 6,
                  background:
                    ch === "_"
                      ? "#0f0f13"
                      : "#1e1e28",
                  border:
                    ch === "_"
                      ? "2px dashed #4a4a5a"
                      : "2px solid #2a2a38",
                  color:
                    ch === "_"
                      ? "#4ade80"
                      : "#e8e4d8",
                }}
              >
                {ch}
              </div>
            ))}
          </div>

          <div
            style={{
              fontSize: 11,
              color: "#444",
              letterSpacing: 2,
            }}
          >
            {found.size} /{" "}
            {card.answers.length} LETTERS
            FOUND
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 10,
            marginBottom: 22,
            animation: shake
              ? "shake 0.4s ease"
              : "none",
          }}
        >
          <input
            type="text"
            maxLength={1}
            value={input}
            onChange={(e) =>
              setInput(
                e.target.value
                  .toUpperCase()
                  .replace(/[^A-Z]/g, "")
              )
            }
            onKeyDown={(e) =>
              e.key === "Enter" &&
              handleSubmit()
            }
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
              background: done
                ? "#222"
                : "#4ade80",
              color: done
                ? "#444"
                : "#0f0f13",
              border: "none",
              borderRadius: 8,
              padding: "13px 22px",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: 2,
              cursor: done
                ? "not-allowed"
                : "pointer",
            }}
          >
            CHECK
          </button>
        </div>

        <div>
          <div
            style={{
              fontSize: 10,
              letterSpacing: 3,
              color: "#444",
              marginBottom: 10,
            }}
          >
            VALID LETTERS FOUND
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 7,
            }}
          >
            {ALPHABET.map((letter) => {
              const isFound =
                found.has(letter);

              const revealed =
                showAnswers &&
                card.answers.includes(
                  letter
                ) &&
                !isFound;

              return (
                <div
                  key={letter}
                  style={{
                    width: 34,
                    height: 34,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    fontWeight: 700,
                    borderRadius: 4,
                    border: isFound
                      ? "1px solid #4ade80"
                      : revealed
                      ? "1px solid #f59e0b"
                      : "1px solid #222",
                    background: isFound
                      ? "#14291e"
                      : revealed
                      ? "#2a1f08"
                      : "#0f0f13",
                    color: isFound
                      ? "#4ade80"
                      : revealed
                      ? "#f59e0b"
                      : "#2a2a35",
                    animation:
                      pulse === letter
                        ? "popIn 0.4s ease"
                        : "none",
                  }}
                >
                  {isFound || revealed
                    ? letter
                    : "·"}
                </div>
              );
            })}
          </div>
        </div>

        {(done || showAnswers) && (
            <div
              style={{
                marginTop: 18,
                padding: "18px 16px",
                background: "#111",
                border: "1px solid #2a2a35",
                borderRadius: 8,
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              {card.answers.map((letter) => {
                const fullWord =
                  card.baseWord.slice(0, card.pos) +
                  letter +
                  card.baseWord.slice(card.pos + 1);

                const frontHooks =
                  getFrontHooks(fullWord, fourSet);

                const backHooks =
                  getBackHooks(fullWord, fourSet);

                return (
                  <div
                    key={fullWord}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily:
                        "'Courier New', monospace",
                      fontWeight: 700,
                      fontSize: 24,
                      letterSpacing: 3,
                      lineHeight: 1.2,
                    }}
                  >
                    <div
                      style={{
                        width: 180,
                        textAlign: "right",
                        color: "#60a5fa",
                        overflow: "hidden",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {frontHooks || "—"}
                    </div>

                    <div
                      style={{
                        width: 120,
                        textAlign: "center",
                        color: "#e8e4d8",
                      }}
                    >
                      {fullWord}
                    </div>

                    <div
                      style={{
                        width: 180,
                        textAlign: "left",
                        color: "#f59e0b",
                        overflow: "hidden",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {backHooks || "—"}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        {done && (
          <div
            style={{
              marginTop: 18,
              padding: "13px 16px",
              background: "#0d2018",
              border: "1px solid #4ade80",
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <Check
              size={16}
              color="#4ade80"
            />

            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: 2,
                color: "#4ade80",
              }}
            >
              ALL {card.answers.length} LETTERS
              FOUND!
            </span>
          </div>
        )}
      </div>

      <div
        style={{
          display: "flex",
          gap: 8,
          width: "100%",
          maxWidth: 540,
          flexWrap: "wrap",
        }}
      >
        {[
          {
            content: (
              <ChevronLeft size={15} />
            ),
            action: prevCard,
            disabled: idx === 0,
          },

          {
            content: (
              <ChevronRight size={15} />
            ),
            action: nextCard,
          },

          {
            content: (
              <RotateCcw size={15} />
            ),
            action: resetCardState,
          },

          {
            content: showAnswers
              ? "HIDE"
              : "REVEAL",

            action: () =>
              setShowAnswers((v) => !v),

            accent: showAnswers,
          },

          {
            content: (
              <>
                <Shuffle size={13} />

                <span
                  style={{
                    marginLeft: 5,
                  }}
                >
                  RESET POOL
                </span>
              </>
            ),

            action: () => {
              usedRef.current.clear();
            },
          },

          {
            content: "CHANGE FILE",
            action: onReset,
          },
        ].map((btn, i) => (
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
              border: `1px solid ${
                btn.accent
                  ? "#f59e0b"
                  : "#2a2a35"
              }`,
              borderRadius: 8,
              color: btn.disabled
                ? "#333"
                : btn.accent
                ? "#f59e0b"
                : "#e8e4d8",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 1,
              cursor: btn.disabled
                ? "not-allowed"
                : "pointer",
            }}
          >
            {btn.content}
          </button>
        ))}
      </div>

      <div
        style={{
          marginTop: 14,
          fontSize: 10,
          color: "#2a2a35",
          letterSpacing: 1,
          textAlign: "center",
        }}
      >
        type a letter · press enter or
        check
      </div>
    </div>
  );
}

export default function App() {
  const [threeSet, setThreeSet] =
    useState(null);

  const [fourSet, setFourSet] =
    useState(null);

  const [threeName, setThreeName] =
    useState("");

  const [fourName, setFourName] =
    useState("");

  if (!threeSet || !fourSet) {
    return (
      <UploadScreen
        onLoad={({
          threeSet,
          fourSet,
          threeName,
          fourName,
        }) => {
          setThreeSet(threeSet);
          setFourSet(fourSet);

          setThreeName(threeName);
          setFourName(fourName);
        }}
      />
    );
  }

  return (
    <Game
      wordSet={threeSet}
      fourSet={fourSet}
      fileName={`${threeName} + ${fourName}`}
      onReset={() => {
        setThreeSet(null);
        setFourSet(null);
      }}
    />
  );
}