"use client";

import { useState } from "react";
import { X, ZoomIn } from "lucide-react";

export function ArchitecturePreview() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Inline preview with click-to-expand */}
      <div
        className="w-full overflow-hidden relative group cursor-zoom-in"
        style={{ border: "1px solid #edebe9", backgroundColor: "#faf9f8" }}
        onClick={() => setOpen(true)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/architecture.svg"
          alt="STEPv5 WC System Architecture"
          className="w-full h-auto transition-transform duration-200 group-hover:scale-[1.01]"
        />
        {/* Hover overlay */}
        <div
          className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ backgroundColor: "rgba(0,0,0,0.12)" }}
        >
          <div
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium"
            style={{ backgroundColor: "rgba(0,0,0,0.65)", color: "#fff" }}
          >
            <ZoomIn size={13} />
            Click to expand
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.82)" }}
          onClick={() => setOpen(false)}
        >
          {/* Close button */}
          <button
            onClick={() => setOpen(false)}
            className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center transition-colors"
            style={{ backgroundColor: "rgba(255,255,255,0.12)", color: "#fff" }}
            title="Close"
          >
            <X size={18} />
          </button>

          {/* Image container */}
          <div
            className="relative overflow-auto max-w-full max-h-full"
            style={{ width: "min(1200px, 95vw)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/architecture.svg"
              alt="STEPv5 WC System Architecture"
              className="w-full h-auto"
              style={{ boxShadow: "0 8px 48px rgba(0,0,0,0.5)" }}
            />
            <p
              className="text-center text-xs mt-3"
              style={{ color: "rgba(255,255,255,0.5)" }}
            >
              STEPv5 WC — System Architecture · Click outside to close
            </p>
          </div>
        </div>
      )}
    </>
  );
}
