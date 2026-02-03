// // app/register/page.tsx
// "use client";

// import { useState } from "react";
// import { registerPlayer } from "@/app/actions/register";
// import Image from "next/image";
// import { useRouter } from "next/navigation";

// export default function RegisterPage() {
//   const router = useRouter();
//   const [loading, setLoading] = useState(false);
//   const [message, setMessage] = useState("");

//   async function handleSubmit(formData: FormData) {
//     setLoading(true);
//     const result = await registerPlayer(formData);
//     setLoading(false);

//     if (result.error) {
//       setMessage(result.error);
//     } else {
//       setMessage(
//         "You have successfully registered! Let's get you to the game...",
//       );
//       // Optionally, redirect after a delay
//       setTimeout(() => {
//         router.push(`/game?id=${result.gameID}`);
//       }, 3000);
//     }
//   }
//   return (
//     <div className="min-h-screen flex flex-col items-center relative overflow-hidden">
//       {/* Background Radial Blobs */}
//       <div className="absolute top-[-10%] left-[-10%] w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-primary/10 rounded-full blur-[100px] md:blur-[120px] pointer-events-none" />
//       <div className="absolute bottom-[-10%] right-[-10%] w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-accent-purple/10 rounded-full blur-[100px] md:blur-[120px] pointer-events-none" />

//       <main className="w-full max-w-7xl px-6 flex-1 flex flex-col items-center justify-center py-12 z-10">
//         {/* Branding */}
//         <div className="flex flex-col items-center">
//           <div className="size-30 md:size-50 text-primary drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]">
//             <Image
//               src={"/logo/logo-techneura.png"}
//               width={150}
//               height={150}
//               alt="Techneura Logo"
//             />
//           </div>
//         </div>

//         {/* Form Card */}
//         <div className="w-full max-w-[500px] glass-morphism glowing-border rounded-[2rem] p-8 md:p-10">
//           <div className="text-center mb-10">
//             <h1 className="text-2xl md:text-3xl font-bold mb-2 tracking-tight">
//               TECHNEURA TAP CHALLENGE
//             </h1>
//           </div>
//           {message ? (
//             <div className="p-4 bg-blue-500/20 border border-blue-500 rounded text-center">
//               {message}
//             </div>
//           ) : (
//             <form action={handleSubmit} className="space-y-5 md:space-y-6">
//               <div className="space-y-2">
//                 <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">
//                   Full Name
//                 </label>
//                 <div className="relative">
//                   <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary/60 text-xl">
//                     person
//                   </span>
//                   <input
//                     className="input-premium w-full h-14 pl-12 pr-4 rounded-xl placeholder:text-white/20"
//                     placeholder="Johnathan Doe"
//                     type="text"
//                     required
//                     name="full_name"
//                   />
//                 </div>
//               </div>

//               <div className="space-y-2">
//                 <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">
//                   Nickname
//                 </label>
//                 <div className="relative">
//                   <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary/60 text-xl">
//                     alternate_email
//                   </span>
//                   <input
//                     className="input-premium w-full h-14 pl-12 pr-4 rounded-xl placeholder:text-white/20"
//                     placeholder="GhostRunner_99"
//                     type="text"
//                     name="nickname"
//                     required
//                   />
//                 </div>
//               </div>

//               <div className="space-y-2">
//                 <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">
//                   Email Address
//                 </label>
//                 <div className="relative">
//                   <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary/60 text-xl">
//                     mail
//                   </span>
//                   <input
//                     className="input-premium w-full h-14 pl-12 pr-4 rounded-xl placeholder:text-white/20"
//                     placeholder="nexus@domain.com"
//                     name="email"
//                     type="email"
//                     required
//                   />
//                 </div>
//               </div>

//               <div className="space-y-2">
//                 <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">
//                   Phone Number
//                 </label>
//                 <div className="relative">
//                   <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pr-3 border-r border-white/10">
//                     <span className="material-symbols-outlined text-green-500 text-xl">
//                       chat
//                     </span>
//                   </div>
//                   <input
//                     className="input-premium w-full h-14 pl-16 pr-4 rounded-xl placeholder:text-white/20"
//                     placeholder="+1 (555) 000-0000"
//                     name="phone"
//                     type="tel"
//                     required
//                   />
//                 </div>
//                 {/* <p className="text-[10px] text-white/30 px-1">
//                   Links are secured via WhatsApp.
//                 </p> */}
//               </div>

//               <div className="pt-4">
//                 <button
//                   disabled={loading}
//                   className="w-full h-14 button-gradient rounded-xl text-white font-bold tracking-widest uppercase flex items-center justify-center gap-3 group transition-all active:scale-95"
//                   type="submit"
//                 >
//                   {loading ? "Registering..." : "Enroll Me"}
//                   <span className="material-symbols-outlined transition-transform group-hover:translate-x-1">
//                     arrow_forward
//                   </span>
//                 </button>
//               </div>
//             </form>
//           )}
//         </div>
//       </main>

//       {/* Footer */}
//       <footer className="w-full p-8 text-center border-t border-white/5 bg-black/20 backdrop-blur-sm z-10">
//         <p className="text-[9px] md:text-[10px] text-white/20 tracking-[0.2em] uppercase">
//           © 2026 Tech Neura Entertainment. Encrypted Channel.
//         </p>
//       </footer>
//     </div>
//   );
// }


"use client";

