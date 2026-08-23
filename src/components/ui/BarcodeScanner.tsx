import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { X, ScanLine, Keyboard, AlertCircle, Loader2 } from 'lucide-react';

interface BarcodeScannerProps {
  onDetected: (barcode: string) => void;
  onClose: () => void;
  title?: string;
}

/**
 * Barcode scanner modal.
 *
 * Uses the browser-native BarcodeDetector API (Chrome/Edge desktop + Android)
 * to read a barcode from the device camera. If the API is unavailable, the
 * camera is blocked, or there's no webcam, it falls back to manual entry so
 * the feature is always usable. Requires a secure context (https / localhost)
 * for camera access.
 */
const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onDetected, onClose, title = 'Scan barcode' }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<number | null>(null);
  const stoppedRef = useRef(false);

  const [starting, setStarting] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [manual, setManual] = useState('');

  const supported = useMemo(
    () => typeof window !== 'undefined' && 'BarcodeDetector' in window,
    []
  );

  const stopCamera = () => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const fire = (code: string) => {
    const value = (code || '').trim();
    if (!value || stoppedRef.current) return;
    stoppedRef.current = true;
    stopCamera();
    onDetected(value);
  };

  const handleClose = () => {
    stoppedRef.current = true;
    stopCamera();
    onClose();
  };

  useEffect(() => {
    stoppedRef.current = false;

    const start = async () => {
      if (!supported) return;
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError('Camera access is not available here. Type the barcode below instead.');
        return;
      }
      try {
        setStarting(true);
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        });
        if (stoppedRef.current) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          video.setAttribute('playsinline', 'true');
          await video.play().catch(() => {});
        }

        const detector = new (window as any).BarcodeDetector();
        intervalRef.current = window.setInterval(async () => {
          if (stoppedRef.current || !videoRef.current) return;
          if (videoRef.current.readyState < 2) return;
          try {
            const codes = await detector.detect(videoRef.current);
            if (codes && codes.length) {
              const raw = codes[0]?.rawValue;
              if (raw) fire(String(raw));
            }
          } catch {
            /* transient per-frame detect errors are safe to ignore */
          }
        }, 300);
      } catch (e: any) {
        setCameraError(
          e?.name === 'NotAllowedError'
            ? 'Camera permission was denied. You can type the barcode instead.'
            : 'Could not start the camera. You can type the barcode instead.'
        );
      } finally {
        setStarting(false);
      }
    };

    start();
    return () => {
      stoppedRef.current = true;
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supported]);

  const submitManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (manual.trim()) fire(manual);
  };

  const showCamera = supported && !cameraError;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-ink/60 backdrop-blur-sm"
        onClick={handleClose}
      />
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 320, damping: 30 }}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative w-full max-w-md bg-paper border border-hairline rounded shadow-xl shadow-black/10"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-hairline">
          <h3 className="font-display font-semibold text-ink text-sm uppercase tracking-wide flex items-center gap-2">
            <ScanLine size={16} className="text-accent" /> {title}
          </h3>
          <button
            onClick={handleClose}
            className="p-1.5 text-grey hover:text-ink hover:bg-slate-100 rounded transition-colors cursor-pointer"
            aria-label="Close scanner"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {showCamera ? (
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded bg-black">
              <video
                ref={videoRef}
                muted
                playsInline
                className="w-full h-full object-cover"
              />
              {/* Reticle */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="w-3/4 h-1/2 border-2 border-white/80 rounded-sm shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
              </div>
              {starting && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <Loader2 size={22} className="text-white animate-spin" />
                </div>
              )}
              <p className="absolute bottom-2 left-0 right-0 text-center text-[11px] text-white/90 font-medium">
                Point the camera at a barcode
              </p>
            </div>
          ) : (
            <div className="flex items-start gap-3 bg-slate-50 border border-hairline rounded p-4">
              <AlertCircle size={16} className="text-grey mt-0.5 flex-shrink-0" />
              <p className="text-xs text-ink-soft font-medium leading-relaxed">
                {supported
                  ? cameraError
                  : 'Live camera scanning isn’t supported in this browser. Use Chrome or Edge for camera scanning, or type the barcode below.'}
              </p>
            </div>
          )}

          {/* Manual entry — always available */}
          <form onSubmit={submitManual} className="space-y-2">
            <label className="text-[10px] font-semibold text-grey uppercase tracking-[0.14em] ml-0.5 flex items-center gap-1">
              <Keyboard size={12} /> Enter barcode manually
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                inputMode="numeric"
                autoFocus={!showCamera}
                value={manual}
                onChange={(e) => setManual(e.target.value)}
                placeholder="e.g. 8901072000123"
                className="flex-1 bg-white border border-hairline rounded px-4 py-3 text-sm font-mono text-ink focus:outline-none focus:border-accent tnum"
              />
              <button
                type="submit"
                disabled={!manual.trim()}
                className="px-5 py-3 rounded text-xs font-semibold uppercase tracking-wide bg-ink hover:bg-accent text-paper transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Use
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default BarcodeScanner;
