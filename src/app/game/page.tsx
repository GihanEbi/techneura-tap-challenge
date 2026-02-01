"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import TechNeuraLogo from "@/components/TechNeuraLogo";

function GameContent() {
  const searchParams = useSearchParams();
  const playerId = searchParams.get("id");

  const [status, setStatus] = useState("waiting");
  const [countdown, setCountdown] = useState(5);
  const [colorMode, setColorMode] = useState<"gold" | "black">("black");
  const [score, setScore] = useState(0);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [playerName, setPlayerName] = useState("");

  useEffect(() => {
    if (!playerId) return;

    // Fetch Player Info
    supabase
      .from("players")
      .select("nickname, score")
      .eq("id", playerId)
      .single()
      .then(({ data }) => {
        if (data) {
          setPlayerName(data.nickname);
          setScore(data.score);
        }
      });

    // Real-time Status & SYNCED Color Listener
    const statusChannel = supabase
      .channel("game_status")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "game_settings" },
        (payload) => {
          setStatus(payload.new.status);
          if (payload.new.color_mode) setColorMode(payload.new.color_mode); // SYNCED
        },
      )
      .subscribe();

    const leaderChannel = supabase
      .channel("leaderboard")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "players" },
        () => fetchLeaderboard(),
      )
      .subscribe();

    fetchLeaderboard();

    return () => {
      supabase.removeChannel(statusChannel);
      supabase.removeChannel(leaderChannel);
    };
  }, [playerId]);

  const fetchLeaderboard = async () => {
    const { data } = await supabase
      .from("players")
      .select("nickname, score")
      .order("score", { ascending: false })
      .limit(5);
    if (data) setLeaderboard(data);
  };

  useEffect(() => {
    if (status === "countdown" && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [status, countdown]);

  const handleTap = async () => {
    if (status !== "playing") return;
    const change = colorMode === "gold" ? 1 : -3;

    // Safety: Functional update to prevent race conditions on fast taps
    setScore((prev) => {
      const nextScore = prev + change;
      supabase
        .from("players")
        .update({ score: nextScore })
        .eq("id", playerId)
        .then();
      return nextScore;
    });
  };

  return (
    <main className="mesh-gradient min-h-screen flex flex-col items-center py-8 px-4 md:px-10 lg:py-12 overflow-hidden font-display">
      <div className="w-full max-w-7xl flex flex-col gap-10">
        <div className="grid grid-cols-12 gap-6 lg:gap-10 items-start">
          {/* RULES SECTION */}
          <div className="col-span-12 lg:col-span-3 order-2 lg:order-1">
            <div className="glass-panel rounded-[2rem] p-6 lg:p-8 relative overflow-hidden">
              <div className="flex items-center gap-3 mb-8">
                <span className="material-symbols-outlined text-primary-indigo">
                  terminal
                </span>
                <h2 className="text-white font-bold tracking-widest uppercase text-sm">
                  Rules
                </h2>
              </div>
              <div className="space-y-6">
                <div
                  className={`flex items-center gap-4 transition-opacity ${colorMode === "gold" ? "opacity-100" : "opacity-30"}`}
                >
                  <div className="size-10 rounded-2xl glass-card flex items-center justify-center border-accent-gold/50">
                    <span className="material-symbols-outlined text-accent-gold">
                      bolt
                    </span>
                  </div>
                  <p className="text-sm font-bold text-accent-gold uppercase tracking-tighter">
                    Tap now!
                  </p>
                </div>
                <div
                  className={`flex items-center gap-4 transition-opacity ${colorMode === "black" ? "opacity-100" : "opacity-30"}`}
                >
                  <div className="size-10 rounded-2xl glass-card flex items-center justify-center border-white/20">
                    <span className="material-symbols-outlined text-white/40">
                      block
                    </span>
                  </div>
                  <p className="text-sm font-bold text-white/40 uppercase tracking-tighter">
                    Freeze!
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* MAIN GAME AREA */}
          <div className="col-span-12 lg:col-span-6 flex flex-col items-center order-1 lg:order-2">
            <div className="mb-10 text-center">
              <h1 className="text-white text-3xl font-bold tracking-[0.4em] uppercase mb-4">
                TECHNEURA Tap Challenge
              </h1>
              <p className="text-white/60 text-xl italic">
                Identity:{" "}
                <span className="text-white font-bold glow-text-indigo">
                  {playerName}
                </span>
              </p>
            </div>

            <div className="relative w-full max-w-lg aspect-video flex items-center justify-center">
              {/* <div className="absolute inset-0 bg-primary-indigo/20 blur-[100px] rounded-full"></div> */}
              <div className="glass-panel w-full h-full rounded-[3rem] flex flex-col items-center justify-center border-white/10 relative z-10">
                {(status === "playing" || status === "waiting") && (
                  <div
                    onClick={handleTap}
                    className={`transition-transform active:scale-90 duration-75 ${status === "playing" ? "cursor-pointer" : "opacity-20 pointer-events-none"}`}
                  >
                    <TechNeuraLogo
                      colorMode={status === "playing" ? colorMode : "default"}
                      gameState={status as any}
                    />
                  </div>
                )}

                {status === "countdown" && (
                  <motion.h1
                    key={countdown}
                    initial={{ scale: 0.5 }}
                    animate={{ scale: 1.2 }}
                    className="text-[10rem] font-black text-bright-blue italic drop-shadow-2xl"
                  >
                    {countdown}
                  </motion.h1>
                )}

                {status === "ended" && (
                  <div className="text-center">
                    <h2 className="text-2xl font-black text-accent-gold mb-4 italic">
                      TERMINATED
                    </h2>
                    {leaderboard.map((u, i) => (
                      <div
                        key={i}
                        className="flex justify-between w-48 mx-auto text-sm border-b border-white/10 py-1"
                      >
                        <span>{u.nickname}</span>
                        <span className="font-bold">{u.score}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SCORE SECTION */}
          <div className="col-span-12 lg:col-span-3 order-3">
            <div className="glass-panel rounded-[2rem] p-8 text-center bg-gradient-to-b from-primary-indigo/20 to-transparent">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">
                Current Score
              </span>
              <motion.p
                key={score}
                initial={{ scale: 1.5 }}
                animate={{ scale: 1 }}
                className="text-7xl font-black italic mt-2 drop-shadow-2xl"
              >
                {score}
              </motion.p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function GamePage() {
  return (
    <Suspense fallback={<div className="bg-black h-screen" />}>
      <GameContent />
    </Suspense>
  );
}
