"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Send, Image as ImageIcon, Loader2, Sparkles, X,
  Smile, Plus, Maximize2, Reply, AtSign, Check, CheckCheck,
  Mic, Search, Pin, PinOff, Trash2
} from "lucide-react";
import { FormattedAuthorName } from "@/components/GuestBadge";
import FormattedMessageContent from "@/components/FormattedMessageContent";
import ImageLightboxModal from "@/components/ImageLightboxModal";
import VoiceNoteRecorder from "@/components/VoiceNoteRecorder";
import VoiceNotePlayer from "@/components/VoiceNotePlayer";
import PinnedMessageBanner from "@/components/PinnedMessageBanner";
import DailyConfessionWidget from "@/components/DailyConfessionWidget";
import ChatSearchModal from "@/components/ChatSearchModal";
import DeleteMessageModal from "@/components/DeleteMessageModal";
import { worshipChimes } from "@/lib/audio/worshipChimes";

interface Reaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  profiles?: {
    full_name: string;
  };
}

interface ReplySnippet {
  id: string;
  senderName: string;
  content: string;
}

interface Message {
  id: string;
  channel_id: string;
  user_id: string;
  content: string;
  attachment_url?: string;
  audio_url?: string;
  audio_duration_seconds?: number;
  is_pinned?: boolean;
  is_deleted?: boolean;
  created_at: string;
  reply_to_id?: string;
  reply_snippet?: ReplySnippet;
  profiles?: {
    full_name: string;
    avatar_url?: string;
  };
  reactions?: Reaction[];
}

interface MemberProfile {
  id: string;
  full_name: string;
}

const COMMON_EMOJIS = [
  "🔥", "🙌", "🙏", "❤️", "👑", "🕊️",
  "✨", "😄", "🎉", "💡", "✝️", "📖",
  "👏", "💯", "🌟", "🛡️"
];

function getDayDividerLabel(isoDateString: string): string {
  const date = new Date(isoDateString);
  const now = new Date();
  
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) return "Today";

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isYesterday) return "Yesterday";

  const isCurrentYear = date.getFullYear() === now.getFullYear();
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: isCurrentYear ? undefined : "numeric",
  });
}

