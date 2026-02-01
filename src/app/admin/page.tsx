"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "../../../lib/supabase";
import TechNeuraLogo from "@/components/TechNeuraLogo";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminPanel() {
  const [players, setPlayers] = useState<any[]>([]);
  const [gameStatus, setGameStatus] = useState("waiting");
  const [currentColor, setCurrentColor] = useState<"gold" | "black">("black");
  const [isResetting, setIsResetting] = useState(false);
  const [pass, setPass] = useState("");
  const [countdown, setCountdown] = useState(5);

  const ADMIN_PASSWORD = "admin";
  const countdownInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchGameStatus();
    fetchPlayers();

    const playerSubscription = supabase
      .channel("admin_leaderboard")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "players" },
        () => fetchPlayers(),
      )
      .subscribe();

    const statusSubscription = supabase
      .channel("admin_status")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "game_settings" },
        (payload) => {
          setGameStatus(payload.new.status);
          setCurrentColor(payload.new.color_mode);

          // Trigger local countdown if status changes to countdown
          if (payload.new.status === "countdown") {
            startLocalCountdown();
          }
          if (payload.new.status === "waiting") {
            setCountdown(5);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(playerSubscription);
      supabase.removeChannel(statusSubscription);
    };
  }, []);

  // --- LOCAL COUNTDOWN LOGIC ---
  const startLocalCountdown = () => {
    setCountdown(5);
    if (countdownInterval.current) clearInterval(countdownInterval.current);

    countdownInterval.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (countdownInterval.current)
            clearInterval(countdownInterval.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // --- GAME LOGIC: CENTRALIZED COLOR HEARTBEAT ---
  useEffect(() => {
    if (gameStatus !== "playing") {
      if (currentColor !== "black") updateColor("black");
      return;
    }

    const interval = setInterval(
      () => {
        const nextColor = Math.random() > 0.6 ? "gold" : "black";
        updateColor(nextColor);
      },
      Math.random() * 1000 + 800,
    );

    return () => clearInterval(interval);
  }, [gameStatus]);

  const fetchPlayers = async () => {
    const { data } = await supabase
      .from("players")
      .select("*")
      .order("score", { ascending: false });
    if (data) setPlayers(data);
  };

  const fetchGameStatus = async () => {
    const { data } = await supabase.from("game_settings").select("*").single();
    if (data) {
      setGameStatus(data.status);
      setCurrentColor(data.color_mode);
    }
  };

  const updateStatus = async (status: string) => {
    await supabase.from("game_settings").update({ status }).eq("id", 1);
  };

  const updateColor = async (color_mode: string) => {
    await supabase.from("game_settings").update({ color_mode }).eq("id", 1);
  };

  const startGameSequence = async () => {
    await updateStatus("countdown");
    setTimeout(async () => {
      await updateStatus("playing");
    }, 5000);
  };

  const resetGame = async () => {
    if (!confirm("Are you sure? This will wipe all scores!")) return;
    setIsResetting(true);
    await updateStatus("waiting");
    await updateColor("black");
    await supabase
      .from("players")
      .update({ score: 0 })
      .neq("id", "00000000-0000-0000-0000-000000000000");
    setIsResetting(false);
    fetchPlayers();
  };

  if (pass !== ADMIN_PASSWORD) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-black to-black"></div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 w-full max-w-md bg-white/5 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 shadow-2xl flex flex-col items-center gap-6"
        >
          <div className="size-16 rounded-2xl bg-blue-500/20 flex items-center justify-center border border-blue-500/30 text-blue-400">
            <span className="material-symbols-outlined text-4xl">lock</span>
          </div>
          <h2 className="text-white text-2xl font-black tracking-tighter uppercase">
            Admin Terminal
          </h2>
          <input
            type="password"
            autoFocus
            onChange={(e) => setPass(e.target.value)}
            placeholder="ACCESS KEY"
            className="w-full bg-black/40 border border-white/10 p-4 rounded-2xl text-white text-center text-xl font-bold tracking-widest focus:border-blue-500 outline-none transition-all placeholder:text-white/20"
          />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white selection:bg-blue-500 selection:text-white">
      {/* Mesh Background */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-40">
        <div className="absolute top-[-10%] left-[-10%] size-[50%] bg-blue-600/20 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] size-[50%] bg-indigo-600/20 blur-[120px] rounded-full"></div>
      </div>

      <div className="relative z-10 max-w-[1440px] mx-auto p-4 md:p-10 lg:p-12 flex flex-col gap-8 md:gap-12">
        {/* Header Section */}
        <header className="flex flex-col lg:flex-row justify-between items-center gap-8 bg-white/5 p-6 md:p-10 rounded-[2.5rem] border border-white/10 backdrop-blur-md">
          <div className="flex flex-col gap-2 text-center lg:text-left">
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter italic">
              CONTROL CENTER
            </h1>
            <div className="flex items-center justify-center lg:justify-start gap-4 mt-2">
              <span className="text-white/40 text-xs font-bold uppercase tracking-[0.3em]">
                System.State:
              </span>
              <div
                className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${
                  gameStatus === "playing"
                    ? "bg-green-500/20 border-green-500/50 text-green-400"
                    : gameStatus === "countdown"
                      ? "bg-blue-500/20 border-blue-500/50 text-blue-400 animate-pulse"
                      : "bg-amber-500/20 border-amber-500/50 text-amber-400"
                }`}
              >
                {gameStatus}
              </div>
            </div>
          </div>

          {/* Centered Preview / Countdown */}
          <div className="relative size-48 md:size-64 flex items-center justify-center bg-black/40 rounded-full border border-white/10 shadow-inner overflow-hidden">
            <AnimatePresence mode="wait">
              {gameStatus === "countdown" ? (
                <motion.h1
                  key="cd"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 2, opacity: 0 }}
                  className="text-8xl font-black italic text-blue-500"
                >
                  {countdown}
                </motion.h1>
              ) : (
                <motion.div
                  key="logo"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: gameStatus === "playing" ? 1 : 0.3 }}
                  className="scale-50"
                >
                  <TechNeuraLogo
                    colorMode={
                      gameStatus === "playing" ? currentColor : "default"
                    }
                    gameState={gameStatus as any}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            className="w-full lg:w-auto flex items-center justify-center gap-3 px-10 py-5 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white font-black rounded-2xl border border-red-600/30 transition-all group"
            onClick={resetGame}
            disabled={isResetting}
          >
            <span className="material-symbols-outlined group-hover:rotate-180 transition-transform duration-500">
              restart_alt
            </span>
            <span className="uppercase tracking-widest text-sm">
              Reset Ecosystem
            </span>
          </button>
        </header>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ActionButton
            label="Sequence 01"
            title="Countdown"
            sub="INITIATE 5S TIMER"
            icon="timer"
            color="green"
            onClick={startGameSequence}
            disabled={gameStatus !== "waiting"}
          />
          <ActionButton
            label="Override"
            title="Force Play"
            sub="BYPASS WAIT TIME"
            icon="play_arrow"
            color="blue"
            onClick={() => updateStatus("playing")}
            disabled={gameStatus === "playing"}
          />
          <ActionButton
            label="Termination"
            title="Stop Game"
            sub="HALT ALL INSTANCES"
            icon="stop"
            color="amber"
            onClick={() => updateStatus("ended")}
            disabled={gameStatus === "ended"}
          />
        </div>

        {/* Leaderboard */}
        <div className="bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden backdrop-blur-md">
          <div className="px-8 py-8 border-b border-white/10 bg-white/5 flex items-center gap-4">
            <div className="size-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.4)]">
              <span className="material-symbols-outlined text-white text-3xl">
                leaderboard
              </span>
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                Active Rankings
              </h2>
              <p className="text-white/40 text-xs uppercase font-bold tracking-widest">
                {players.length} Neural Links Established
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-white/30 text-[10px] font-black uppercase tracking-[0.3em] border-b border-white/5">
                  <th className="px-8 py-6">Rank</th>
                  <th className="px-8 py-6">Operator</th>
                  <th className="px-8 py-6 text-right">Performance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {players.map((player, index) => (
                  <tr
                    key={player.id}
                    className="group hover:bg-white/5 transition-colors"
                  >
                    <td className="px-8 py-6">
                      <span className="text-3xl font-black italic text-white/10 group-hover:text-blue-500 transition-colors">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="size-10 rounded-lg bg-white/5 flex items-center justify-center font-black text-blue-500 border border-white/10">
                          {player.nickname?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-lg">
                            {player.nickname}
                          </span>
                          <span className="text-xs text-white/30 font-mono uppercase">
                            {player.email}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <span
                        className={`text-3xl font-black italic ${player.score >= 0 ? "text-white" : "text-red-500"}`}
                      >
                        {player.score}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Background Style Overrides */}
      <style jsx global>{`
        .material-symbols-outlined {
          font-variation-settings:
            "FILL" 1,
            "wght" 400,
            "GRAD" 0,
            "opsz" 24;
        }
        .internal-glow {
          position: relative;
          overflow: hidden;
        }
        .internal-glow::after {
          content: "";
          position: absolute;
          inset: 0;
          background: radial-gradient(
            circle at center,
            transparent 40%,
            rgba(255, 255, 255, 0.05) 100%
          );
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}

function ActionButton({
  label,
  title,
  sub,
  icon,
  color,
  onClick,
  disabled,
}: any) {
  const colors: any = {
    green:
      "bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500 hover:text-black shadow-green-500/10",
    blue: "bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500 hover:text-black shadow-blue-500/10",
    amber:
      "bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500 hover:text-black shadow-amber-500/10",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`relative flex flex-col items-start p-8 rounded-[2.5rem] border transition-all duration-500 group disabled:opacity-20 disabled:grayscale ${colors[color]}`}
    >
      <span className="text-[10px] font-black uppercase tracking-[0.3em] mb-2 opacity-60 group-hover:opacity-100">
        {label}
      </span>
      <span className="text-3xl md:text-4xl font-black italic tracking-tighter uppercase mb-2">
        {title}
      </span>
      <p className="text-[10px] font-bold opacity-40 mb-8">{sub}</p>
      <div className="size-14 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10 transition-transform group-hover:scale-110">
        <span className="material-symbols-outlined text-3xl">{icon}</span>
      </div>
    </button>
  );
}
