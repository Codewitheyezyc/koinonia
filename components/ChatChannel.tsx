"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Send, Image as ImageIcon, Paperclip, Loader2, Sparkles, X } from "lucide-react";

interface Message {
  id: string;
  channel_id: string;
  user_id: string;
  content: string;
  attachment_url?: string;
  created_at: string;
  profiles?: {
    full_name: string;
    avatar_url?: string;
  };
}

export default function ChatChannel({
  channelId,
  channelName,
}: {
  channelId: string;
  channelName: string;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    async function initChat() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      // Fetch initial messages with profiles
      const { data, error } = await supabase
        .from("messages")
        .select("*, profiles:user_id(full_name, avatar_url)")
        .eq("channel_id", channelId)
        .order("created_at", { ascending: true });

      if (!error && data) {
        setMessages(data);
      }
      setLoading(false);
      setTimeout(scrollToBottom, 100);
    }

    initChat();

    // Subscribe to Supabase Realtime Postgres Changes
    const channelName = `realtime-messages:${channelId}-${Math.random().toString(36).substring(2, 7)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `channel_id=eq.${channelId}`,
        },
        async (payload) => {
          // Fetch user profile for the new message
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, avatar_url")
            .eq("id", payload.new.user_id)
            .single();

          const newMessage: Message = {
            id: payload.new.id,
            channel_id: payload.new.channel_id,
            user_id: payload.new.user_id,
            content: payload.new.content,
            attachment_url: payload.new.attachment_url,
            created_at: payload.new.created_at,
            profiles: profile || { full_name: "Believer" },
          };

          setMessages((prev) => [...prev, newMessage]);
          setTimeout(scrollToBottom, 100);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [channelId, supabase]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!inputText.trim() && !selectedFile) || sending || !currentUser) return;

    setSending(true);
    let uploadedAttachmentUrl: string | undefined = undefined;

    try {
      // Upload attachment to Cloudinary if file selected
      if (selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);

        const uploadRes = await fetch("/api/cloudinary/upload", {
          method: "POST",
          body: formData,
        });

        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error || "Failed to upload image");

        uploadedAttachmentUrl = uploadData.url;
      }

      const contentToSend = inputText.trim() || "Shared an attachment";
      setInputText("");
      removeSelectedFile();

      const { error } = await supabase.from("messages").insert({
        channel_id: channelId,
        user_id: currentUser.id,
        content: contentToSend,
        attachment_url: uploadedAttachmentUrl,
      });

      if (error) throw error;
    } catch (err: any) {
      console.error("Failed to send message:", err);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-900/40 text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col justify-between h-full bg-slate-900/30 overflow-hidden pb-16 md:pb-0">
      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 pt-4 sm:pt-6 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-2 text-slate-500">
            <Sparkles className="w-8 h-8 text-amber-500/40" />
            <p className="font-serif text-sm font-medium text-slate-400">
              Welcome to #{channelName.replace("-", " ")}
            </p>
            <p className="text-xs max-w-sm">
              This is the beginning of fellowship chatter. Share words of encouragement, scripture reflections, and prayer notes.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.user_id === currentUser?.id;
            return (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${isMe ? "flex-row-reverse" : ""}`}
              >
                <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  {msg.profiles?.full_name?.charAt(0).toUpperCase() || "U"}
                </div>

                <div className={`max-w-md space-y-1 ${isMe ? "items-end text-right" : ""}`}>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-semibold text-slate-300">
                      {msg.profiles?.full_name || "Believer"}
                    </span>
                    <span className="text-[10px] text-slate-500">{formatTime(msg.created_at)}</span>
                  </div>

                  <div
                    className={`p-3 rounded-2xl text-sm leading-relaxed space-y-2 ${
                      isMe
                        ? "bg-amber-600/20 border border-amber-500/30 text-amber-100 rounded-tr-none"
                        : "bg-slate-800/80 border border-slate-700/80 text-slate-200 rounded-tl-none"
                    }`}
                  >
                    <div>{msg.content}</div>

                    {msg.attachment_url && (
                      <div className="pt-1">
                        <a
                          href={msg.attachment_url}
                          target="_blank"
                          rel="noreferrer"
                          className="block rounded-lg overflow-hidden border border-slate-700/80 hover:opacity-90 transition"
                        >
                          <img
                            src={msg.attachment_url}
                            alt="Attachment"
                            className="max-h-60 w-full object-cover rounded-lg"
                          />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Attachment Preview Overlay */}
      {previewUrl && (
        <div className="px-4 py-2 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={previewUrl} alt="Preview" className="w-10 h-10 object-cover rounded-lg border border-slate-700" />
            <span className="text-xs text-slate-300 truncate max-w-xs">{selectedFile?.name}</span>
          </div>
          <button
            onClick={removeSelectedFile}
            className="p-1 rounded-full text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Message Input Box */}
      <div className="p-4 bg-slate-950 border-t border-slate-800/80">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2 max-w-4xl mx-auto">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*"
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Attach image or file"
            className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-amber-400 hover:border-amber-500/40 transition cursor-pointer shrink-0"
          >
            <ImageIcon className="w-4 h-4" />
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Message #${channelName.replace("-", " ")}...`}
            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/80 transition"
          />

          <button
            type="submit"
            disabled={(!inputText.trim() && !selectedFile) || sending}
            className="p-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 transition disabled:opacity-40 cursor-pointer shrink-0"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </form>
      </div>
    </div>
  );
}
