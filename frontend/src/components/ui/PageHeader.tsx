import React from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  /** Buttons rendered on the trailing edge. */
  actions?: React.ReactNode;
}

/** Standard page title block. Every admin page opens with this. */
export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold text-text">{title}</h1>
        {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
