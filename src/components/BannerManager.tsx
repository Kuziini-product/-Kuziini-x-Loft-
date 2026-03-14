"use client";

import { useState, useRef, useCallback } from "react";
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  ImageIcon,
  Save,
  X,
  GripVertical,
} from "lucide-react";
import type { PromoBanner, BannerCategory } from "@/types";

interface BannerManagerProps {
  category: BannerCategory;
  password: string;
  banners: PromoBanner[];
  onUpdate: (banners: PromoBanner[]) => void;
}

export default function BannerManager({
  category,
  password,
  banners,
  onUpdate,
}: BannerManagerProps) {
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ title: "", subtitle: "", emoji: "", image: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const apiCall = useCallback(
    async (action: string, extra: Record<string, unknown> = {}) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/banners", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password, category, action, ...extra }),
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.error);
        onUpdate(json.data);
        return json.data;
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Eroare.");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [password, category, onUpdate]
  );

  function handleImageSelect(callback: (dataUrl: string) => void) {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      // Limit to 500KB
      if (file.size > 500 * 1024) {
        setError("Imaginea trebuie să fie sub 500KB.");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        callback(reader.result as string);
      };
      reader.readAsDataURL(file);
    };
    input.click();
  }

  async function handleAdd() {
    if (!form.title.trim()) {
      setError("Titlul este obligatoriu.");
      return;
    }
    const result = await apiCall("add", {
      title: form.title,
      subtitle: form.subtitle,
      emoji: form.emoji,
      image: form.image || undefined,
    });
    if (result) {
      setForm({ title: "", subtitle: "", emoji: "", image: "" });
      setAdding(false);
    }
  }

  async function handleSaveEdit(banner: PromoBanner) {
    await apiCall("update", {
      bannerId: banner.id,
      title: form.title,
      subtitle: form.subtitle,
      emoji: form.emoji,
      image: form.image || null,
    });
    setEditing(null);
  }

  async function handleDelete(bannerId: string) {
    await apiCall("delete", { bannerId });
  }

  async function handleMove(index: number, direction: "up" | "down") {
    const ids = banners.map((b) => b.id);
    const swapIdx = direction === "up" ? index - 1 : index + 1;
    if (swapIdx < 0 || swapIdx >= ids.length) return;
    [ids[index], ids[swapIdx]] = [ids[swapIdx], ids[index]];
    await apiCall("reorder", { orderedIds: ids });
  }

  function startEdit(banner: PromoBanner) {
    setEditing(banner.id);
    setForm({
      title: banner.title,
      subtitle: banner.subtitle || "",
      emoji: banner.emoji || "",
      image: banner.image || "",
    });
    setAdding(false);
  }

  function startAdd() {
    setAdding(true);
    setEditing(null);
    setForm({ title: "", subtitle: "", emoji: "", image: "" });
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 px-4 py-2">
          <p className="text-red-400 text-xs">{error}</p>
        </div>
      )}

      {/* Banner list */}
      {banners.map((banner, i) => (
        <div
          key={banner.id}
          className="bg-white/[0.03] border border-white/[0.06] p-4"
        >
          {editing === banner.id ? (
            /* Edit form */
            <div className="space-y-3">
              <BannerForm
                form={form}
                setForm={setForm}
                onImageSelect={() =>
                  handleImageSelect((url) => setForm((f) => ({ ...f, image: url })))
                }
              />
              <div className="flex gap-2">
                <button
                  onClick={() => handleSaveEdit(banner)}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#C9AB81] text-[#0A0A0A] py-2 font-bold text-xs tracking-wider uppercase disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  Salvează
                </button>
                <button
                  onClick={() => setEditing(null)}
                  className="px-4 py-2 bg-white/10 text-white/60 text-xs font-bold tracking-wider uppercase"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            /* Display mode */
            <div>
              <div className="flex items-start gap-3">
                {/* Preview */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <GripVertical className="w-4 h-4 text-white/20 shrink-0" />
                    {banner.image ? (
                      <img
                        src={banner.image}
                        alt=""
                        className="w-10 h-10 object-cover rounded shrink-0"
                      />
                    ) : banner.emoji ? (
                      <span className="text-xl shrink-0">{banner.emoji}</span>
                    ) : null}
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-white tracking-wide truncate">
                        {banner.title}
                      </p>
                      {banner.subtitle && (
                        <p className="text-white/40 text-xs truncate">{banner.subtitle}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleMove(i, "up")}
                    disabled={i === 0 || loading}
                    className="w-7 h-7 flex items-center justify-center bg-white/10 disabled:opacity-20"
                  >
                    <ChevronUp className="w-3.5 h-3.5 text-white/60" />
                  </button>
                  <button
                    onClick={() => handleMove(i, "down")}
                    disabled={i === banners.length - 1 || loading}
                    className="w-7 h-7 flex items-center justify-center bg-white/10 disabled:opacity-20"
                  >
                    <ChevronDown className="w-3.5 h-3.5 text-white/60" />
                  </button>
                  <button
                    onClick={() => startEdit(banner)}
                    className="w-7 h-7 flex items-center justify-center bg-white/10 text-[#C9AB81]"
                  >
                    <Save className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(banner.id)}
                    disabled={loading}
                    className="w-7 h-7 flex items-center justify-center bg-red-500/10 text-red-400 disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Add form */}
      {adding ? (
        <div className="bg-white/[0.03] border border-[#C9AB81]/30 p-4 space-y-3">
          <p className="text-[#C9AB81] text-[10px] font-bold tracking-[0.2em] uppercase">
            Banner nou
          </p>
          <BannerForm
            form={form}
            setForm={setForm}
            onImageSelect={() =>
              handleImageSelect((url) => setForm((f) => ({ ...f, image: url })))
            }
          />
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 bg-[#C9AB81] text-[#0A0A0A] py-2 font-bold text-xs tracking-wider uppercase disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" />
              Adaugă
            </button>
            <button
              onClick={() => setAdding(false)}
              className="px-4 py-2 bg-white/10 text-white/60 text-xs font-bold tracking-wider uppercase"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={startAdd}
          className="w-full flex items-center justify-center gap-2 bg-white/[0.06] border border-dashed border-white/[0.1] py-3 text-white/40 text-xs font-bold tracking-wider uppercase active:bg-white/[0.1] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Adaugă banner
        </button>
      )}

      <input ref={fileRef} type="file" accept="image/*" className="hidden" />
    </div>
  );
}

function BannerForm({
  form,
  setForm,
  onImageSelect,
}: {
  form: { title: string; subtitle: string; emoji: string; image: string };
  setForm: React.Dispatch<
    React.SetStateAction<{ title: string; subtitle: string; emoji: string; image: string }>
  >;
  onImageSelect: () => void;
}) {
  return (
    <div className="space-y-2">
      <input
        type="text"
        value={form.title}
        onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
        placeholder="Titlu"
        className="w-full bg-white/5 border border-white/10 px-3 py-2 text-white text-sm outline-none focus:border-[#C9AB81]/50 placeholder:text-white/20"
      />
      <input
        type="text"
        value={form.subtitle}
        onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
        placeholder="Subtitlu (opțional)"
        className="w-full bg-white/5 border border-white/10 px-3 py-2 text-white text-sm outline-none focus:border-[#C9AB81]/50 placeholder:text-white/20"
      />
      <div className="flex gap-2">
        <input
          type="text"
          value={form.emoji}
          onChange={(e) => setForm((f) => ({ ...f, emoji: e.target.value }))}
          placeholder="Emoji"
          className="w-20 bg-white/5 border border-white/10 px-3 py-2 text-white text-sm outline-none focus:border-[#C9AB81]/50 placeholder:text-white/20 text-center"
        />
        <button
          type="button"
          onClick={onImageSelect}
          className="flex-1 flex items-center justify-center gap-2 bg-white/5 border border-white/10 px-3 py-2 text-white/40 text-xs active:bg-white/10 transition-colors"
        >
          <ImageIcon className="w-3.5 h-3.5" />
          {form.image ? "Imagine selectată ✓" : "Încarcă imagine"}
        </button>
      </div>
      {form.image && (
        <div className="flex items-center gap-2">
          <img src={form.image} alt="" className="w-12 h-12 object-cover rounded" />
          <button
            onClick={() => setForm((f) => ({ ...f, image: "" }))}
            className="text-red-400 text-xs underline"
          >
            Șterge imaginea
          </button>
        </div>
      )}
    </div>
  );
}
