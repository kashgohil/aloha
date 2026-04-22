"use client";

// Image crop + straighten dialog. Wraps react-easy-crop so the user can
// adjust the visible area, zoom in/out, and rotate before the final blob is
// uploaded. Outputs a PNG blob at a fixed target size (512×512 for circle,
// 1600×1000 for rect) so downstream consumers get predictable dimensions.

import { Dialog } from "@base-ui/react/dialog";
import { Loader2, RotateCcw, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";

export type CropShape = "circle" | "rect";

export function ImageCropModal({
  open,
  src,
  shape,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  src: string | null;
  shape: CropShape;
  onCancel: () => void;
  onConfirm: (blob: Blob) => Promise<void> | void;
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [area, setArea] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Reset when the src changes so a new image starts centered.
  useEffect(() => {
    if (!open) return;
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setArea(null);
    setErr(null);
  }, [open, src]);

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setArea(pixels);
  }, []);

  async function handleConfirm() {
    if (!src || !area) return;
    setBusy(true);
    setErr(null);
    try {
      const target = shape === "circle" ? 512 : 1600;
      const height = shape === "circle" ? 512 : 1000;
      const blob = await cropToBlob(src, area, rotation, target, height);
      await onConfirm(blob);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Couldn't crop image.");
    } finally {
      setBusy(false);
    }
  }

  const aspect = shape === "circle" ? 1 : 16 / 10;

  return (
    <Dialog.Root open={open} onOpenChange={(o) => (!o ? onCancel() : null)}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 w-[min(680px,calc(100vw-2rem))] max-h-[calc(100vh-2rem)] -translate-x-1/2 -translate-y-1/2 flex flex-col rounded-3xl border border-border bg-background-elev shadow-xl outline-none">
          <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-border">
            <div>
              <Dialog.Title className="text-[15px] font-medium text-ink">
                Crop & straighten
              </Dialog.Title>
              <Dialog.Description className="mt-0.5 text-[12.5px] text-ink/60">
                Drag to reposition. Use the sliders to zoom and rotate.
              </Dialog.Description>
            </div>
            <button
              type="button"
              onClick={onCancel}
              className="p-1.5 rounded-full text-ink/55 hover:text-ink hover:bg-muted/60 transition-colors"
              aria-label="Cancel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="relative bg-ink">
            <div className="relative w-full aspect-[16/10]">
              {src ? (
                <Cropper
                  image={src}
                  crop={crop}
                  zoom={zoom}
                  rotation={rotation}
                  aspect={aspect}
                  cropShape={shape === "circle" ? "round" : "rect"}
                  showGrid={shape === "rect"}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onRotationChange={setRotation}
                  onCropComplete={onCropComplete}
                />
              ) : null}
            </div>
          </div>

          <div className="px-6 py-5 space-y-4 border-t border-border">
            <SliderRow
              label="Zoom"
              value={zoom}
              min={1}
              max={4}
              step={0.01}
              onChange={setZoom}
              format={(v) => `${Math.round(v * 100)}%`}
            />
            <SliderRow
              label="Rotate"
              value={rotation}
              min={-180}
              max={180}
              step={1}
              onChange={setRotation}
              format={(v) => `${Math.round(v)}°`}
              onReset={() => setRotation(0)}
            />
          </div>

          {err ? (
            <div className="px-6 pb-3 text-[12.5px] text-primary-deep">
              {err}
            </div>
          ) : null}

          <div className="flex items-center justify-between gap-3 px-6 py-4 bg-muted/30 border-t border-border">
            <button
              type="button"
              onClick={onCancel}
              className="text-[13px] text-ink/65 hover:text-ink transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!area || busy}
              className="inline-flex items-center gap-1.5 h-10 px-5 rounded-full bg-ink text-background text-[13px] font-medium hover:bg-primary disabled:opacity-40 disabled:hover:bg-ink transition-colors"
            >
              {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              Apply
            </button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format,
  onReset,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  format: (v: number) => string;
  onReset?: () => void;
}) {
  return (
    <div className="grid grid-cols-[70px_1fr_52px_auto] items-center gap-3">
      <label className="text-[11px] uppercase tracking-[0.22em] text-ink/55">
        {label}
      </label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-ink"
      />
      <span className="text-[12px] tabular-nums text-ink/70">{format(value)}</span>
      {onReset ? (
        <button
          type="button"
          onClick={onReset}
          className="p-1.5 rounded-md text-ink/55 hover:text-ink hover:bg-muted/60 transition-colors"
          aria-label={`Reset ${label.toLowerCase()}`}
          title={`Reset ${label.toLowerCase()}`}
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      ) : null}
    </div>
  );
}

// Render the selected pixel area (plus rotation) to a canvas sized to the
// target dimensions, then produce a PNG blob. Runs entirely in the browser
// so the user sees the cropped image before it touches the server.
async function cropToBlob(
  src: string,
  area: Area,
  rotation: number,
  targetWidth: number,
  targetHeight: number,
): Promise<Blob> {
  const image = await loadImage(src);

  // Rotating around the image center requires drawing to an intermediate
  // canvas large enough to hold the rotated bounding box, then copying out
  // the crop rect.
  const rad = (rotation * Math.PI) / 180;
  const sin = Math.abs(Math.sin(rad));
  const cos = Math.abs(Math.cos(rad));
  const rotW = Math.ceil(image.width * cos + image.height * sin);
  const rotH = Math.ceil(image.width * sin + image.height * cos);

  const work = document.createElement("canvas");
  work.width = rotW;
  work.height = rotH;
  const wctx = work.getContext("2d");
  if (!wctx) throw new Error("Canvas not supported.");
  wctx.translate(rotW / 2, rotH / 2);
  wctx.rotate(rad);
  wctx.drawImage(image, -image.width / 2, -image.height / 2);

  const out = document.createElement("canvas");
  out.width = targetWidth;
  out.height = targetHeight;
  const octx = out.getContext("2d");
  if (!octx) throw new Error("Canvas not supported.");
  octx.drawImage(
    work,
    area.x,
    area.y,
    area.width,
    area.height,
    0,
    0,
    targetWidth,
    targetHeight,
  );

  return new Promise<Blob>((resolve, reject) => {
    out.toBlob((b) => {
      if (!b) reject(new Error("Couldn't encode image."));
      else resolve(b);
    }, "image/png");
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Couldn't load image."));
    img.src = src;
  });
}
