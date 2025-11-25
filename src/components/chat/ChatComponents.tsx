import { useState, useEffect } from "react";
import TrubankLogo from "../../logo/trubank-hrms-icon.png";

export interface ChatMessage {
  sender: "user" | "bot";
  text: string;
}

export interface ChatBoxProps {
  messages: ChatMessage[];
  onSend: (message: ChatMessage) => void;
  loading?: boolean;
  onMinimize?: () => void;
  userId?: number;
}

export function ChatBox({
  messages,
  onSend,
  loading,
  onMinimize,
  userId,
}: ChatBoxProps) {
  const [input, setInput] = useState("");
  const [userInfo, setUserInfo] = useState<any>(null);
  const [, setQuestions] = useState<any[]>([]);

  useEffect(() => {
    if (userId) {
      fetch(`http://localhost:3001/api/employees/${userId}`)
        .then((res) => res.json())
        .then((data) => setUserInfo(data))
        .catch(() => setUserInfo(null));
    }
  }, [userId]);

  useEffect(() => {
    fetch("http://localhost:3001/api/set_questions")
      .then((res) => res.json())
      .then((data) => setQuestions(Array.isArray(data) ? data : []))
      .catch(() => setQuestions([]));
  }, []);

  // Simple Levenshtein distance for fuzzy matching
  // (Removed unused function to fix compile error)

  const handleSend = () => {
    if (!input.trim() || loading) return;
    setInput("");
    onSend({ sender: "user", text: input });
  };

  return (
    <div
      className="w-80 bg-white dark:bg-gray-800 shadow-2xl rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col"
      style={{ minHeight: 520 }}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 rounded-t-xl bg-green-600">
        <span className="flex items-center gap-2">
          <span className="rounded-full w-7 h-7 flex items-center justify-center">
            <img
              src={TrubankLogo}
              alt="Trubank Logo"
              className="w-6 h-6"
              style={{ background: "transparent" }}
            />
          </span>
          <span className="text-white font-bold">Support Chat</span>
        </span>
        {onMinimize && (
          <button
            className="text-white hover:text-gray-200 text-lg font-bold px-2"
            onClick={onMinimize}
            aria-label="Minimize chat"
            title="Minimize"
          >
            &#8212;
          </button>
        )}
      </div>
      {/* Show user info if available */}
      {userInfo && (
        <div className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
          <div>
            User:{" "}
            <span className="font-semibold">
              {userInfo.firstname} {userInfo.lastname}
            </span>
          </div>
          <div>
            ID: <span className="font-mono">{userInfo.idNumber}</span>
          </div>
        </div>
      )}
      <div
        className="flex-1 px-4 py-3 overflow-y-auto"
        style={{ maxHeight: 400 }}
      >
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`mb-2 flex ${
              msg.sender === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`px-3 py-2 rounded-lg text-sm max-w-[70%] ${
                msg.sender === "user"
                  ? "bg-green-100 text-green-900"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600"
              }`}
              style={{
                boxShadow:
                  msg.sender === "bot"
                    ? "0 1px 4px rgba(0,0,0,0.07)"
                    : undefined,
              }}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="mb-2 flex justify-start">
            <div className="px-3 py-2 rounded-lg text-sm max-w-[70%] bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 animate-pulse">
              ...
            </div>
          </div>
        )}
      </div>
      <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex gap-2 bg-gray-50 dark:bg-gray-900 rounded-b-xl">
        <input
          type="text"
          className="flex-1 rounded border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:outline-none"
          placeholder="Ask a question..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !loading) handleSend();
          }}
          disabled={loading}
        />
        <button
          className={`px-4 py-2 rounded bg-green-600 text-white font-semibold hover:bg-green-700 ${
            loading ? "opacity-60 cursor-not-allowed" : ""
          }`}
          onClick={handleSend}
          disabled={loading}
        >
          Send
        </button>
      </div>
      <div className="text-center text-xs text-gray-400 py-2">
        Powered by TRUBANK
      </div>
    </div>
  );
}

export interface ChatButtonProps {
  onClick: () => void;
}

export function ChatButton({ onClick }: ChatButtonProps) {
  return (
    <button
      className="w-16 h-16 rounded-full bg-green-600 shadow-lg flex items-center justify-center text-white text-2xl font-bold hover:bg-green-700 transition"
      onClick={onClick}
      aria-label="Open chat"
    >
      <span
        className="rounded-full w-10 h-10 flex items-center justify-center mr-1 p-0"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <img
          src={TrubankLogo}
          alt="Trubank Logo"
          className="w-7 h-7 block"
          style={{ margin: "auto", display: "block" }}
        />
      </span>
    </button>
  );
}
