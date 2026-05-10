import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-3 mb-6 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <div>
        <h1 className="text-2xl font-bold text-[color:var(--color-text)]">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-sm text-[color:var(--color-text-muted)]">
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
