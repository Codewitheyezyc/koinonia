"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Send, Image as ImageIcon, Loader2, Sparkles, X,
  Smile, Plus, Heart, Flame
} from "lucide-react";
import { FormattedAuthorName } from "@/components/GuestBadge";

interface Reaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  profiles?: {
    full_name: string;
  };
}

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
  reactions?: Reaction[];
}

const COMMON_EMOJIS = [
  "🔥", "🙌", "🙏", "❤️", "👑", "🕊️",
  "✨", "😄", "🎉", "💡", "✝️", "📖",
  "👏", "💯", "🌟", "🛡️"
];

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
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeReactionMessageId, setActiveReactionMessageId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    async function initChat() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      // 1. Fetch initial messages with profiles
      const { data: msgs, error: msgError } = await supabase
        .from("messages")
        .select("*, profiles:user_id(full_name, avatar_url)")
        .eq("channel_id", channelId)
        .order("created_at", { ascending: true });

      if (!msgError && msgs) {
        // 2. Fetch reactions for these messages
        const messageIds = msgs.map((m) => m.id);
        let allReactions: Reaction[] = [];

        if (messageIds.length > 0) {
          const { data: rxData } = await supabase
            .from("message_reactions")
            .select("*, profiles:user_id(full_name)")
            .in("message_id", messageIds);

          if (rxData) allReactions = rxData;
        }

        // Attach reactions to messages
        const messagesWithRx = msgs.map((m) => ({
          ...m,
          reactions: allReactions.filter((r) => r.message_id === m.id),
        }));

        setMessages(messagesWithRx);
      }
      setLoading(false);
      setTimeout(scrollToBottom, 100);
    }

    initChat();

    // Subscribe to Realtime messages
    const msgChannelName = `realtime-msgs:${channelId}-${Math.random().toString(36).substring(2, 7)}`;
    const msgSubscription = supabase
      .channel(msgChannelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `channel_id=eq.${channelId}`,
        },
        async (payload) => {
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
            reactions: [],
          };

          setMessages((prev) => [...prev, newMessage]);
          setTimeout(scrollToBottom, 100);
        }
      )
      .subscribe();

    // Subscribe to Realtime message reactions
    const rxChannelName = `realtime-rx:${channelId}-${Math.random().toString(36).substring(2, 7)}`;
    const rxSubscription = supabase
      .channel(rxChannelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "message_reactions",
        },
        async (payload) => {
          if (payload.eventType === "INSERT") {
            const { data: profile } = await supabase
              .from("profiles")
              .select("full_name")
              .eq("id", payload.new.user_id)
              .single();

            const newRx: Reaction = {
              id: payload.new.id,
              message_id: payload.new.message_id,
              user_id: payload.new.user_id,
              emoji: payload.new.emoji,
              profiles: profile || { full_name: "Believer" },
            };

            setMessages((prev) =>
              prev.map((msg) => {
                if (msg.id === newRx.message_id) {
                  const exists = msg.reactions?.some((r) => r.id === newRx.id);
                  return exists
                    ? msg
                    : { ...msg, reactions: [...(msg.reactions || []), newRx] };
                }
                return msg;
              })
            );
          } else if (payload.eventType === "DELETE") {
            const deletedId = payload.old.id;
            setMessages((prev) =>
              prev.map((msg) => ({
                ...msg,
                reactions: msg.reactions?.filter((r) => r.id !== deletedId) || [],
              }))
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(msgSubscription);
      supabase.removeChannel(rxSubscription);
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
      setShowEmojiPicker(false);

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

  // Toggle or add reaction to a message
  const handleToggleReaction = async (messageId: string, emoji: string) => {
    if (!currentUser) return;
    setActiveReactionMessageId(null);

    const targetMsg = messages.find((m) => m.id === messageId);
    const existingReaction = targetMsg?.reactions?.find(
      (r) => r.user_id === currentUser.id && r.emoji === emoji
    );

    if (existingReaction) {
      // Optimistic delete
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id === messageId) {
            return {
              ...msg,
              reactions: msg.reactions?.filter((r) => r.id !== existingReaction.id) || [],
            };
          }
          return msg;
        })
      );

      await supabase
        .from("message_reactions")
        .delete()
        .eq("id", existingReaction.id);
    } else {
      // Optimistic insert
      const tempId = `temp-${Date.now()}`;
      const tempRx: Reaction = {
        id: tempId,
        message_id: messageId,
        user_id: currentUser.id,
        emoji,
        profiles: { full_name: currentUser.email || "You" },
      };

      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id === messageId) {
            return {
              ...msg,
              reactions: [...(msg.reactions || []), tempRx],
            };
          }
          return msg;
        })
      );

      const { data: savedRx } = await supabase
        .from("message_reactions")
        .insert({
          message_id: messageId,
          user_id: currentUser.id,
          emoji,
        })
        .select()
        .single();

      if (savedRx) {
        setMessages((prev) =>
          prev.map((msg) => {
            if (msg.id === messageId) {
              return {
                ...msg,
                reactions: msg.reactions?.map((r) => (r.id === tempId ? savedRx : r)) || [],
              };
            }
            return msg;
          })
        );
      }
    }
  };

  const insertEmojiIntoInput = (emoji: string) => {
    setInputText((prev) => prev + emoji);
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Group reactions by emoji
  const groupReactions = (reactions: Reaction[] = []) => {
    const map = new Map<string, { count: number; users: string[]; hasReacted: boolean }>();
    reactions.forEach((r) => {
      const existing = map.get(r.emoji) || { count: 0, users: [], hasReacted: false };
      existing.count += 1;
      if (r.profiles?.full_name) existing.users.push(r.profiles.full_name);
      if (currentUser && r.user_id === currentUser.id) existing.hasReacted = true;
      map.set(r.emoji, existing);
    });
    return Array.from(map.entries()).map(([emoji, data]) => ({ emoji, ...data }));
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-900/40 text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col justify-between h-full bg-slate-900/30 overflow-hidden pb-16 md:pb-0 relative">
      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 pt-4 sm:pt-6 space-y-5">
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
            const groupedRx = groupReactions(msg.reactions);

            return (
              <div
                key={msg.id}
                className={`flex items-start gap-3 group relative ${isMe ? "flex-row-reverse" : ""}`}
              >
                {/* User Avatar */}
                <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 shadow-sm">
                  {msg.profiles?.full_name?.charAt(0).toUpperCase() || "U"}
                </div>

                <div className={`max-w-md space-y-1.5 ${isMe ? "items-end text-right" : ""}`}>
                  {/* Author Header with Stylized Guest Badge */}
                  <div className={`flex items-center gap-2 text-xs ${isMe ? "justify-end" : ""}`}>
                    <FormattedAuthorName
                      name={msg.profiles?.full_name}
                      className={`font-semibold ${isMe ? "text-amber-300" : "text-slate-300"}`}
                    />
                    <span className="text-[10px] text-slate-500">{formatTime(msg.created_at)}</span>
                  </div>

                  {/* Message Bubble Container */}
                  <div className="relative inline-block text-left">
                    <div
                      className={`p-3.5 rounded-2xl text-sm leading-relaxed space-y-2 shadow-md ${
                        isMe
                          ? "bg-gradient-to-br from-amber-600/25 to-amber-700/20 border border-amber-500/40 text-amber-100 rounded-tr-none"
                          : "bg-slate-800/90 border border-slate-700/80 text-slate-200 rounded-tl-none"
                      }`}
                    >
                      <div className="whitespace-pre-wrap break-words">{msg.content}</div>

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

                    {/* Quick Reaction Action Button on Hover */}
                    <div
                      className={`absolute -top-3 ${
                        isMe ? "left-0 -translate-x-full pl-2" : "right-0 translate-x-full pr-2"
                      } opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 z-10`}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setActiveReactionMessageId(
                            activeReactionMessageId === msg.id ? null : msg.id
                          )
                        }
                        title="React with Emoji"
                        className="p-1.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 hover:text-amber-400 hover:border-amber-500/50 hover:bg-slate-700 shadow-md transition cursor-pointer"
                      >
                        <Smile className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Quick Reaction Popover Menu */}
                    {activeReactionMessageId === msg.id && (
                      <div
                        className={`absolute -top-12 ${
                          isMe ? "right-0" : "left-0"
                        } z-30 flex items-center gap-1 p-1.5 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-100`}
                      >
                        {COMMON_EMOJIS.slice(0, 7).map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => handleToggleReaction(msg.id, emoji)}
                            className="p-1 hover:scale-125 hover:bg-slate-800 rounded-lg text-base transition-transform cursor-pointer"
                          >
                            {emoji}
                          </button>
                        ))}
                        <button
                          onClick={() => setActiveReactionMessageId(null)}
                          className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition cursor-pointer ml-0.5"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Reaction Badges / Pills under message */}
                  {groupedRx.length > 0 && (
                    <div className={`flex flex-wrap gap-1.5 pt-1 ${isMe ? "justify-end" : ""}`}>
                      {groupedRx.map((rx) => (
                        <button
                          key={rx.emoji}
                          onClick={() => handleToggleReaction(msg.id, rx.emoji)}
                          title={`${rx.users.join(", ")} reacted with ${rx.emoji}`}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border transition cursor-pointer ${
                            rx.hasReacted
                              ? "bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-sm"
                              : "bg-slate-800/80 border-slate-700/80 text-slate-300 hover:border-slate-600"
                          }`}
                        >
                          <span>{rx.emoji}</span>
                          <span className="text-[11px] font-bold">{rx.count}</span>
                        </button>
                      ))}

                      {/* Add reaction plus button */}
                      <button
                        onClick={() =>
                          setActiveReactionMessageId(
                            activeReactionMessageId === msg.id ? null : msg.id
                          )
                        }
                        className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-800/60 border border-slate-700/60 text-slate-400 hover:text-amber-400 hover:border-amber-500/40 text-xs transition cursor-pointer"
                        title="Add reaction"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  )}
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
            className="p-1 rounded-full text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Emoji Picker Drawer for Input Bar */}
      {showEmojiPicker && (
        <div
          ref={emojiPickerRef}
          className="mx-4 mb-2 p-3 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl z-20 space-y-2"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 pb-1 border-b border-slate-800">
            <span className="font-semibold text-slate-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Kingdom & Faith Emojis
            </span>
            <button
              onClick={() => setShowEmojiPicker(false)}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-8 gap-2 max-h-40 overflow-y-auto pt-1">
            {COMMON_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => insertEmojiIntoInput(emoji)}
                className="p-2 text-lg rounded-xl hover:bg-slate-800 hover:scale-125 transition cursor-pointer flex items-center justify-center"
              >
                {emoji}
              </button>
            ))}
          </div>
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
            title="Attach image"
            className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-amber-400 hover:border-amber-500/40 transition cursor-pointer shrink-0"
          >
            <ImageIcon className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setShowEmojiPicker((prev) => !prev)}
            title="Insert Emoji"
            className={`p-3 rounded-xl bg-slate-900 border transition cursor-pointer shrink-0 ${
              showEmojiPicker
                ? "border-amber-500 text-amber-400 bg-amber-500/10"
                : "border-slate-800 text-slate-400 hover:text-amber-400 hover:border-amber-500/40"
            }`}
          >
            <Smile className="w-4 h-4" />
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
            className="p-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 transition disabled:opacity-40 cursor-pointer shrink-0 font-bold"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </form>
      </div>
    </div>
  );
}
