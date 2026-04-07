"use client";

import { useState } from "react";
import { Plus, Trash2, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/Input";

export interface VariationAttribute {
  name: string;
  options: string[];
}

export interface VariationItem {
  id: string;
  attr: Record<string, string>;
  price: string;
  salePrice: string;
  sku: string;
  manageStock: boolean;
  stock: number | null;
}

export interface VariationsData {
  attributes: VariationAttribute[];
  items: VariationItem[];
}

interface Props {
  value: VariationsData;
  onChange: (data: VariationsData) => void;
}

function uuid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function generateCombinations(attributes: VariationAttribute[]): Record<string, string>[] {
  if (attributes.length === 0) return [];
  const validAttrs = attributes.filter((a) => a.name && a.options.length > 0);
  if (validAttrs.length === 0) return [];

  let combos: Record<string, string>[] = [{}];
  for (const attr of validAttrs) {
    const next: Record<string, string>[] = [];
    for (const combo of combos) {
      for (const option of attr.options) {
        next.push({ ...combo, [attr.name]: option });
      }
    }
    combos = next;
  }
  return combos;
}

export function VariationsEditor({ value, onChange }: Props) {
  const [newAttrName, setNewAttrName] = useState("");
  const [newAttrOptions, setNewAttrOptions] = useState("");

  function addAttribute() {
    if (!newAttrName.trim()) return;
    const options = newAttrOptions.split(",").map((s) => s.trim()).filter(Boolean);
    onChange({
      ...value,
      attributes: [...value.attributes, { name: newAttrName.trim(), options }],
    });
    setNewAttrName("");
    setNewAttrOptions("");
  }

  function removeAttribute(idx: number) {
    const newAttrs = value.attributes.filter((_, i) => i !== idx);
    onChange({ attributes: newAttrs, items: value.items });
  }

  function updateAttributeOptions(idx: number, optStr: string) {
    const options = optStr.split(",").map((s) => s.trim()).filter(Boolean);
    const attrs = [...value.attributes];
    attrs[idx] = { ...attrs[idx], options };
    onChange({ ...value, attributes: attrs });
  }

  function generateVariations() {
    const combos = generateCombinations(value.attributes);
    const existing = new Map(value.items.map((item) => [JSON.stringify(item.attr), item]));

    const items: VariationItem[] = combos.map((attr) => {
      const key = JSON.stringify(attr);
      return existing.get(key) || {
        id: uuid(),
        attr,
        price: "",
        salePrice: "",
        sku: "",
        manageStock: false,
        stock: null,
      };
    });
    onChange({ ...value, items });
  }

  function updateItem(idx: number, updates: Partial<VariationItem>) {
    const items = [...value.items];
    items[idx] = { ...items[idx], ...updates };
    onChange({ ...value, items });
  }

  function removeItem(idx: number) {
    onChange({ ...value, items: value.items.filter((_, i) => i !== idx) });
  }

  return (
    <div className="space-y-5">
      {/* Attributes */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#605e5c" }}>
          Attributes
        </p>
        <div className="space-y-2">
          {value.attributes.map((attr, idx) => (
            <div key={idx} className="flex items-center gap-2 p-3" style={{ border: "1px solid #edebe9", backgroundColor: "#faf9f8" }}>
              <span className="text-sm font-medium w-24 shrink-0" style={{ color: "#323130" }}>{attr.name}</span>
              <input
                className="flex-1 px-2 py-1 text-sm focus:outline-none"
                style={{ border: "1px solid #8a8886" }}
                value={attr.options.join(", ")}
                onChange={(e) => updateAttributeOptions(idx, e.target.value)}
                placeholder="Options (comma-separated)"
              />
              <button onClick={() => removeAttribute(idx)} className="p-1" style={{ color: "#a4262c" }}>
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Add attribute */}
        <div className="flex gap-2 mt-2">
          <input
            className="px-2 py-1.5 text-sm focus:outline-none w-32"
            style={{ border: "1px solid #8a8886" }}
            value={newAttrName}
            onChange={(e) => setNewAttrName(e.target.value)}
            placeholder="Name (e.g. Color)"
          />
          <input
            className="flex-1 px-2 py-1.5 text-sm focus:outline-none"
            style={{ border: "1px solid #8a8886" }}
            value={newAttrOptions}
            onChange={(e) => setNewAttrOptions(e.target.value)}
            placeholder="Options: Red, Blue, Green"
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addAttribute(); } }}
          />
          <button
            type="button"
            onClick={addAttribute}
            className="px-3 py-1.5 text-sm inline-flex items-center gap-1"
            style={{ backgroundColor: "#f3f2f1", border: "1px solid #8a8886", color: "#323130" }}
          >
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        </div>
      </div>

      {/* Generate button */}
      {value.attributes.length > 0 && (
        <button
          type="button"
          onClick={generateVariations}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm"
          style={{ backgroundColor: "#deecf9", color: "#0078d4", border: "1px solid #0078d4" }}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Generate / Refresh Variations
        </button>
      )}

      {/* Variation Items */}
      {value.items.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#605e5c" }}>
            Variations ({value.items.length})
          </p>
          <div className="space-y-2">
            {value.items.map((item, idx) => (
              <div key={item.id} className="p-3 space-y-2" style={{ border: "1px solid #edebe9" }}>
                <div className="flex items-center justify-between">
                  <div className="flex gap-1 flex-wrap">
                    {Object.entries(item.attr).map(([k, v]) => (
                      <span key={k} className="text-xs px-2 py-0.5" style={{ backgroundColor: "#f4f0ff", color: "#6b2fa0" }}>
                        {k}: {v}
                      </span>
                    ))}
                  </div>
                  <button onClick={() => removeItem(idx)} style={{ color: "#a4262c" }}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <Input label="Price" value={item.price} onChange={(e) => updateItem(idx, { price: e.target.value })} placeholder="10.00" />
                  <Input label="Sale Price" value={item.salePrice} onChange={(e) => updateItem(idx, { salePrice: e.target.value })} placeholder="optional" />
                  <Input label="SKU" value={item.sku} onChange={(e) => updateItem(idx, { sku: e.target.value })} placeholder="optional" />
                  <div className="flex flex-col gap-1">
                    <label className="flex items-center gap-2 text-xs mt-5 cursor-pointer" style={{ color: "#323130" }}>
                      <input
                        type="checkbox"
                        checked={item.manageStock}
                        onChange={(e) => updateItem(idx, { manageStock: e.target.checked, stock: e.target.checked ? (item.stock ?? 0) : null })}
                        className="w-4 h-4 accent-blue-600"
                      />
                      Track Stock
                    </label>
                    {item.manageStock && (
                      <input
                        type="number"
                        className="px-2 py-1.5 text-sm focus:outline-none"
                        style={{ border: "1px solid #8a8886" }}
                        value={item.stock ?? ""}
                        onChange={(e) => updateItem(idx, { stock: e.target.value ? parseInt(e.target.value) : null })}
                        placeholder="Qty"
                      />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
