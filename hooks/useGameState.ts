import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export function useGameState() {
  const [game, setGame] = useState<any>(null);

  useEffect(() => {
    // 1. Get initial state
    supabase
      .from("game_config")
      .select("*")
      .single()
      .then(({ data }) => setGame(data));

    // 2. Subscribe to changes
    const channel = supabase
      .channel("game_updates")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "game_config" },
        (payload) => setGame(payload.new),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return game;
}
