"use client";

import { createContext, useContext, useState } from "react";

interface RightPanelCtx {
  open: boolean;
  toggle: () => void;
  hasUnread: boolean;
  setHasUnread: (v: boolean) => void;
}

const RightPanelContext = createContext<RightPanelCtx>({
  open: false,
  toggle: () => {},
  hasUnread: false,
  setHasUnread: () => {},
});

export function RightPanelProvider({
  children,
  initial = false,
}: {
  children: React.ReactNode;
  initial?: boolean;
}) {
  const [open, setOpen] = useState(initial);
  const [hasUnread, setHasUnread] = useState(false);
  return (
    <RightPanelContext.Provider
      value={{ open, toggle: () => setOpen((v) => !v), hasUnread, setHasUnread }}
    >
      {children}
    </RightPanelContext.Provider>
  );
}

export function useRightPanel() {
  return useContext(RightPanelContext);
}
