"use client";

import { createContext, useContext, useState } from "react";

type MentionNotif = { groupId: string; groupName: string; count: number };

const MentionContext = createContext<{
  mentions: MentionNotif[];
  addMention: (groupId: string, groupName: string) => void;
  clearMentions: () => void;
}>({ mentions: [], addMention: () => {}, clearMentions: () => {} });

export function MentionProvider({ children }: { children: React.ReactNode }) {
  const [mentions, setMentions] = useState<MentionNotif[]>([]);

  function addMention(groupId: string, groupName: string) {
    setMentions((prev) => {
      const existing = prev.find((m) => m.groupId === groupId);
      if (existing) {
        return prev.map((m) =>
          m.groupId === groupId ? { ...m, count: m.count + 1 } : m
        );
      }
      return [...prev, { groupId, groupName, count: 1 }];
    });
  }

  function clearMentions() {
    setMentions([]);
  }

  return (
    <MentionContext.Provider value={{ mentions, addMention, clearMentions }}>
      {children}
    </MentionContext.Provider>
  );
}

export function useMentions() {
  return useContext(MentionContext);
}
