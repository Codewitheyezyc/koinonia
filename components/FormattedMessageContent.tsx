"use client";

import React from "react";
import { ExternalLink } from "lucide-react";

interface FormattedMessageContentProps {
  content: string;
  className?: string;
}

/**
 * Enhanced Message Formatter that parses and styles:
 * - @mentions with glowing amber badge pills
 * - Scripture blockquotes (starting with > or ")
 * - Bulleted lists (- , * , • )
 * - Numbered lists (1. , 2. )
 * - Bold (** or __), Italic (* or _), Inline Code (`)
 * - Clickable URLs
 * - Multiline line-breaks preserved
 */
export default function FormattedMessageContent({
  content,
  className = "text-sm text-slate-200 leading-relaxed whitespace-pre-wrap break-words",
}: FormattedMessageContentProps) {
  if (!content) return null;

  // Split text by lines to parse blocks while preserving line breaks
  const lines = content.split("\n");

  const renderFormattedLine = (line: string, lineIndex: number) => {
    // 1. Scripture blockquote (lines starting with >)
    if (line.trim().startsWith(">")) {
      const cleanQuote = line.trim().replace(/^>\s*/, "");
      return (
        <div
          key={lineIndex}
          className="my-1.5 pl-3 py-1 border-l-2 border-amber-500/60 bg-amber-500/5 rounded-r-lg text-amber-200/90 italic font-serif text-xs sm:text-sm"
        >
          {parseInlineFormatting(cleanQuote)}
        </div>
      );
    }

    // 2. Bullet list line
    if (line.trim().startsWith("- ") || line.trim().startsWith("• ") || line.trim().startsWith("* ")) {
      const cleanBullet = line.trim().replace(/^[-•*]\s*/, "");
      return (
        <div key={lineIndex} className="flex items-start gap-2 my-0.5 pl-2 text-xs sm:text-sm">
          <span className="text-amber-400 font-bold leading-5">•</span>
          <span className="flex-1">{parseInlineFormatting(cleanBullet)}</span>
        </div>
      );
    }

    // 3. Numbered list line (e.g., "1. ")
    const numMatch = line.trim().match(/^(\d+)\.\s+(.*)/);
    if (numMatch) {
      return (
        <div key={lineIndex} className="flex items-start gap-2 my-0.5 pl-2 text-xs sm:text-sm">
          <span className="text-amber-400 font-bold text-xs leading-5 font-mono">{numMatch[1]}.</span>
          <span className="flex-1">{parseInlineFormatting(numMatch[2])}</span>
        </div>
      );
    }

    // 4. Header lines (# or ##)
    if (line.trim().startsWith("### ")) {
      return (
        <h4 key={lineIndex} className="font-serif font-bold text-amber-300 text-sm mt-2 mb-1">
          {parseInlineFormatting(line.trim().replace(/^###\s*/, ""))}
        </h4>
      );
    }
    if (line.trim().startsWith("## ") || line.trim().startsWith("# ")) {
      return (
        <h3 key={lineIndex} className="font-serif font-bold text-slate-100 text-base mt-2 mb-1">
          {parseInlineFormatting(line.trim().replace(/^#+\s*/, ""))}
        </h3>
      );
    }

    // 5. Standard line with inline formatting
    return (
      <div key={lineIndex} className="min-h-[1.25rem]">
        {parseInlineFormatting(line)}
      </div>
    );
  };

  return <div className={className}>{lines.map(renderFormattedLine)}</div>;
}

/**
 * Parses @mentions, bold, italic, code, and URLs
 */
function parseInlineFormatting(text: string): React.ReactNode[] {
  if (!text) return [];

  // Regex matches:
  // 1. URLs: https?://\S+
  // 2. Mentions: @[a-zA-Z0-9_ -]+ or @\w+
  // 3. Bold: \*\*(.*?)\*\* or __(.*?)__
  // 4. Inline code: `(.*?)`
  // 5. Italic: \*(.*?)\* or _(.*?)_
  const regex = /(https?:\/\/[^\s]+)|(@[a-zA-Z0-9_.-]+)|(\*\*|__)(.*?)\3|(`)(.*?)\5|(\*|_)(.*?)\7/g;

  const elements: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      elements.push(text.slice(lastIndex, match.index));
    }

    const [fullMatch, url, mention, , boldText, , codeText, , italicText] = match;

    if (url) {
      elements.push(
        <a
          key={match.index}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-0.5 text-amber-400 hover:text-amber-300 underline font-medium break-all transition"
        >
          <span>{url}</span>
          <ExternalLink className="w-3 h-3 inline-block shrink-0" />
        </a>
      );
    } else if (mention) {
      elements.push(
        <span
          key={match.index}
          className="inline-flex items-center px-1.5 py-0.5 mx-0.5 rounded-md bg-gradient-to-r from-amber-500/20 to-amber-600/20 border border-amber-500/40 text-amber-300 font-semibold text-xs shadow-sm hover:border-amber-400 cursor-pointer"
        >
          {mention}
        </span>
      );
    } else if (boldText !== undefined) {
      elements.push(
        <strong key={match.index} className="font-bold text-slate-50">
          {boldText}
        </strong>
      );
    } else if (codeText !== undefined) {
      elements.push(
        <code
          key={match.index}
          className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700/80 font-mono text-[11px] text-amber-300"
        >
          {codeText}
        </code>
      );
    } else if (italicText !== undefined) {
      elements.push(
        <em key={match.index} className="italic text-slate-300">
          {italicText}
        </em>
      );
    }

    lastIndex = match.index + fullMatch.length;
  }

  if (lastIndex < text.length) {
    elements.push(text.slice(lastIndex));
  }

  return elements;
}