function getDayKey(isoDateString: string): string {
  const d = new Date(isoDateString);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export default function ChatChannel({
  channelId,
  channelName,
  onOpenBible,
}: {
  channelId: string;
  channelName: string;
  onOpenBible?: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isHost, setIsHost] = useState(false);

  // Modals & Controls
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeReactionMessageId, setActiveReactionMessageId] = useState<string | null>(null);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [deletingMessage, setDeletingMessage] = useState<Message | null>(null);

  // WhatsApp Quoted Reply state
  const [replyingTo, setReplyingTo] = useState<{ id: string; senderName: string; content: string } | null>(null);

  // @ Mention tagging state
  const [members, setMembers] = useState<MemberProfile[]>([]);
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");

  // Image Lightbox Modal state
  const [lightboxImageUrl, setLightboxImageUrl] = useState<string | null>(null);
  const [lightboxImageAlt, setLightboxImageAlt] = useState<string>("Shared image");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);
  const messageRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const supabase = createClient();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const jumpToMessage = (messageId: string) => {
    const el = messageRefs.current.get(messageId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("ring-2", "ring-amber-500", "scale-[1.01]");
      setTimeout(() => {
        el.classList.remove("ring-2", "ring-amber-500", "scale-[1.01]");
      }, 2000);
    }
  };

  useEffect(() => {
    async function initChat() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      // Load fellowship members and host status
      const { data: fellowshipData } = await supabase
        .from("channels")
        .select("fellowship_id, fellowships:fellowship_id(created_by)")
        .eq("id", channelId)
        .single();

      if (fellowshipData?.fellowship_id) {
        if ((fellowshipData as any).fellowships?.created_by === user?.id) {
          setIsHost(true);
        }

        const { data: memberData } = await supabase
          .from("fellowship_members")
          .select("user_id, role, profiles:user_id(id, full_name)")
          .eq("fellowship_id", fellowshipData.fellowship_id);

        if (memberData) {
          const userMember = memberData.find((m: any) => m.user_id === user?.id);
          if (userMember?.role === "host") setIsHost(true);

          const formattedMembers = memberData
            .map((m: any) => m.profiles)
            .filter(Boolean) as MemberProfile[];
          setMembers(formattedMembers);
        }
      }

      // Fetch initial messages with profiles
      const { data: msgs, error: msgError } = await supabase
        .from("messages")
        .select("*, profiles:user_id(full_name, avatar_url)")
        .eq("channel_id", channelId)
        .order("created_at", { ascending: true });

      if (!msgError && msgs) {
        const messageIds = msgs.map((m) => m.id);
        let allReactions: Reaction[] = [];

        if (messageIds.length > 0) {
          const { data: rxData } = await supabase
            .from("message_reactions")
            .select("*, profiles:user_id(full_name)")
            .in("message_id", messageIds);

          if (rxData) allReactions = rxData;
        }

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
            audio_url: payload.new.audio_url,
            audio_duration_seconds: payload.new.audio_duration_seconds,
            is_pinned: payload.new.is_pinned,
            is_deleted: payload.new.is_deleted,
            created_at: payload.new.created_at,
            reply_to_id: payload.new.reply_to_id,
            reply_snippet: payload.new.reply_snippet,
            profiles: profile || { full_name: "Believer" },
            reactions: [],
          };

          setMessages((prev) => [...prev, newMessage]);
          setTimeout(scrollToBottom, 100);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `channel_id=eq.${channelId}`,
        },
        (payload) => {
          setMessages((prev) =>
            prev.map((m) => (m.id === payload.new.id ? { ...m, ...payload.new } : m))
          );
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          setMessages((prev) => prev.filter((m) => m.id !== payload.old.id));
        }
      )
      .subscribe();

    // Subscribe to Realtime reactions
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputText(val);

    const cursor = e.target.selectionStart || 0;
    const textBeforeCursor = val.slice(0, cursor);
    const lastAtMatch = textBeforeCursor.match(/@([a-zA-Z0-9_ -]*)$/);

    if (lastAtMatch) {
      setMentionQuery(lastAtMatch[1].toLowerCase());
      setShowMentionSuggestions(true);
    } else {
      setShowMentionSuggestions(false);
    }
  };

  const handleSelectMention = (memberName: string) => {
    const cleanName = memberName.replace(/\s+/g, "");
    const updated = inputText.replace(/@[a-zA-Z0-9_ -]*$/, `@${cleanName} `);
    setInputText(updated);
    setShowMentionSuggestions(false);
    textInputRef.current?.focus();
  };

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
      const snippetToAttach = replyingTo ? { ...replyingTo } : undefined;
      const replyToId = replyingTo?.id;

      setInputText("");
      setReplyingTo(null);
      removeSelectedFile();
      setShowEmojiPicker(false);
      setShowMentionSuggestions(false);

      const { error } = await supabase.from("messages").insert({
        channel_id: channelId,
        user_id: currentUser.id,
        content: contentToSend,
        attachment_url: uploadedAttachmentUrl,
        reply_to_id: replyToId,
        reply_snippet: snippetToAttach,
      });

      if (error) throw error;
    } catch (err: any) {
      console.error("Failed to send message:", err);
    } finally {
      setSending(false);
    }
  };

  // Send Voice Note audio memo
  const handleSendVoiceNote = async (audioBlob: Blob, durationSeconds: number) => {
    if (!currentUser) return;
    try {
      const formData = new FormData();
      formData.append("file", audioBlob, `voice-note-${Date.now()}.webm`);

      const uploadRes = await fetch("/api/cloudinary/upload", {
        method: "POST",
        body: formData,
      });

      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.error || "Failed to upload voice note");

      await supabase.from("messages").insert({
        channel_id: channelId,
        user_id: currentUser.id,
        content: "🎙️ Spoken Prayer / Voice Note",
        audio_url: uploadData.url,
        audio_duration_seconds: durationSeconds,
      });

      setShowVoiceRecorder(false);
    } catch (err: any) {
      console.error("Failed to upload audio note:", err);
      alert(err.message || "Failed to upload audio prayer");
    }
  };

  const handleToggleReaction = async (messageId: string, emoji: string) => {
    if (!currentUser) return;
    setActiveReactionMessageId(null);

    // Play angelic harmonic audio chime for worship emojis
    worshipChimes.playChime(
      emoji.includes("🔥") ? "glory" : emoji.includes("🙌") ? "amen" : emoji.includes("👑") ? "rejoice" : "spirit"
    );

    const targetMsg = messages.find((m) => m.id === messageId);
    const existingReaction = targetMsg?.reactions?.find(
      (r) => r.user_id === currentUser.id && r.emoji === emoji
    );

    if (existingReaction) {
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

  const handleTogglePin = async (messageId: string, currentPinStatus: boolean = false) => {
    try {
      await supabase
        .from("messages")
        .update({ is_pinned: !currentPinStatus })
        .eq("id", messageId);

      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, is_pinned: !currentPinStatus } : m))
      );
    } catch (err) {
      console.error("Failed to pin message:", err);
    }
  };

  // WhatsApp Message Deletion
  const handleDeleteForEveryone = async (messageId: string) => {
    try {
      await supabase
        .from("messages")
        .update({
          is_deleted: true,
          content: "🚫 This message was deleted",
          attachment_url: null,
          audio_url: null,
        })
        .eq("id", messageId);

      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? {
                ...m,
                is_deleted: true,
                content: "🚫 This message was deleted",
                attachment_url: undefined,
                audio_url: undefined,
              }
            : m
        )
      );
    } catch (err) {
      console.error("Failed to delete message for everyone:", err);
    }
  };

  const handleDeleteForMe = (messageId: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
  };

  const insertEmojiIntoInput = (emoji: string) => {
    setInputText((prev) => prev + emoji);
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

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

  const pinnedMessage = messages.find((m) => m.is_pinned);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-900/40 text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
      </div>
    );
  }

  const filteredMembers = members.filter((m) =>
    m.full_name.toLowerCase().includes(mentionQuery)
  );

  return (
    <div className="flex-1 flex flex-col justify-between h-full bg-slate-900/30 overflow-hidden pb-16 md:pb-0 relative">
      {/* Daily Scripture & Confession Card Widget */}
      <DailyConfessionWidget onOpenBible={onOpenBible} />

      {/* Pinned Message / Weekly Scripture Focus Banner */}
      {pinnedMessage && (
        <PinnedMessageBanner
          pinnedMessage={{
            id: pinnedMessage.id,
            content: pinnedMessage.content,
            senderName: pinnedMessage.profiles?.full_name,
          }}
          isHost={isHost}
          onUnpin={(id) => handleTogglePin(id, true)}
          onJumpToMessage={jumpToMessage}
        />
      )}

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-6 pt-3 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-2 text-slate-500 py-12">
            <Sparkles className="w-8 h-8 text-amber-500/40" />
            <p className="font-serif text-sm font-medium text-slate-400">
              Welcome to #{channelName.replace("-", " ")}
            </p>
            <p className="text-xs max-w-sm">
              Share words of encouragement, voice notes, and scripture reflections. Type <strong>@</strong> to mention brethren, or tap <strong>Reply</strong> on any message.
            </p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe = msg.user_id === currentUser?.id;
            const canDeleteForEveryone = isMe || isHost;
            const groupedRx = groupReactions(msg.reactions);

            // WhatsApp Day Divider Calculation
            const currentDayKey = getDayKey(msg.created_at);
            const prevDayKey = index > 0 ? getDayKey(messages[index - 1].created_at) : null;
            const isNewDay = currentDayKey !== prevDayKey;

            return (
              <div key={msg.id} className="space-y-4">
                {/* Centered WhatsApp-Style Day Divider Pill */}
                {isNewDay && (
                  <div className="flex items-center justify-center my-4 sticky top-1 z-10">
                    <span className="px-3.5 py-1 rounded-full bg-slate-950/90 border border-slate-800 text-[11px] font-semibold text-slate-300 shadow-xl backdrop-blur-md">
                      {getDayDividerLabel(msg.created_at)}
                    </span>
                  </div>
                )}

                <div
                  ref={(el) => {
                    if (el) messageRefs.current.set(msg.id, el);
                    else messageRefs.current.delete(msg.id);
                  }}
                  className={`flex items-start gap-2.5 group relative transition-all duration-300 rounded-2xl p-0.5 ${
                    isMe ? "flex-row-reverse" : ""
                  }`}
                >
                  {/* User Avatar */}
                  <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 shadow-sm">
                    {msg.profiles?.full_name?.charAt(0).toUpperCase() || "U"}
                  </div>

                  <div className={`max-w-xl space-y-1 ${isMe ? "items-end text-right" : ""}`}>
                    {/* Author Header with Stylized Guest Badge & Pin Indicator */}
                    <div className={`flex items-center gap-2 text-xs ${isMe ? "justify-end" : ""}`}>
                      <FormattedAuthorName
                        name={msg.profiles?.full_name}
                        className={`font-semibold ${isMe ? "text-amber-300" : "text-slate-300"}`}
                      />
                      {msg.is_pinned && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[10px] font-semibold">
                          <Pin className="w-2.5 h-2.5" /> Pinned
                        </span>
                      )}
                      <span className="text-[10px] text-slate-500 font-mono">{formatTime(msg.created_at)}</span>
                    </div>

                    {/* Message Bubble Container */}
                    <div className="relative inline-block text-left max-w-full">
                      <div
                        className={`p-3 rounded-2xl text-sm leading-relaxed space-y-2 shadow-md ${
                          msg.is_deleted
                            ? "bg-slate-900/60 border border-slate-800 text-slate-500 italic"
                            : isMe
                            ? "bg-gradient-to-br from-amber-600/25 to-amber-700/20 border border-amber-500/40 text-amber-100 rounded-tr-none"
                            : "bg-slate-800/90 border border-slate-700/80 text-slate-200 rounded-tl-none"
                        }`}
                      >
                        {/* WhatsApp-Style Quoted Snippet if Replying */}
                        {!msg.is_deleted && msg.reply_snippet && (
                          <div className="p-2 pl-2.5 rounded-xl bg-slate-950/60 border-l-4 border-amber-400 text-xs space-y-0.5 mb-1.5 opacity-90 shadow-inner">
                            <span className="font-bold text-amber-400 text-[11px]">
                              {msg.reply_snippet.senderName}
                            </span>
                            <p className="text-slate-300 truncate text-[11px]">
                              {msg.reply_snippet.content}
                            </p>
                          </div>
                        )}

                        {/* Deleted Message text or Normal Content */}
                        {msg.is_deleted ? (
                          <p className="text-xs text-slate-500 italic flex items-center gap-1.5">
                            <span>🚫</span>
                            <span>This message was deleted</span>
                          </p>
                        ) : msg.audio_url ? (
                          /* Voice Note Player (if audio message) */
                          <VoiceNotePlayer
                            audioUrl={msg.audio_url}
                            durationSeconds={msg.audio_duration_seconds}
                            isMe={isMe}
                          />
                        ) : (
                          /* Rich Formatted Content with @mentions, bold, quotes, links */
                          <FormattedMessageContent
                            content={msg.content}
                            className={isMe ? "text-amber-100" : "text-slate-200"}
                          />
                        )}

                        {/* Image Attachment with Lightbox Trigger & Download */}
                        {!msg.is_deleted && msg.attachment_url && (
                          <div className="pt-1.5 relative group/img">
                            <div
                              onClick={() => {
                                setLightboxImageUrl(msg.attachment_url!);
                                setLightboxImageAlt(msg.content || "Attached image");
                              }}
                              className="block rounded-xl overflow-hidden border border-slate-700/80 hover:border-amber-500/50 cursor-pointer transition relative shadow-lg"
                            >
                              <img
                                src={msg.attachment_url}
                                alt="Attachment"
                                className="max-h-72 w-full object-cover rounded-xl group-hover/img:scale-[1.01] transition-transform duration-200"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950/90 text-amber-400 text-xs font-semibold shadow-xl border border-amber-500/40">
                                  <Maximize2 className="w-3.5 h-3.5" />
                                  <span>View & Download</span>
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Timestamp & Delivery status bottom right */}
                        <div className="flex items-center justify-end gap-1 pt-0.5 text-[9px] text-slate-400 font-mono opacity-80">
                          <span>{formatTime(msg.created_at)}</span>
                          {isMe && <CheckCheck className="w-3 h-3 text-amber-400 inline" />}
                        </div>
                      </div>

                      {/* Quick Action Popover Button on Hover (Reply, Pin, Trash, React) */}
                      {!msg.is_deleted && (
                        <div
                          className={`absolute -top-3 ${
                            isMe ? "left-0 -translate-x-full pl-2" : "right-0 translate-x-full pr-2"
                          } opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 z-10`}
                        >
                          {/* WhatsApp-style Reply Button */}
                          <button
                            type="button"
                            onClick={() => {
                              setReplyingTo({
                                id: msg.id,
                                senderName: msg.profiles?.full_name || "Believer",
                                content: msg.content,
                              });
                              textInputRef.current?.focus();
                            }}
                            title="Reply to this message"
                            className="p-1.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 hover:text-amber-400 hover:border-amber-500/50 hover:bg-slate-700 shadow-md transition cursor-pointer"
                          >
                            <Reply className="w-3.5 h-3.5" />
                          </button>

                          {/* Host Pin Toggle Button */}
                          {isHost && (
                            <button
                              type="button"
                              onClick={() => handleTogglePin(msg.id, !!msg.is_pinned)}
                              title={msg.is_pinned ? "Unpin message" : "Pin message to top"}
                              className="p-1.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 hover:text-amber-400 hover:border-amber-500/50 hover:bg-slate-700 shadow-md transition cursor-pointer"
                            >
                              {msg.is_pinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
                            </button>
                          )}

                          {/* WhatsApp Delete Button */}
                          <button
                            type="button"
                            onClick={() => setDeletingMessage(msg)}
                            title="Delete message (for everyone or for me)"
                            className="p-1.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 hover:text-rose-400 hover:border-rose-500/50 hover:bg-slate-700 shadow-md transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Emoji React Button */}
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
                      )}

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
                    {!msg.is_deleted && groupedRx.length > 0 && (
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

      {/* WhatsApp-Style Quoted Reply Preview Banner above input */}
      {replyingTo && (
        <div className="mx-2 sm:mx-4 px-3.5 py-2.5 bg-slate-900 border-l-4 border-amber-500 border-t border-r border-slate-800 rounded-t-2xl flex items-center justify-between shadow-lg">
          <div className="space-y-0.5 min-w-0 pr-2">
            <div className="flex items-center gap-1 text-xs font-bold text-amber-400">
              <Reply className="w-3 h-3" />
              <span>Replying to {replyingTo.senderName}</span>
            </div>
            <p className="text-[11px] text-slate-300 truncate max-w-md">
              {replyingTo.content}
            </p>
          </div>
          <button
            onClick={() => setReplyingTo(null)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* @ Mention Autocomplete Suggestions Drawer */}
      {showMentionSuggestions && filteredMembers.length > 0 && (
        <div className="mx-2 sm:mx-4 mb-1 p-2 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl z-30 max-h-48 overflow-y-auto space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1 flex items-center gap-1 border-b border-slate-800">
            <AtSign className="w-3 h-3 text-amber-400" /> Mention Member
          </p>
          {filteredMembers.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => handleSelectMention(m.full_name)}
              className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-amber-500/10 hover:text-amber-300 text-slate-200 text-xs font-medium transition cursor-pointer text-left"
            >
              <div className="w-6 h-6 rounded-full bg-slate-800 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold text-[10px] shrink-0">
                {m.full_name.charAt(0).toUpperCase()}
              </div>
              <span className="truncate">{m.full_name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Emoji Picker Drawer */}
      {showEmojiPicker && (
        <div
          ref={emojiPickerRef}
          className="mx-2 sm:mx-4 mb-2 p-3 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl z-20 space-y-2"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 pb-1 border-b border-slate-800">
            <span className="font-semibold text-slate-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Kingdom & Worship Emojis
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

      {/* Voice Note Active Recorder View */}
      {showVoiceRecorder ? (
        <div className="p-2.5 sm:p-4 bg-slate-950 border-t border-slate-800">
          <VoiceNoteRecorder
            onSendAudio={handleSendVoiceNote}
            onCancel={() => setShowVoiceRecorder(false)}
          />
        </div>
      ) : (
        /* Standard Message Input Box — 100% responsive, Send button always visible */
        <div className="p-2.5 sm:p-4 bg-slate-950 border-t border-slate-800/80">
          <form onSubmit={handleSendMessage} className="flex items-center gap-1.5 sm:gap-2 max-w-4xl mx-auto w-full">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*"
              className="hidden"
            />

            {/* Attach Image */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Attach image"
              className="p-2 sm:p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-amber-400 hover:border-amber-500/40 transition cursor-pointer shrink-0"
            >
              <ImageIcon className="w-4 h-4" />
            </button>

            {/* Record Spoken Prayer / Voice Note */}
            <button
              type="button"
              onClick={() => setShowVoiceRecorder(true)}
              title="Record Voice Note / Spoken Prayer"
              className="p-2 sm:p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-500/40 transition cursor-pointer shrink-0"
            >
              <Mic className="w-4 h-4" />
            </button>

            {/* In-Chat Search */}
            <button
              type="button"
              onClick={() => setShowSearchModal(true)}
              title="Search chat messages & scriptures"
              className="p-2 sm:p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-amber-400 hover:border-amber-500/40 transition cursor-pointer shrink-0 hidden xs:inline-flex"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Kingdom Emojis */}
            <button
              type="button"
              onClick={() => setShowEmojiPicker((prev) => !prev)}
              title="Insert Kingdom Emoji"
              className={`p-2 sm:p-2.5 rounded-xl bg-slate-900 border transition cursor-pointer shrink-0 ${
                showEmojiPicker
                  ? "border-amber-500 text-amber-400 bg-amber-500/10"
                  : "border-slate-800 text-slate-400 hover:text-amber-400 hover:border-amber-500/40"
              }`}
            >
              <Smile className="w-4 h-4" />
            </button>

            {/* Text Input */}
            <input
              ref={textInputRef}
              type="text"
              value={inputText}
              onChange={handleInputChange}
              placeholder={`Message #${channelName.replace("-", " ")}...`}
              className="flex-1 min-w-0 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/80 transition"
            />

            {/* Send Button — always clearly visible with high contrast */}
            <button
              type="submit"
              disabled={(!inputText.trim() && !selectedFile) || sending}
              title="Send Message"
              className="p-2 sm:px-3.5 sm:py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 transition disabled:opacity-30 cursor-pointer shrink-0 font-bold flex items-center justify-center shadow-lg shadow-amber-950/40"
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4 fill-current" />
              )}
            </button>
          </form>
        </div>
      )}

      {/* Image Lightbox Viewer Modal with Direct Download to Computer */}
      {lightboxImageUrl && (
        <ImageLightboxModal
          imageUrl={lightboxImageUrl}
          imageAlt={lightboxImageAlt}
          onClose={() => setLightboxImageUrl(null)}
        />
      )}

      {/* In-Chat Message Search Modal */}
      <ChatSearchModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        messages={messages}
        onSelectMessage={jumpToMessage}
      />

      {/* WhatsApp Message Deletion Modal */}
      {deletingMessage && (
        <DeleteMessageModal
          isOpen={!!deletingMessage}
          onClose={() => setDeletingMessage(null)}
          canDeleteForEveryone={deletingMessage.user_id === currentUser?.id || isHost}
          onDeleteForEveryone={() => handleDeleteForEveryone(deletingMessage.id)}
          onDeleteForMe={() => handleDeleteForMe(deletingMessage.id)}
        />
      )}
    </div>
  );
}
