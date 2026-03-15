"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

export function AmbientSound() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  const startedRef = useRef(false);

  const startAudio = useCallback(() => {
    if (startedRef.current) return;
    const audio = audioRef.current;
    if (!audio) return;
    // iOS Safari requires play() in the same call stack as user gesture
    audio.play().then(() => {
      startedRef.current = true;
      setStarted(true);
      setPlaying(true);
    }).catch(() => {
      // Retry: some browsers need the audio to be loaded first
      audio.load();
      audio.play().then(() => {
        startedRef.current = true;
        setStarted(true);
        setPlaying(true);
      }).catch(() => {});
    });
  }, []);

  useEffect(() => {
    const handler = () => startAudio();
    document.addEventListener("touchstart", handler, { once: true, passive: true });
    document.addEventListener("click", handler, { once: true });
    return () => {
      document.removeEventListener("touchstart", handler);
      document.removeEventListener("click", handler);
    };
  }, [startAudio]);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play().then(() => setPlaying(true)).catch(() => {});
    }
  };

  return (
    <>
      {/* Audio element in DOM — required for iOS Safari */}
      <audio
        ref={audioRef}
        src="/audio/beach-ambient.mp3"
        loop
        playsInline
        preload="auto"
        style={{ display: "none" }}
      />
      {started && (
        <button
          onClick={toggle}
          className="fixed top-4 right-4 z-[9998] w-9 h-9 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/60 hover:text-white/90 transition-colors"
          aria-label={playing ? "Oprește sunetul" : "Pornește sunetul"}
        >
          {playing ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>
      )}
    </>
  );
}
