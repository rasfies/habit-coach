"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// InviteCodeDisplay
// ---------------------------------------------------------------------------

interface InviteCodeDisplayProps {
  code: string;
  groupName?: string;
  className?: string;
}

export function InviteCodeDisplay({
  code,
  groupName,
  className,
}: InviteCodeDisplayProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for browsers without clipboard API
      const el = document.createElement("textarea");
      el.value = code;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  async function handleCopyLink() {
    const url = `${window.location.origin}/groups/join?code=${code}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // silent fail
    }
  }

  return (
    <div
      className={cn(
        "rounded-xl bg-brand-50 px-5 py-4 ring-1 ring-brand-200",
        className
      )}
    >
      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-brand-600">
        Invite code
      </p>

      {/* Code display */}
      <div className="flex items-center gap-3">
        <div className="flex-1 rounded-lg bg-white px-4 py-3 ring-1 ring-brand-200">
          <span
            className="font-mono text-2xl font-bold tracking-[0.35em] text-brand-700"
            aria-label={`Invite code: ${code.split("").join(" ")}`}
          >
            {code}
          </span>
        </div>

        {/* Copy button */}
        <button
          type="button"
          onClick={handleCopy}
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-3.5 py-3 text-sm font-semibold transition-all",
            copied
              ? "bg-success-500 text-white"
              : "bg-brand-600 text-white hover:bg-brand-700"
          )}
          aria-label="Copy invite code"
        >
          {copied ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-4 w-4" aria-hidden="true">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4" aria-hidden="true">
                <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
              </svg>
              Copy
            </>
          )}
        </button>
      </div>

      {/* Helper text */}
      <p className="mt-2.5 text-xs text-brand-600">
        Share this code with friends to invite them
        {groupName ? ` to ${groupName}` : ""}.
        They can join at{" "}
        <button
          type="button"
          onClick={handleCopyLink}
          className="underline hover:text-brand-800 cursor-pointer"
          aria-label="Copy invite link"
        >
          Copy invite link
        </button>
      </p>
    </div>
  );
}

export default InviteCodeDisplay;
