"use client";

import { useState } from "react";
import { Lock, RefreshCw } from "lucide-react";
import type { PromoBanner } from "@/types";
import BannerManager from "@/components/BannerManager";

export default function LoftPage() {
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [storedPassword, setStoredPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [banners, setBanners] = useState<PromoBanner[]>([]);

  async function handleLogin() {
    if (!password.trim()) {
      setError("Introdu parola.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/banners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, category: "loft", action: "list" }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setBanners(json.data);
      setStoredPassword(password);
      setAuthenticated(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Eroare.");
    } finally {
      setLoading(false);
    }
  }

  async function refresh() {
    setLoading(true);
    try {
      const res = await fetch("/api/banners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: storedPassword, category: "loft", action: "list" }),
      });
      const json = await res.json();
      if (json.success) setBanners(json.data);
    } finally {
      setLoading(false);
    }
  }

  if (!authenticated) {
    return (
      <div className="min-h-dvh bg-[#0A0A0A] flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <img
              src="https://loftlounge.ro/wp-content/uploads/2025/07/LOFT-White-Transparent-LOGO-1024x330.png"
              alt="LOFT"
              className="h-12 object-contain mx-auto mb-4 opacity-80"
            />
            <h1 className="text-2xl font-bold text-white tracking-wide">
              Manager Bannere
            </h1>
            <p className="text-white/40 text-xs mt-1">LOFT Lounge</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-[#C9AB81] uppercase tracking-[0.2em] mb-2 block">
                Parolă
              </label>
              <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-3 focus-within:border-[#C9AB81]/50 transition-colors">
                <Lock className="w-4 h-4 text-white/30 shrink-0" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  className="flex-1 bg-transparent outline-none text-white text-sm placeholder:text-white/20"
                  placeholder="Introdu parola LOFT"
                  autoFocus
                />
              </div>
            </div>

            {error && <p className="text-red-400 text-xs">{error}</p>}

            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-[#C9AB81] text-[#0A0A0A] py-3.5 font-bold text-sm tracking-[0.15em] uppercase active:opacity-80 transition-opacity disabled:opacity-50"
            >
              {loading ? "Se verifică..." : "Autentificare"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[#0A0A0A] text-white">
      {/* Header */}
      <div className="bg-[#0A0A0A]/95 backdrop-blur-md border-b border-white/[0.06] px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold tracking-wide">Bannere LOFT</h1>
            <p className="text-[#C9AB81] text-[10px] tracking-[0.2em] uppercase">
              Manager evenimente & promoții
            </p>
          </div>
          <button
            onClick={refresh}
            disabled={loading}
            className="w-9 h-9 flex items-center justify-center bg-white/10 active:bg-white/20 transition-colors"
          >
            <RefreshCw
              className={`w-4 h-4 text-white/60 ${loading ? "animate-spin" : ""}`}
            />
          </button>
        </div>
      </div>

      <div className="px-4 py-4">
        <p className="text-white/30 text-xs mb-4">
          {banners.length} bannere · Acestea apar pe pagina clienților în secțiunea LOFT
        </p>
        <BannerManager
          category="loft"
          password={storedPassword}
          banners={banners}
          onUpdate={setBanners}
        />
      </div>
    </div>
  );
}