import { useState } from "react";
import { registerPlayer, loginPlayer } from "@/app/actions/register";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showLoginModal, setShowLoginModal] = useState(false);

  // --- REGISTER HANDLER ---
  async function handleRegister(formData: FormData) {
    setLoading(true);
    setMessage("");
    
    const result = await registerPlayer(formData);
    
    setLoading(false);

    if (result.error) {
      setMessage(result.error);
    } else if ("gameID" in result && result.success) {
      setMessage("Success! Redirecting to game...");
      setTimeout(() => {
        router.push(`/game?id=${result.gameID}`);
      }, 1500);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center relative overflow-hidden bg-[#050505] text-white">
      {/* Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />

      <main className="w-full max-w-7xl px-6 flex-1 flex flex-col items-center justify-center py-12 z-10">
        
        {/* Branding */}
        <div className="flex flex-col items-center mb-8">
          <Image
            src={"/logo/logo-techneura.png"}
            width={150}
            height={150}
            alt="Techneura Logo"
            className="drop-shadow-[0_0_25px_rgba(59,130,246,0.6)]"
          />
        </div>

        {/* Form Card */}
        <div className="w-full max-w-[500px] bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 md:p-10 shadow-2xl relative">
          <div className="text-center mb-8">
            <h1 className="text-2xl md:text-3xl font-black italic tracking-tighter mb-2">
              TECHNEURA TAP
            </h1>
            <p className="text-white/40 text-xs font-bold uppercase tracking-[0.2em]">
              New Operator Enrollment
            </p>
          </div>

          {message && (
            <div className={`p-4 rounded-xl text-center text-sm font-bold mb-6 border ${
              message.includes("Success") ? "bg-green-500/20 border-green-500 text-green-400" : "bg-red-500/20 border-red-500 text-red-400"
            }`}>
              {message}
            </div>
          )}

          <form action={handleRegister} className="space-y-5">
            <InputField 
              label="Full Name" 
              icon="person" 
              name="full_name" 
              placeholder="Johnathan Doe" 
              type="text" 
            />
            <InputField 
              label="Nickname" 
              icon="alternate_email" 
              name="nickname" 
              placeholder="GhostRunner_99" 
              type="text" 
            />
            <InputField 
              label="Email Address" 
              icon="mail" 
              name="email" 
              placeholder="nexus@domain.com" 
              type="email" 
            />
            <InputField 
              label="Phone Number" 
              icon="call" 
              name="phone" 
              placeholder="+1 (555) 000-0000" 
              type="tel" 
            />

            <button
              disabled={loading}
              className="w-full h-14 mt-4 bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-500 hover:to-blue-700 rounded-xl text-white font-black tracking-widest uppercase flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(37,99,235,0.3)]"
              type="submit"
            >
              {loading ? "Processing..." : "Enroll Me"}
              <span className="material-symbols-outlined text-lg">arrow_forward</span>
            </button>
          </form>

          {/* Already Registered Button */}
          <div className="mt-6 pt-6 border-t border-white/10 text-center">
            <p className="text-xs text-white/40 mb-3 uppercase tracking-widest">
              Existing Operator?
            </p>
            <button
              onClick={() => setShowLoginModal(true)}
              type="button"
              className="text-sm font-bold text-blue-400 hover:text-blue-300 underline underline-offset-4 decoration-blue-500/30 transition-colors"
            >
               Enter To Game →
            </button>
          </div>
        </div>
      </main>

      {/* --- LOGIN MODAL --- */}
      <AnimatePresence>
        {showLoginModal && (
          <LoginModal 
            onClose={() => setShowLoginModal(false)} 
            router={router} 
          />
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="w-full p-6 text-center border-t border-white/5 bg-black/20 backdrop-blur-sm z-10">
        <p className="text-[10px] text-white/20 tracking-[0.2em] uppercase">
          © 2026 Tech Neura Entertainment. Encrypted Channel.
        </p>
      </footer>
    </div>
  );
}

// --- SUB-COMPONENTS ---

function InputField({ label, icon, type, name, placeholder }: any) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">
        {label}
      </label>
      <div className="relative group">
        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-blue-500 transition-colors text-xl">
          {icon}
        </span>
        <input
          className="w-full h-14 pl-12 pr-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/20 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all font-medium"
          placeholder={placeholder}
          type={type}
          name={name}
          required
        />
      </div>
    </div>
  );
}

function LoginModal({ onClose, router }: { onClose: () => void; router: any }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await loginPlayer(email);
    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else if ("gameID" in result && result.success) {
      // Validated: User exists AND is not active elsewhere
      router.push(`/game?id=${result.gameID}`);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 shadow-2xl relative"
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-white/20 hover:text-white transition-colors"
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        <div className="text-center mb-6">
          <div className="size-12 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-500/20">
            <span className="material-symbols-outlined text-blue-500">lock_open</span>
          </div>
          <h2 className="text-xl font-black uppercase italic">Re-Establish Link</h2>
          <p className="text-xs text-white/40 mt-1 uppercase tracking-wider">Enter email to resume session</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold text-center rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-xl">
              mail
            </span>
            <input
              className="w-full h-14 pl-12 pr-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/20 focus:outline-none focus:border-blue-500/50 transition-all"
              placeholder="nexus@domain.com"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <button
            disabled={loading}
            className="w-full h-12 bg-white text-black font-black uppercase tracking-widest rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            {loading ? "Verifying..." : "Enter Game"}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}