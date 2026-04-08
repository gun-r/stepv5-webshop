"use client";

import { useState } from "react";
import { X, Plus } from "lucide-react";

export interface AttrTerm {
  id: string;
  name: string;
  slug: string;
}

export interface AttrOption {
  id: string;
  name: string;
  slug: string;
  type: string;
  terms: AttrTerm[];
}

export interface AttrSelection {
  id: string;
  name: string;
  slug: string;
  terms: AttrTerm[];
}

interface AttributesPickerProps {
  options: AttrOption[];
  selected: AttrSelection[];
  onChange: (selections: AttrSelection[]) => void;
}

export function AttributesPicker({ options, selected, onChange }: AttributesPickerProps) {
  const [addingId, setAddingId] = useState("");

  const unselected = options.filter((o) => !selected.find((s) => s.id === o.id));

  function addAttribute() {
    const attr = options.find((o) => o.id === addingId);
    if (!attr) return;
    onChange([...selected, { id: attr.id, name: attr.name, slug: attr.slug, terms: [] }]);
    setAddingId("");
  }

  function removeAttribute(id: string) {
    onChange(selected.filter((s) => s.id !== id));
  }

  function toggleTerm(attrId: string, term: AttrTerm) {
    onChange(
      selected.map((s) => {
        if (s.id !== attrId) return s;
        const hasTerm = s.terms.find((t) => t.id === term.id);
        return {
          ...s,
          terms: hasTerm
            ? s.terms.filter((t) => t.id !== term.id)
            : [...s.terms, term],
        };
      })
    );
  }

  if (options.length === 0) {
    return (
      <p className="text-xs" style={{ color: "#a19f9d" }}>
        No attributes defined yet.{" "}
        <a href="/products/attributes" className="hover:underline" style={{ color: "#0078d4" }}>Manage Attributes</a>
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {/* Selected attributes */}
      {selected.map((sel) => {
        const attrDef = options.find((o) => o.id === sel.id);
        return (
          <div key={sel.id} style={{ border: "1px solid #edebe9", backgroundColor: "#faf9f8" }}>
            <div
              className="flex items-center justify-between px-3 py-1.5"
              style={{ borderBottom: sel.terms.length > 0 || (attrDef?.terms.length ?? 0) > 0 ? "1px solid #edebe9" : "none" }}
            >
              <span className="text-xs font-semibold" style={{ color: "#323130" }}>{sel.name}</span>
              <button
                type="button"
                onClick={() => removeAttribute(sel.id)}
                className="hover:opacity-60"
                style={{ color: "#a19f9d" }}
              >
                <X size={12} />
              </button>
            </div>

            {attrDef && attrDef.terms.length > 0 && (
              <div className="px-3 py-2 flex flex-wrap gap-1.5">
                {attrDef.terms.map((term) => {
                  const isSelected = !!sel.terms.find((t) => t.id === term.id);
                  return (
                    <button
                      key={term.id}
                      type="button"
                      onClick={() => toggleTerm(sel.id, term)}
                      className="px-2 py-0.5 text-xs transition-colors"
                      style={
                        isSelected
                          ? { backgroundColor: "#0078d4", color: "#ffffff", border: "1px solid #0078d4" }
                          : { backgroundColor: "#ffffff", color: "#323130", border: "1px solid #c8c6c4" }
                      }
                    >
                      {term.name}
                    </button>
                  );
                })}
              </div>
            )}

            {attrDef && attrDef.terms.length === 0 && (
              <div className="px-3 py-2">
                <p className="text-xs" style={{ color: "#a19f9d" }}>
                  No terms yet.{" "}
                  <a href={`/products/attributes/${sel.id}/terms`} className="hover:underline" style={{ color: "#0078d4" }}>Add terms</a>
                </p>
              </div>
            )}
          </div>
        );
      })}

      {/* Add attribute row */}
      {unselected.length > 0 && (
        <div className="flex gap-1.5 items-center">
          <select
            value={addingId}
            onChange={(e) => setAddingId(e.target.value)}
            className="flex-1 px-2 py-1.5 text-xs outline-none"
            style={{ border: "1px solid #8a8886", color: addingId ? "#323130" : "#a19f9d", backgroundColor: "#ffffff" }}
          >
            <option value="">— Select attribute —</option>
            {unselected.map((o) => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={addAttribute}
            disabled={!addingId}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-white disabled:opacity-40"
            style={{ backgroundColor: "#0078d4" }}
          >
            <Plus size={12} />Add
          </button>
        </div>
      )}

      {unselected.length === 0 && selected.length === options.length && (
        <p className="text-xs" style={{ color: "#a19f9d" }}>All attributes added.</p>
      )}
    </div>
  );
}
