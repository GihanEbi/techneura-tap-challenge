"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "../../../lib/supabase";
import TechNeuraLogo from "@/components/TechNeuraLogo";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminPanel() {
  const [players, setPlayers] = useState<any[]>([]);
  const [gameStatus, setGameStatus] = useState("waiting");
  const [currentColor, setCurrentColor] = useState<"gold" | "black">("black");
  const [gameSpeed, setGameSpeed] = useState(800);
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
          if (payload.new.speed) setGameSpeed(payload.new.speed);

          if (payload.new.status === "countdown") startLocalCountdown();
          if (payload.new.status === "waiting") setCountdown(5);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(playerSubscription);
      supabase.removeChannel(statusSubscription);
    };
  }, []);

  const startLocalCountdown = () => {
    setCountdown(5);
    if (countdownInterval.current) clearInterval(countdownInterval.current);
    countdownInterval.current = setInterval(() => {
      setCountdown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
  };

  useEffect(() => {
    if (gameStatus !== "playing") {
      if (currentColor !== "black") {
        supabase
          .from("game_settings")
          .update({ color_mode: "black", position_x: 0, position_y: 0 })
          .eq("id", 1)
          .then();
      }
      return;
    }

    const interval = setInterval(() => {
      const limit = 130;
      const newX = Math.random() * (limit * 2) - limit;
      const newY = Math.random() * (limit * 2) - limit;
      const nextColor = Math.random() > 0.7 ? "gold" : "black";

      supabase
        .from("game_settings")
        .update({
          color_mode: nextColor,
          position_x: newX,
          position_y: newY,
        })
        .eq("id", 1)
        .then();
    }, gameSpeed);

    return () => clearInterval(interval);
  }, [gameStatus, gameSpeed]);

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
      if (data.speed) setGameSpeed(data.speed);
    }
  };

  const updateStatus = async (status: string) => {
    await supabase.from("game_settings").update({ status }).eq("id", 1);
  };

  const updateSpeed = async (newSpeed: number) => {
    setGameSpeed(newSpeed);
    await supabase
      .from("game_settings")
      .update({ speed: newSpeed })
      .eq("id", 1);
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
    await supabase
      .from("game_settings")
      .update({ color_mode: "black", position_x: 0, position_y: 0 })
      .eq("id", 1);
    await supabase
      .from("players")
      .update({ score: 0 })
      .neq("id", "00000000-0000-0000-0000-000000000000");
    setIsResetting(false);
    fetchPlayers();
  };

  if (pass !== ADMIN_PASSWORD) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
        <input
          type="password"
          autoFocus
          onChange={(e) => setPass(e.target.value)}
          placeholder="ACCESS KEY"
          className="w-full max-w-md bg-white/10 border border-white/20 p-4 rounded-xl text-white text-center text-xl tracking-widest outline-none"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-10">
      <div className="max-w-[1440px] mx-auto flex flex-col gap-8">
        {/* Header */}
        <header className="flex flex-col lg:flex-row justify-between items-center gap-8 bg-white/5 p-6 rounded-[2rem] border border-white/10">
          <div>
            <h1 className="text-4xl font-black italic">CONTROL CENTER</h1>
            <div className="flex gap-4 mt-2">
              <span className="text-xs font-bold uppercase text-gray-500">
                Status: {gameStatus}
              </span>
              <span className="text-xs font-bold uppercase text-blue-500">
                Speed: {gameSpeed}ms
              </span>
            </div>
          </div>

          {/* PREVIEW BOX */}
          <div className="relative size-40 flex items-center justify-center bg-black rounded-full border border-white/20 overflow-hidden">
            <AnimatePresence mode="wait">
              {gameStatus === "countdown" ? (
                <motion.h1
                  key="cd"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 2, opacity: 0 }}
                  className="text-6xl font-black italic text-blue-500"
                >
                  {countdown}
                </motion.h1>
              ) : (
                <div className="scale-50">
                  <TechNeuraLogo
                    colorMode={currentColor}
                    gameState={gameStatus}
                  />
                </div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex flex-col gap-2 w-full lg:w-auto">
            <label className="text-[10px] uppercase font-bold text-gray-400">
              Movement Speed
            </label>
            <input
              type="range"
              min="200"
              max="2000"
              step="100"
              value={gameSpeed}
              onChange={(e) => updateSpeed(Number(e.target.value))}
              className="w-full accent-blue-500"
            />
            <div className="flex justify-between text-[10px] font-mono">
              <span>Fast</span>
              <span>Slow</span>
            </div>
          </div>
        </header>

        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ActionButton
            title="Countdown"
            icon="timer"
            color="green"
            onClick={startGameSequence}
            disabled={gameStatus !== "waiting"}
          />
          <ActionButton
            title="Force Play"
            icon="play_arrow"
            color="blue"
            onClick={() => updateStatus("playing")}
            disabled={gameStatus === "playing"}
          />
          <ActionButton
            title="Stop Game"
            icon="stop"
            color="amber"
            onClick={() => updateStatus("ended")}
            disabled={gameStatus === "ended"}
          />
        </div>

        {/* Reset */}
        <button
          onClick={resetGame}
          className="w-full py-4 bg-red-900/20 border border-red-500/30 text-red-500 font-bold rounded-xl hover:bg-red-500 hover:text-white transition-all"
        >
          RESET ECOSYSTEM
        </button>

        {/* --- LEADERBOARD (Restored) --- */}
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
                        <span className="font-bold text-lg">
                          {player.nickname}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <span
                        className={`text-3xl font-black italic ${
                          player.score < 0 ? "text-red-500" : "text-white"
                        }`}
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
    </div>
  );
}

function ActionButton({ title, icon, color, onClick, disabled }: any) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`p-8 rounded-[2rem] border transition-all disabled:opacity-30 disabled:grayscale flex flex-col items-center gap-4
        ${
          color === "green"
            ? "bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500 hover:text-black"
            : ""
        }
        ${
          color === "blue"
            ? "bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500 hover:text-black"
            : ""
        }
        ${
          color === "amber"
            ? "bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500 hover:text-black"
            : ""
        }
      `}
    >
      <span className="material-symbols-outlined text-4xl">{icon}</span>
      <span className="text-2xl font-black uppercase italic">{title}</span>
    </button>
  );
}
