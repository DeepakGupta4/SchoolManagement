"use client";

import React from "react";
import * as RadixTooltip from "@radix-ui/react-tooltip";

export function TooltipProvider({ children }: { children: React.ReactNode }) {
  return (
    <RadixTooltip.Provider delayDuration={300} skipDelayDuration={300}>
      {children}
    </RadixTooltip.Provider>
  );
}

interface TooltipProps {
  content: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  children: React.ReactNode;
}

export function Tooltip({ content, side = "right", children }: TooltipProps) {
  return (
    <RadixTooltip.Root>
      <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
      <RadixTooltip.Portal>
        <RadixTooltip.Content
          side={side}
          sideOffset={8}
          className="z-60 rounded-md border border-border bg-surface-raised px-2.5 py-1.5 text-xs font-medium text-text shadow-lg"
          style={{ animation: "overlay-in var(--duration-fast) var(--ease-out)" }}
        >
          {content}
          <RadixTooltip.Arrow className="fill-[var(--surface-raised)]" />
        </RadixTooltip.Content>
      </RadixTooltip.Portal>
    </RadixTooltip.Root>
  );
}
