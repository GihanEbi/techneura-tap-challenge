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

  const [logoPosition, setLogoPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!playerId) return;

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

    const statusChannel = supabase
      .channel("game_status")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "game_settings" },
        (payload) => {
          const newData = payload.new;
          setStatus(newData.status);
          if (newData.color_mode) setColorMode(newData.color_mode);
          if (
            newData.position_x !== undefined &&
            newData.position_y !== undefined
          ) {
            setLogoPosition({ x: newData.position_x, y: newData.position_y });
          }
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

  const handleTap = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    if (status !== "playing") return;

    const change = colorMode === "gold" ? 1 : -3;

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
    <main className="min-h-screen bg-[#050505] text-white flex flex-col items-center py-6 px-4 overflow-hidden relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-lg bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />

      {/* 1. TOP LOGO */}
      <header className="z-10 mb-4">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <Image
            src="/logo/logo-techneura.png"
            width={130}
            height={130}
            alt="Logo"
            priority
          />
        </motion.div>
      </header>

      {/* 2. SCORE */}
      <section className="z-10 text-center mb-6">
        <p className="text-blue-400 text-xs font-black uppercase tracking-[0.3em] mb-1">
          OPERATOR:{" "}
          <span className="text-white italic">{playerName || "---"}</span>
        </p>
        <motion.div
          key={score}
          initial={{ scale: 1.2 }}
          animate={{ scale: 1 }}
          // Only 2 colors now: White for >= 0, Red for < 0
          className={`text-8xl md:text-9xl font-black italic tracking-tighter drop-shadow-2xl transition-colors duration-300 ${
            score < 0 ? "text-red-500" : "text-white"
          }`}
        >
          {score}
        </motion.div>
      </section>

      {/* 3. GAME AREA */}
      <section className="z-10 w-full max-w-md aspect-square relative">
        <div className="absolute inset-0 bg-white/[0.03] backdrop-blur-md rounded-[3rem] border border-white/10 shadow-2xl overflow-hidden flex flex-col items-center justify-center">
          <AnimatePresence mode="wait">
            {status === "waiting" && (
              <motion.div
                key="rules"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-8 text-center"
              >
                <h2 className="text-blue-500 font-black uppercase tracking-widest text-sm mb-6 underline underline-offset-8">
                  Engagement Rules
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
                    <div className="size-8 bg-yellow-500 rounded-lg shadow-[0_0_15px_#eab308]" />
                    <p className="text-xs font-bold uppercase text-left leading-tight">
                      BRAIN GOLD:
                      <br />
                      <span className="text-yellow-500">+1 Point</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
                    <div className="size-8 bg-gray-900 border border-blue-900 rounded-lg" />
                    <p className="text-xs font-bold uppercase text-left leading-tight">
                      BRAIN BLACK:
                      <br />
                      <span className="text-red-500">-3 Points</span>
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {status === "countdown" && (
              <motion.div
                key="countdown"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 2, opacity: 0 }}
              >
                <h1 className="text-[12rem] font-black text-blue-500 italic drop-shadow-[0_0_30px_rgba(59,130,246,0.6)]">
                  {countdown}
                </h1>
              </motion.div>
            )}

            {status === "playing" && (
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  key="playing-logo"
                  animate={{
                    x: logoPosition.x,
                    y: logoPosition.y,
                    scale: 1,
                    opacity: 1,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 80,
                    damping: 15,
                    mass: 1,
                  }}
                  className="w-32 h-32 cursor-pointer touch-manipulation relative"
                  onMouseDown={handleTap}
                  onTouchStart={handleTap}
                >
                  <TechNeuraLogo colorMode={colorMode} gameState={status} />
                </motion.div>
              </div>
            )}

            {/* ENDED UI WITH LEADERBOARD */}
            {status === "ended" && (
              <motion.div
                key="ended"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="w-full px-8 text-center flex flex-col items-center justify-center h-full"
              >
                <h2 className="text-2xl font-black text-yellow-500 mb-6 italic uppercase">
                  Mission Ended
                </h2>
                <div className="w-full space-y-2">
                  {leaderboard.slice(0, 3).map((u, i) => (
                    <div
                      key={i}
                      className={`flex justify-between items-center p-4 rounded-2xl border ${
                        i === 0
                          ? "bg-yellow-500/20 border-yellow-500/50"
                          : "bg-white/5 border-white/5"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`flex items-center justify-center size-6 rounded-full text-[10px] font-bold text-black ${
                            i === 0 ? "bg-yellow-500" : "bg-white"
                          }`}
                        >
                          {i + 1}
                        </span>
                        <span className="font-bold text-sm truncate max-w-[100px]">
                          {u.nickname}
                        </span>
                      </div>
                      <span className="font-black italic text-xl">
                        {u.score}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* 4. FOOTER LEADERBOARD (Only shows when playing/waiting) */}
      {status !== "ended" && (
        <footer className="z-10 mt-auto w-full max-w-md pt-6">
          <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-sm">
            <div className="flex -space-x-2">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="size-6 rounded-full border-2 border-black bg-blue-600 flex items-center justify-center text-[8px] font-bold"
                >
                  {leaderboard[i]?.nickname?.charAt(0) || "?"}
                </div>
              ))}
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-blue-400">
              Live Top:{" "}
              <span className="text-white ml-1">
                {leaderboard[0]?.score || 0}
              </span>
            </p>
          </div>
        </footer>
      )}
    </main>
  );
}

export default function GamePage() {
  return (
    <Suspense
      fallback={
        <div className="bg-black h-screen flex items-center justify-center text-blue-500 font-black animate-pulse uppercase tracking-[0.5em]">
          Syncing...
        </div>
      }
    >
      <GameContent />
    </Suspense>
  );
}
