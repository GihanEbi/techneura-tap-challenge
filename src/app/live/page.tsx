"use client";

import { useEffect, useState, Suspense } from "react";
import { supabase } from "../../../lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import TechNeuraLogo from "@/components/TechNeuraLogo";

export default function LiveLeaderboard() {
  const [status, setStatus] = useState("waiting");
  const [countdown, setCountdown] = useState(5);
  const [colorMode, setColorMode] = useState<"gold" | "black">("black");
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [logoPosition, setLogoPosition] = useState({ x: 0, y: 0 });

  // --- SUPABASE SYNC ---
  useEffect(() => {
    // 1. Listen for Game Status & Movement
    const statusChannel = supabase
      .channel("live_game_status")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "game_settings" },
        (payload) => {
          const newData = payload.new;
          setStatus(newData.status);

          if (newData.color_mode) setColorMode(newData.color_mode);

          // Sync Position for the visualizer
          if (
            newData.position_x !== undefined &&
            newData.position_y !== undefined
          ) {
            setLogoPosition({ x: newData.position_x, y: newData.position_y });
          }
        },
      )
      .subscribe();

    // 2. Listen for Leaderboard Updates (Real-time)
    const leaderChannel = supabase
      .channel("live_leaderboard")
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
  }, []);

  const fetchLeaderboard = async () => {
    // Fetch top 10 for the big screen
    const { data } = await supabase
      .from("players")
      .select("nickname, score")
      .order("score", { ascending: false })
      .limit(7);
    if (data) setLeaderboard(data);
  };

  // --- COUNTDOWN TIMER ---
  useEffect(() => {
    if (status === "countdown" && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
    if (status === "waiting") {
      setCountdown(5); // Reset for next round
    }
  }, [status, countdown]);

  return (
    <main className="min-h-screen bg-[#050505] text-white overflow-hidden relative flex flex-col">
      {/* Background Ambience */}
      <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[80%] h-[60%] bg-blue-600/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-purple-600/10 blur-[150px] rounded-full pointer-events-none" />

      {/* --- HEADER --- */}
      <header className="z-10 p-8 flex justify-between items-center w-full max-w-[1800px] mx-auto">
        <div className="flex items-center gap-6">
          <Image
            src="/logo/logo-techneura.png"
            width={100}
            height={100}
            alt="Logo"
            className="drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]"
          />
          <div className="h-12 w-[1px] bg-white/20" />
          <h1 className="text-3xl font-black italic tracking-tighter text-white/80">
            LIVE ARENA
          </h1>
        </div>

        {/* Status Badge */}
        <div
          className={`px-6 py-2 rounded-full border backdrop-blur-md font-black uppercase tracking-[0.2em] text-sm transition-colors ${
            status === "playing"
              ? "bg-red-500/20 border-red-500 text-red-500 animate-pulse"
              : status === "countdown"
                ? "bg-blue-500/20 border-blue-500 text-blue-500"
                : "bg-white/10 border-white/20 text-white/50"
          }`}
        >
          {status === "playing" ? "• LIVE SESSION" : status}
        </div>
      </header>

      {/* --- MAIN CONTENT GRID --- */}
      <div className="flex-1 grid grid-rows-[45%_55%] gap-8 p-8 max-w-[1800px] mx-auto w-full z-10">
        {/* TOP: VISUALIZER AREA */}
        <section className="relative w-full h-full bg-white/[0.02] backdrop-blur-xl rounded-[3rem] border border-white/10 shadow-2xl flex flex-col items-center justify-center overflow-hidden">
          <AnimatePresence mode="wait">
            {/* 1. WAITING / RULES */}
            {status === "waiting" && (
              <motion.div
                key="waiting"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex flex-col items-center gap-8"
              >
                <h2 className="text-blue-400 font-black uppercase tracking-[0.5em] text-lg">
                  System Ready
                </h2>
                <div className="flex gap-12">
                  <div className="flex flex-col items-center gap-4 bg-black/40 p-8 rounded-3xl border border-yellow-500/30">
                    <div className="size-16 bg-yellow-500 rounded-full shadow-[0_0_30px_#eab308] animate-pulse" />
                    <div className="text-center">
                      <p className="text-2xl font-black text-yellow-500">
                        GOLD NEURON
                      </p>
                      <p className="text-white/60 font-bold uppercase tracking-widest text-sm">
                        +1 POINT
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-4 bg-black/40 p-8 rounded-3xl border border-red-500/30">
                    <div className="size-16 bg-gray-900 border-2 border-red-500 rounded-full shadow-[0_0_30px_rgba(239,68,68,0.4)]" />
                    <div className="text-center">
                      <p className="text-2xl font-black text-red-500">
                        DARK MATTER
                      </p>
                      <p className="text-white/60 font-bold uppercase tracking-widest text-sm">
                        -3 POINTS
                      </p>
                    </div>
                  </div>
                </div>
                <p className="text-white/30 font-mono animate-pulse mt-4">
                  WAITING FOR ADMIN COMMAND...
                </p>
              </motion.div>
            )}

            {/* 2. COUNTDOWN */}
            {status === "countdown" && (
              <motion.div
                key="countdown"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.5, opacity: 0 }}
                className="flex flex-col items-center"
              >
                <h1 className="text-[15rem] leading-none font-black italic text-transparent bg-clip-text bg-gradient-to-b from-blue-400 to-blue-600 drop-shadow-[0_0_60px_rgba(37,99,235,0.6)]">
                  {countdown}
                </h1>
                <p className="text-blue-400 font-bold tracking-[1em] uppercase text-2xl mt-4">
                  Get Ready
                </p>
              </motion.div>
            )}

            {/* 3. PLAYING (MOVING LOGO) */}
            {status === "playing" && (
              <div className="absolute inset-0 w-full h-full">
                {/* Center marker for visual reference */}
                {/* <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-4 bg-white/5 rounded-full" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] border border-white/5 rounded-full" /> */}

                {/* Moving Container (Centered) */}
                <div className="absolute top-1/2 left-1/2 w-0 h-0">
                  <motion.div
                    animate={{ x: logoPosition.x, y: logoPosition.y }}
                    transition={{ type: "spring", stiffness: 80, damping: 15 }}
                    className="absolute -top-24 -left-24 size-48" // size-48 = 192px (larger for big screen)
                  >
                    <TechNeuraLogo colorMode={colorMode} gameState={status} />
                  </motion.div>
                </div>
              </div>
            )}

            {/* 4. ENDED */}
            {status === "ended" && (
              <motion.div
                key="ended"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center"
              >
                <h1 className="text-8xl font-black italic text-yellow-500 mb-4 drop-shadow-[0_0_40px_rgba(234,179,8,0.5)]">
                  GAME OVER
                </h1>
                <p className="text-2xl text-white font-bold tracking-[0.5em] uppercase">
                  Final Results Processing
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* BOTTOM: LIVE LEADERBOARD */}
        <section className="bg-white/5 backdrop-blur-md rounded-[3rem] border border-white/10 overflow-hidden flex flex-col">
          {/* Table Header */}
          <div className="px-12 py-6 bg-white/5 border-b border-white/5 flex justify-between items-end">
            <h3 className="text-2xl font-black uppercase italic tracking-tighter text-blue-400">
              Live Rankings
            </h3>
            <span className="text-xs font-bold uppercase tracking-widest text-white/40">
              Top {leaderboard.length} Operators
            </span>
          </div>

          {/* Table Rows */}
          <div className="flex-1 p-8 overflow-hidden">
            <div className="grid grid-cols-1 gap-4">
              <AnimatePresence>
                {leaderboard.map((player, index) => (
                  <motion.div
                    layout
                    key={player.nickname} // Ideally use player.id if available in this select, but nickname works for display
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ type: "spring", stiffness: 50, damping: 20 }}
                    className={`relative flex items-center justify-between px-8 py-5 rounded-2xl border backdrop-blur-sm transition-all
                      ${
                        index === 0
                          ? "bg-yellow-500/20 border-yellow-500/50 scale-[1.02] shadow-[0_0_30px_rgba(234,179,8,0.1)] z-10"
                          : index === 1
                            ? "bg-white/10 border-white/20"
                            : index === 2
                              ? "bg-white/5 border-white/10"
                              : "bg-black/20 border-white/5 opacity-80"
                      }
                    `}
                  >
                    {/* Rank & Name */}
                    <div className="flex items-center gap-8">
                      <span
                        className={`text-4xl font-black italic w-16 text-center ${
                          index === 0
                            ? "text-yellow-400"
                            : index === 1
                              ? "text-gray-300"
                              : index === 2
                                ? "text-orange-400"
                                : "text-white/20"
                        }`}
                      >
                        #{index + 1}
                      </span>
                      <div className="flex flex-col">
                        <span className="text-3xl font-bold tracking-tight text-white">
                          {player.nickname}
                        </span>
                      </div>
                    </div>

                    {/* Score */}
                    <div className="text-right">
                      <span
                        className={`text-5xl font-black italic tracking-tighter ${
                          player.score < 0 ? "text-red-500" : "text-white"
                        }`}
                      >
                        {player.score}
                      </span>
                      <span className="block text-[10px] font-bold uppercase tracking-widest text-white/30 mt-1">
                        Current Score
                      </span>
                    </div>

                    {/* Rank 1 Crown Indicator */}
                    {index === 0 && (
                      <div className="absolute -right-4 -top-4 bg-yellow-500 text-black size-12 rounded-full flex items-center justify-center border-4 border-[#050505] shadow-lg">
                        <span className="material-symbols-outlined text-2xl">
                          crown
                        </span>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
