"use client";

import { useState, useRef, useEffect } from "react";
import { X } from "lucide-react";

interface Option {
  id: string;
  name: string;
}

interface ChipPickerProps {
  label: string;
  options: Option[];
  selected: string[];
  onChange: (names: string[]) => void;
  placeholder?: string;
  hint?: string;
}

export function ChipPicker({ label, options, selected, onChange, placeholder, hint }: ChipPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const available = options.filter(
    (o) => !selected.includes(o.name) && o.name.toLowerCase().includes(search.toLowerCase())
  );

  function add(name: string) {
    onChange([...selected, name]);
    setSearch("");
  }

  function remove(name: string) {
    onChange(selected.filter((s) => s !== name));
  }

  return (
    <div>
      <label className="block text-xs font-medium mb-1" style={{ color: "#323130" }}>{label}</label>
      <div ref={ref} className="relative">
        <div
          className="flex flex-wrap gap-1 px-2 py-1 cursor-text min-h-[30px]"
          style={{ border: "1px solid #8a8886", backgroundColor: "#ffffff" }}
          onClick={() => { setOpen(true); }}
        >
          {selected.map((name) => (
            <span
              key={name}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs shrink-0"
              style={{ backgroundColor: "#e1efff", color: "#0078d4" }}
            >
              {name}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); remove(name); }}
                className="hover:opacity-60"
              >
                <X size={9} />
              </button>
            </span>
          ))}
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            placeholder={selected.length === 0 ? (placeholder ?? "Select…") : ""}
            className="flex-1 min-w-[80px] text-xs outline-none bg-transparent py-0.5"
            style={{ color: "#323130" }}
          />
        </div>

        {open && (
          <div
            className="absolute z-50 w-full mt-0.5 overflow-auto shadow-md"
            style={{ border: "1px solid #edebe9", backgroundColor: "#ffffff", maxHeight: "180px" }}
          >
            {available.length === 0 ? (
              <div className="px-3 py-2 text-xs" style={{ color: "#a19f9d" }}>
                {options.length === 0 ? "No options — add some first" : search ? `No match for "${search}"` : "All options selected"}
              </div>
            ) : (
              available.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => add(opt.name)}
                  className="w-full text-left px-3 py-1.5 text-xs transition-colors"
                  style={{ color: "#323130", borderBottom: "1px solid #f3f2f1" }}
                  onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = "#f3f2f1"}
                  onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = ""}
                >
                  {opt.name}
                </button>
              ))
            )}
          </div>
        )}
      </div>
      {hint && <p className="text-xs mt-0.5" style={{ color: "#a19f9d" }}>{hint}</p>}
    </div>
  );
}
