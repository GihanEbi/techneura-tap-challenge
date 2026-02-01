// app/register/page.tsx
"use client";

import { useState } from "react";
import { registerPlayer } from "@/app/actions/register";
import Image from "next/image";

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    const result = await registerPlayer(formData);
    setLoading(false);

    if (result.error) {
      setMessage(result.error);
    } else {
      setMessage("Success! Check your email for the game link.");
    }
  }
  return (
    <div className="min-h-screen flex flex-col items-center relative overflow-hidden">
      {/* Background Radial Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-primary/10 rounded-full blur-[100px] md:blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-accent-purple/10 rounded-full blur-[100px] md:blur-[120px] pointer-events-none" />

      <main className="w-full max-w-7xl px-6 flex-1 flex flex-col items-center justify-center py-12 z-10">
        {/* Branding */}
        <div className="flex flex-col items-center">
          <div className="size-30 md:size-50 text-primary drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]">
            <Image
              src={"/logo/logo-techneura.png"}
              width={150}
              height={150}
              alt="Techneura Logo"
            />
          </div>
        </div>

        {/* Form Card */}
        <div className="w-full max-w-[500px] glass-morphism glowing-border rounded-[2rem] p-8 md:p-10">
          <div className="text-center mb-10">
            <h1 className="text-2xl md:text-3xl font-bold mb-2 tracking-tight">
              TECHNEURA TAP CHALLENGE
            </h1>
            <p className="text-white/50 text-xs md:text-sm font-light">
              Register to receive your unique game link
            </p>
          </div>
          {message ? (
            <div className="p-4 bg-blue-500/20 border border-blue-500 rounded text-center">
              {message}
            </div>
          ) : (
            <form action={handleSubmit} className="space-y-5 md:space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">
                  Full Name
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary/60 text-xl">
                    person
                  </span>
                  <input
                    className="input-premium w-full h-14 pl-12 pr-4 rounded-xl placeholder:text-white/20"
                    placeholder="Johnathan Doe"
                    type="text"
                    required
                    name="full_name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">
                  Nickname
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary/60 text-xl">
                    alternate_email
                  </span>
                  <input
                    className="input-premium w-full h-14 pl-12 pr-4 rounded-xl placeholder:text-white/20"
                    placeholder="GhostRunner_99"
                    type="text"
                    name="nickname"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">
                  Email Address
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary/60 text-xl">
                    mail
                  </span>
                  <input
                    className="input-premium w-full h-14 pl-12 pr-4 rounded-xl placeholder:text-white/20"
                    placeholder="nexus@domain.com"
                    name="email"
                    type="email"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">
                  Phone Number
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pr-3 border-r border-white/10">
                    <span className="material-symbols-outlined text-green-500 text-xl">
                      chat
                    </span>
                  </div>
                  <input
                    className="input-premium w-full h-14 pl-16 pr-4 rounded-xl placeholder:text-white/20"
                    placeholder="+1 (555) 000-0000"
                    name="phone"
                    type="tel"
                    required
                  />
                </div>
                <p className="text-[10px] text-white/30 px-1">
                  Links are secured via WhatsApp.
                </p>
              </div>

              <div className="pt-4">
                <button
                  disabled={loading}
                  className="w-full h-14 button-gradient rounded-xl text-white font-bold tracking-widest uppercase flex items-center justify-center gap-3 group transition-all active:scale-95"
                  type="submit"
                >
                  {loading ? "Registering..." : "Get Game Link"}
                  <span className="material-symbols-outlined transition-transform group-hover:translate-x-1">
                    arrow_forward
                  </span>
                </button>
              </div>
            </form>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full p-8 text-center border-t border-white/5 bg-black/20 backdrop-blur-sm z-10">
        <p className="text-[9px] md:text-[10px] text-white/20 tracking-[0.2em] uppercase">
          © 2026 Tech Neura Entertainment. Encrypted Channel.
        </p>
      </footer>
    </div>
  );
}
