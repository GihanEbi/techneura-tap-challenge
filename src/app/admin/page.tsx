"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

export default function AdminPanel() {
  const [players, setPlayers] = useState<any[]>([]);
  const [gameStatus, setGameStatus] = useState("waiting");
  const [currentColor, setCurrentColor] = useState<"gold" | "black">("black");
  const [isResetting, setIsResetting] = useState(false);
  const [pass, setPass] = useState("");

  const ADMIN_PASSWORD = "admin";

  useEffect(() => {
    fetchGameStatus();
    fetchPlayers();

    // Subscribe to score updates in real-time
    const playerSubscription = supabase
      .channel("admin_leaderboard")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "players" },
        () => fetchPlayers(),
      )
      .subscribe();

    // Subscribe to status and color changes
    const statusSubscription = supabase
      .channel("admin_status")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "game_settings" },
        (payload) => {
          setGameStatus(payload.new.status);
          setCurrentColor(payload.new.color_mode);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(playerSubscription);
      supabase.removeChannel(statusSubscription);
    };
  }, []);

  // --- GAME LOGIC: CENTRALIZED COLOR HEARTBEAT ---
  // This effect only runs on the Admin's machine. It pushes color changes to Supabase.
  useEffect(() => {
    if (gameStatus !== "playing") {
      // Force black when not playing
      if (currentColor !== "black") updateColor("black");
      return;
    }

    const interval = setInterval(
      () => {
        const nextColor = Math.random() > 0.6 ? "gold" : "black";
        updateColor(nextColor);
      },
      Math.random() * 1000 + 800,
    ); // Toggles every 0.8s - 1.8s

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
      <div className="h-screen bg-black flex flex-col items-center justify-center p-4">
        <div className="glass-panel p-8 rounded-3xl border-white/10 flex flex-col items-center gap-6">
          <span className="material-symbols-outlined text-primary-indigo text-5xl">
            lock
          </span>
          <h2 className="text-white font-bold tracking-widest uppercase">
            Admin Terminal
          </h2>
          <input
            type="password"
            autoFocus
            onChange={(e) => setPass(e.target.value)}
            placeholder="Enter Access Key"
            className="bg-gray-900 border border-white/10 p-3 rounded-xl text-white text-center focus:border-primary-indigo outline-none transition-all"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1440px] mx-auto p-6 md:p-10 lg:p-12 flex flex-col gap-10 md:gap-12">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex flex-col gap-3">
          <h1 className="text-white text-4xl md:text-5xl font-bold tracking-tighter">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-500">
              Game Control Center
            </span>
          </h1>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-3">
              <span className="text-slate-500 font-semibold text-[10px] md:text-xs uppercase tracking-[0.2em]">
                System Status
              </span>
              <div className="flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full">
                <span
                  className={`size-2 rounded-full animate-pulse ${gameStatus === "playing" ? "bg-electric-green" : "bg-vivid-amber"}`}
                ></span>
                <span className="text-white text-[10px] font-bold uppercase tracking-tighter">
                  {gameStatus}
                </span>
              </div>
            </div>

            {/* LIVE PHASE MONITOR (Added Item) */}
            <div
              className={`flex items-center gap-3 px-4 py-1 rounded-full border transition-all duration-300 ${currentColor === "gold" ? "bg-accent-gold/20 border-accent-gold/50 shadow-[0_0_15px_rgba(251,191,36,0.3)]" : "bg-black/40 border-white/10"}`}
            >
              <div
                className={`size-2 rounded-full ${currentColor === "gold" ? "bg-accent-gold shadow-[0_0_8px_#fbbf24]" : "bg-slate-600"}`}
              ></div>
              <span
                className={`text-[10px] font-black uppercase tracking-widest ${currentColor === "gold" ? "text-accent-gold" : "text-slate-500"}`}
              >
                {currentColor === "gold"
                  ? "Active Phase (Tap)"
                  : "Static Phase (Wait)"}
              </span>
            </div>
          </div>
        </div>

        <button
          className="w-full md:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl border border-white/10 transition-all group"
          onClick={resetGame}
          disabled={isResetting}
        >
          <span className="material-symbols-outlined group-hover:rotate-180 transition-transform duration-500">
            restart_alt
          </span>
          <span className="uppercase tracking-widest text-xs md:text-sm">
            {isResetting ? "Resetting..." : "Reset Ecosystem"}
          </span>
        </button>
      </header>

      {/* Grid: Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Countdown */}
        <button
          className="action-card bg-electric-green/10 border-electric-green/30 text-electric-green internal-glow group disabled:opacity-30"
          onClick={startGameSequence}
          disabled={gameStatus !== "waiting"}
        >
          <div className="mesh-glow text-electric-green"></div>
          <span className="relative z-10 text-[10px] font-black uppercase tracking-[0.3em] mb-4 opacity-60">
            Sequence 01
          </span>
          <span className="relative z-10 text-3xl md:text-4xl font-black tracking-tighter uppercase mb-2 group-hover:tracking-widest transition-all duration-500">
            Countdown
          </span>
          <p className="relative z-10 text-[10px] font-medium text-electric-green/60 mb-8">
            INITIATE 5S TIMER
          </p>
          <div className="relative z-10 size-16 rounded-2xl bg-electric-green/20 flex items-center justify-center border border-electric-green/30 group-hover:bg-electric-green group-hover:text-black transition-all shadow-[0_0_30px_rgba(0,255,136,0.2)]">
            <span className="material-symbols-outlined text-4xl">timer</span>
          </div>
        </button>

        {/* Force Play */}
        <button
          className="action-card bg-bright-blue/10 border-bright-blue/30 text-bright-blue internal-glow group disabled:opacity-30"
          onClick={() => updateStatus("playing")}
          disabled={gameStatus === "playing"}
        >
          <div className="mesh-glow text-bright-blue"></div>
          <span className="relative z-10 text-[10px] font-black uppercase tracking-[0.3em] mb-4 opacity-60">
            Override
          </span>
          <span className="relative z-10 text-3xl md:text-4xl font-black tracking-tighter uppercase mb-2 group-hover:tracking-widest transition-all duration-500">
            Force Play
          </span>
          <p className="relative z-10 text-[10px] font-medium text-bright-blue/60 mb-8">
            BYPASS WAIT TIME
          </p>
          <div className="relative z-10 size-16 rounded-2xl bg-bright-blue/20 flex items-center justify-center border border-bright-blue/30 group-hover:bg-bright-blue group-hover:text-black transition-all shadow-[0_0_30px_rgba(0,162,255,0.2)]">
            <span className="material-symbols-outlined text-4xl">
              play_arrow
            </span>
          </div>
        </button>

        {/* Stop Game */}
        <button
          className="action-card bg-vivid-amber/10 border-vivid-amber/30 text-vivid-amber internal-glow group md:col-span-2 lg:col-span-1 disabled:opacity-30"
          onClick={() => updateStatus("ended")}
          disabled={gameStatus === "ended"}
        >
          <div className="mesh-glow text-vivid-amber"></div>
          <span className="relative z-10 text-[10px] font-black uppercase tracking-[0.3em] mb-4 opacity-60">
            Termination
          </span>
          <span className="relative z-10 text-3xl md:text-4xl font-black tracking-tighter uppercase mb-2 group-hover:tracking-widest transition-all duration-500">
            Stop Game
          </span>
          <p className="relative z-10 text-[10px] font-medium text-vivid-amber/60 mb-8">
            HALT ALL INSTANCES
          </p>
          <div className="relative z-10 size-16 rounded-2xl bg-vivid-amber/20 flex items-center justify-center border border-vivid-amber/30 group-hover:bg-vivid-amber group-hover:text-black transition-all shadow-[0_0_30px_rgba(255,170,0,0.2)]">
            <span className="material-symbols-outlined text-4xl">stop</span>
          </div>
        </button>
      </div>

      {/* Leaderboard Section */}
      <div className="glass-frosted rounded-[2rem] md:rounded-[2.5rem] overflow-hidden flex flex-col">
        {/* Table Header */}
        <div className="px-6 md:px-10 py-8 border-b border-white/5 flex flex-col lg:flex-row items-start lg:items-center justify-between bg-white/[0.02] gap-6">
          <div className="flex items-center gap-4">
            <div className="size-10 md:size-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
              <span className="material-symbols-outlined text-white text-2xl md:text-3xl">
                leaderboard
              </span>
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold tracking-tight">
                Live Leaderboard
              </h2>
              <p className="text-slate-500 text-xs md:text-sm font-medium italic">
                {players.length} Active Neural Links
              </p>
            </div>
          </div>
        </div>

        {/* Responsive Table Wrapper */}
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[650px]">
            <thead>
              <tr className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] border-b border-white/5 bg-white/[0.01]">
                <th className="px-8 md:px-10 py-6">Position</th>
                <th className="px-8 md:px-10 py-6">Competitor</th>
                <th className="px-8 md:px-10 py-6 text-right font-sans">
                  Performance Score
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {players.map((player, index) => (
                <tr
                  key={player.id}
                  className="group hover:bg-white/[0.04] transition-all cursor-pointer"
                >
                  <td className="px-8 md:px-10 py-8">
                    <span className="text-2xl md:text-3xl font-black italic text-white/20 group-hover:text-primary-indigo transition-colors">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </td>
                  <td className="px-8 md:px-10 py-8">
                    <div className="flex items-center gap-5">
                      <div className="relative flex-shrink-0">
                        <div className="size-12 md:size-14 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 border border-white/10 flex items-center justify-center overflow-hidden">
                          <span className="text-white text-xl font-black opacity-40">
                            {player.nickname?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-white font-bold text-lg md:text-xl tracking-tight leading-tight">
                          {player.nickname}
                        </span>
                        <span className="text-slate-500 text-xs md:text-sm font-medium font-sans">
                          {player.email}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 md:px-10 py-8 text-right">
                    <div className="flex flex-col items-end">
                      <span className="text-white font-black text-2xl md:text-3xl tracking-tighter glow-text-indigo">
                        {player.score}
                      </span>
                      <span className="text-[9px] md:text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1 font-sans">
                        Neural Metric
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
