"use client";

import { useState, useRef, useEffect } from "react";
import { ChatMessage } from "@/data/transactions";
import { generateChatResponse } from "@/lib/chat-engine";
import { renderFormattedText } from "@/lib/utils";
import { MessageCircle, Send } from "lucide-react";

interface Props {
  onSelectTx: (txId: string) => void;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    role: "assistant",
    text: "I'm your fraud analysis assistant. I can investigate flagged transactions, identify patterns across communities, and explain risk factors.\n\nTry asking about a specific transaction, or say **\"queue summary\"** to get started.",
  },
];

const QUICK_ACTIONS = [
  "Queue summary",
  "Show FAIL transactions",
  "Patterns in C-0042",
  "TX-9921002",
  "TX-6612847",
  "How does the model work?",
];

export default function ChatPanel({ onSelectTx }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const send = (text?: string) => {
    const msg = (text || input).trim();
    if (!msg) return;

    setMessages((prev) => [...prev, { role: "user", text: msg }]);
    setInput("");
    setIsTyping(true);

    const delay = 600 + Math.random() * 800;
    setTimeout(() => {
      const response = generateChatResponse(msg);
      setIsTyping(false);
      setMessages((prev) => [...prev, { role: "assistant", text: response.text }]);

      if (response.linkedTxId) {
        onSelectTx(response.linkedTxId);
      }
    }, delay);
  };

  const renderText = (text: string, isUser = false) => {
    return text.split("\n").map((line, lineIdx) => {
      if (!line.trim()) return <div key={lineIdx} className="h-2" />;

      const parts = renderFormattedText(line);
      return (
        <div key={lineIdx} className={line.startsWith("•") ? "ml-2 mb-0.5" : "mb-0.5"}>
          {parts.map((part, partIdx) =>
            part.type === "bold" ? (
              <span
                key={partIdx}
                className={`font-semibold ${isUser ? "text-white" : "text-gray-900"}`}
              >
                {part.content}
              </span>
            ) : (
              <span key={partIdx}>{part.content}</span>
            )
          )}
        </div>
      );
    });
  };

  return (
    <div className="w-[380px] flex flex-col flex-shrink-0 bg-white h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
          <MessageCircle className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="text-sm font-semibold text-gray-900">Fraud Assistant</span>
        <span className="text-2xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">AI</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto px-4 py-4 flex flex-col gap-3">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`max-w-[88%] animate-fade-in ${msg.role === "user" ? "self-end" : "self-start"}`}
          >
            <div
              className={`px-3.5 py-2.5 text-[13px] leading-relaxed ${
                msg.role === "user"
                  ? "bg-primary text-white rounded-2xl rounded-br-md"
                  : "bg-gray-50 text-gray-700 rounded-2xl rounded-bl-md border border-gray-200"
              }`}
            >
              {renderText(msg.text, msg.role === "user")}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="self-start animate-fade-in">
            <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-gray-50 border border-gray-200">
              <span className="inline-flex gap-1.5 items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "300ms" }} />
              </span>
            </div>
          </div>
        )}

        <div ref={endRef} />
      </div>

      {/* Quick actions */}
      <div className="px-4 py-2 flex gap-1.5 flex-wrap border-t border-gray-100">
        {QUICK_ACTIONS.map((q) => (
          <button
            key={q}
            onClick={() => send(q)}
            className="px-2.5 py-1 rounded-full text-2xs text-gray-600 border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-colors"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-gray-200 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
          placeholder="Ask about transactions, patterns..."
          className="flex-1 px-3.5 py-2 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
        />
        <button
          onClick={() => send()}
          className="px-3 py-2 rounded-lg bg-primary text-white hover:bg-[#1e293b] transition-colors flex items-center justify-center"
          aria-label="Send"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
