"use client";

import { useState } from "react";
import Input from "./Input";
import Button from "./Button";

interface ListEditorProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  label?: string;
}

export default function ListEditor({ value, onChange, placeholder, label }: ListEditorProps) {
  const [items, setItems] = useState<string[]>([]);
  const [prevValue, setPrevValue] = useState(value);

  if (value !== prevValue) {
    setPrevValue(value);
    try {
      if (value) {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          setItems(parsed);
        }
      } else {
        setItems([]);
      }
    } catch {
      if (!value) setItems([]);
    }
  }

  const updateItems = (newItems: string[]) => {
    setItems(newItems);
    onChange(JSON.stringify(newItems));
  };

  const handleAdd = () => {
    updateItems([...items, ""]);
  };

  const handleRemove = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    updateItems(newItems);
  };

  const handleChange = (index: number, val: string) => {
    const newItems = [...items];
    newItems[index] = val;
    updateItems(newItems);
  };

  return (
    <div className="space-y-2">
      {label && <label className="block text-xs font-semibold text-slate-600 mb-1">{label}</label>}
      {items.length === 0 ? (
        <div className="text-center py-4 border border-dashed border-slate-300 rounded-xl bg-slate-100">
          <p className="text-xs text-slate-500 mb-2">Belum ada item daftar</p>
          <Button type="button" variant="secondary" size="sm" onClick={handleAdd}>
            Tambah Item
          </Button>
        </div>
      ) : (
        <div className="space-y-2 border border-slate-200 rounded-xl p-3 bg-slate-100">
          {items.map((item, index) => (
            <div key={index} className="flex gap-2 items-center">
              <span className="text-xs text-slate-500 w-4 text-right">{index + 1}.</span>
              <div className="flex-1">
                <Input value={item} onChange={(e) => handleChange(index, e.target.value)} placeholder={placeholder || "Nilai item"} />
              </div>
              <button type="button" onClick={() => handleRemove(index)} className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
          <Button type="button" variant="ghost" size="sm" onClick={handleAdd} className="mt-2 text-primary-400 w-full justify-center">
            + Tambah Item
          </Button>
        </div>
      )}
    </div>
  );
}
