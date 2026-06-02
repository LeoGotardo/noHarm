import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Send } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useMessages } from "@/hooks/api/useChats";
import { useChats } from "@/hooks/api/useChats";
import { useMe } from "@/hooks/api/useUser";
import { socket } from "@/hooks/webSocket/useWebSocket";
import { useQueryClient } from "@tanstack/react-query";

interface Message {
  id: string;
  chat: string;
  sender: string;
  message: string;
  status: number;
  send_at: string | null;
  recived_at: string | null;
  created_at: string;
  updated_at: string;
}

const ChatScreen = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const friendId = searchParams.get("friend") ?? "";
  const qc = useQueryClient();

  const { data: me } = useMe();
  const { data: chatsData } = useChats();
  const chats = chatsData?.chats ?? [];

  const chat = chats.find(
    (c) => String(c.sender) === friendId || String(c.reciver) === friendId
  );
  const chatId = chat?.id ?? "";

  const { data: messagesData } = useMessages(chatId);
  const messages: Message[] = messagesData?.messages ?? [];

  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!chatId) return;

    socket.emit("join_chat", { chatId });

    socket.on("new_message", (payload: { message: Message }) => {
      qc.setQueryData<{ messages: Message[]; total: number }>(
        ["messages", chatId],
        (old) => {
          if (!old) return { messages: [payload.message], total: 1 };
          const exists = old.messages.some((m) => m.id === payload.message.id);
          if (exists) return old;
          return { messages: [...old.messages, payload.message], total: old.total + 1 };
        }
      );
    });

    return () => {
      socket.emit("leave_chat", { chatId });
      socket.off("new_message");
    };
  }, [chatId, qc]);

  const send = () => {
    if (!input.trim() || !chatId) return;
    socket.emit("send_message", { chatId, content: input.trim() });
    setInput("");
  };

  if (!friendId) {
    return (
      <AppLayout title={t("nav.chat")}>
        <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
          {t("chat.noChat")}
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title={t("nav.chat")}>
      <div className="flex flex-col h-[calc(100vh-11rem)]">
        <div className="flex-1 overflow-y-auto space-y-2.5 pb-4 pr-1">
          {messages.map((msg) => {
            const isMe = msg.sender === me?.id?.toString();
            return (
              <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[78%] px-4 py-2.5 text-[13px] leading-relaxed ${
                    isMe
                      ? "bg-primary text-primary-foreground rounded-2xl rounded-br-sm"
                      : "glass-card rounded-2xl rounded-bl-sm"
                  }`}
                >
                  <p>{msg.message}</p>
                  <p className={`text-[9px] mt-1 ${isMe ? "text-primary-foreground/40" : "text-muted-foreground/60"}`}>
                    {msg.send_at ?? msg.created_at}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        <div className="flex items-center gap-2 pt-3 border-t border-border/20">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder={t("chat.placeholder")}
            className="flex-1 bg-card text-foreground placeholder:text-muted-foreground/50 rounded-2xl px-4 py-2.5 text-sm outline-none border border-border/30 focus:border-primary/30 transition-all"
          />
          <button
            onClick={send}
            className="w-10 h-10 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shrink-0 hover:opacity-90 transition-all duration-200"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </AppLayout>
  );
};

export default ChatScreen;
