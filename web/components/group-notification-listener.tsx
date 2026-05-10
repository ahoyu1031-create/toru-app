"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useMentions } from "./mention-context";

export function GroupNotificationListener({
  groups,
  myDisplayName,
}: {
  groups: { id: string; name: string }[];
  myDisplayName: string;
}) {
  const { addMention } = useMentions();
  const addMentionRef = useRef(addMention);
  addMentionRef.current = addMention;

  useEffect(() => {
    if (!groups.length || !myDisplayName) return;

    const supabase = createClient();
    const channels = groups.map((group) => {
      const ch = supabase
        .channel(`global-notif-${group.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "group_messages",
            filter: `group_id=eq.${group.id}`,
          },
          (payload) => {
            const msg = payload.new as { body?: string; user_id?: string };
            if (msg.body && myDisplayName && msg.body.includes(`@${myDisplayName}`)) {
              addMentionRef.current(group.id, group.name);
            }
          }
        );
      ch.subscribe((status) => {
        // サブスクリプション確立確認
        if (status === "SUBSCRIBED") {
          console.log(`[notif] subscribed to ${group.name} (${group.id})`);
        }
      });
      return ch;
    });

    return () => {
      channels.forEach((ch) => supabase.removeChannel(ch));
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groups.map((g) => g.id).join(","), myDisplayName]);

  return null;
}
