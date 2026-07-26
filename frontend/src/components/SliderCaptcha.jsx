import { useEffect, useRef, useState } from "react";
import { ShieldCheck, Check } from "lucide-react";

/**
 * Simple slider CAPTCHA — no third-party dependency.
 * User must drag the knob from left to right to verify.
 * Calls onVerified() when unlocked.
 */
export default function SliderCaptcha({ onVerified }) {
  const trackRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [x, setX] = useState(0);
  const [verified, setVerified] = useState(false);

  const KNOB = 44;

  const trackWidth = () => {
    const w = trackRef.current?.getBoundingClientRect().width || 320;
    return w - KNOB;
  };

  const onDown = (e) => {
    if (verified) return;
    setDragging(true);
    e.preventDefault?.();
  };

  useEffect(() => {
    if (!dragging) return;
    const move = (ev) => {
      const rect = trackRef.current?.getBoundingClientRect();
      if (!rect) return;
      const clientX = ev.touches ? ev.touches[0].clientX : ev.clientX;
      let nx = clientX - rect.left - KNOB / 2;
      nx = Math.max(0, Math.min(nx, trackWidth()));
      setX(nx);
    };
    const up = () => {
      setDragging(false);
      const w = trackWidth();
      if (x >= w - 4) {
        setVerified(true);
        setX(w);
        onVerified?.();
      } else {
        setX(0);
      }
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("touchmove", move, { passive: false });
    window.addEventListener("mouseup", up);
    window.addEventListener("touchend", up);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("touchmove", move);
      window.removeEventListener("mouseup", up);
      window.removeEventListener("touchend", up);
    };
  }, [dragging, x, onVerified]);

  return (
    <div
      ref={trackRef}
      data-testid="slider-captcha"
      className={`relative flex h-12 w-full items-center overflow-hidden rounded-full border select-none ${
        verified ? "border-primary bg-primary/10" : "border-border bg-muted"
      }`}
    >
      <div
        className="absolute inset-y-0 left-0 rounded-full bg-primary/30 transition-none"
        style={{ width: `${x + KNOB / 2}px` }}
      />
      <div
        onMouseDown={onDown}
        onTouchStart={onDown}
        data-testid="slider-captcha-knob"
        className={`absolute top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-border bg-background shadow-md ${
          verified ? "cursor-default" : "cursor-grab active:cursor-grabbing"
        }`}
        style={{ left: `${x + 2}px` }}
      >
        {verified ? <Check className="h-5 w-5 text-primary" /> : <ShieldCheck className="h-5 w-5" />}
      </div>
      <span className={`pointer-events-none w-full text-center text-xs font-semibold ${verified ? "text-primary" : "text-muted-foreground"}`}>
        {verified ? "Terverifikasi" : "Geser untuk verifikasi →"}
      </span>
    </div>
  );
}
