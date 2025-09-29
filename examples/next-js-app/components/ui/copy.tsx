"use client";

import { Check as CheckIcon, Copy as CopyIcon } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

export interface CopyProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  children: React.ReactNode;
}

export const Copy = React.forwardRef<HTMLDivElement, CopyProps>(
  ({ className, value, children, onClick, ...props }, ref) => {
    const [copied, setCopied] = React.useState(false);

    const handleCopy = async (e: React.MouseEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();

      try {
        await navigator.clipboard.writeText(value);
        setCopied(true);

        // Reset the copied state after animation
        setTimeout(() => setCopied(false), 1500);
      } catch (err) {
        console.error("Failed to copy to clipboard:", err);
      }

      // Call the original onClick if provided
      onClick?.(e);
    };

    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex w-max items-center gap-2 cursor-pointer rounded-md transition-all duration-200",
          "hover:text-primary",
          "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          className,
        )}
        onClick={handleCopy}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleCopy(e as unknown as React.MouseEvent<HTMLDivElement>);
          }
        }}
        {...props}
      >
        <span className="select-none">{children}</span>
        <div className="relative">
          <CopyIcon
            className={cn(
              "h-4 w-4 transition-all duration-300 ease-in-out",
              copied
                ? "opacity-0 rotate-180"
                : "scale-100 opacity-100 rotate-0",
            )}
          />
          <CheckIcon
            className={cn(
              "absolute inset-0 h-4 w-4 transition-all duration-300 ease-in-out text-green-600",
              copied
                ? "scale-100 opacity-100 rotate-0"
                : "scale-0 opacity-0 rotate-180",
            )}
          />
        </div>
      </div>
    );
  },
);
Copy.displayName = "Copy";
