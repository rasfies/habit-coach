"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CheckButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Whether the habit has been checked in today */
  checked: boolean;
  /** Called when the user taps/clicks to toggle the check state */
  onToggle: () => void;
  /** Disables interaction (e.g. optimistic update in flight) */
  disabled?: boolean;
  /** Additional CSS class names */
  className?: string;
}

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function CheckIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * CheckButton — the primary daily check-in tap target.
 *
 * States:
 *  - Unchecked: bordered circle, transparent fill. Hover shows green tint.
 *  - Checked: solid green fill, white checkmark, green glow shadow.
 *  - Disabled: 40% opacity, no pointer events.
 *
 * Animations:
 *  - check-in: brief scale pulse (200ms) on press
 *  - streak-pop: scale bounce when transitioning to checked
 *  - Smooth color/shadow transitions (200ms)
 *
 * Accessibility:
 *  - role="checkbox" with aria-checked
 *  - Focusable with visible ring
 *  - onKeyDown supports Enter and Space
 */
export function CheckButton({
  checked,
  onToggle,
  disabled = false,
  className,
  "aria-label": ariaLabel,
  ...rest
}: CheckButtonProps) {
  const [pressing, setPressing] = React.useState(false);

  function handleKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (!disabled) onToggle();
    }
  }

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={ariaLabel ?? (checked ? "Uncheck habit" : "Check in for today")}
      disabled={disabled}
      onClick={() => !disabled && onToggle()}
      onKeyDown={handleKeyDown}
      onMouseDown={() => setPressing(true)}
      onMouseUp={() => setPressing(false)}
      onMouseLeave={() => setPressing(false)}
      onTouchStart={() => setPressing(true)}
      onTouchEnd={() => setPressing(false)}
      className={cn(
        // Layout
        "relative flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full",
        // Transition
        "transition-all duration-200 ease-in-out",
        // Focus ring
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2",
        // --- Unchecked ---
        !checked && [
          "border-2 border-neutral-300 bg-transparent text-transparent",
          "hover:border-success-400 hover:bg-success-50 hover:text-success-400",
        ],
        // --- Checked ---
        checked && [
          "border-2 border-success-500 bg-success-500 text-white",
          "shadow-[0_0_12px_rgba(34,197,94,0.4)]",
        ],
        // --- Press feedback ---
        pressing && "scale-[0.90]",
        !pressing && checked && "animate-[streak-pop_400ms_cubic-bezier(0.34,1.56,0.64,1)]",
        // --- Disabled ---
        disabled && "cursor-not-allowed opacity-40",
        className
      )}
      {...rest}
    >
      {/* Checkmark icon — visible when checked or hovered */}
      <span
        className={cn(
          "transition-all duration-200",
          checked ? "opacity-100 scale-100" : "opacity-0 scale-75 group-hover:opacity-100"
        )}
      >
        <CheckIcon />
      </span>
    </button>
  );
}

export default CheckButton;
