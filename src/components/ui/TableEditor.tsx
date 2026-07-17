"use client";

import { useState } from "react";
import Input from "./Input";
import Button from "./Button";

interface TableEditorProps {
  value: string;
  onChange: (val: string) => void;
  label?: string;
}

export default function TableEditor({ value, onChange, label }: TableEditorProps) {
  // Default to a 2x2 grid if empty
  const [grid, setGrid] = useState<string[][]>([
    ["Kolom 1", "Kolom 2"],
    ["", ""]
  ]);
  const [prevValue, setPrevValue] = useState(value);

  if (value !== prevValue) {
    setPrevValue(value);
    try {
      if (value) {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed) && parsed.length > 0 && Array.isArray(parsed[0])) {
          setGrid(parsed);
        }
      }
    } catch {
      // Ignored
    }
  }

  const updateGrid = (newGrid: string[][]) => {
    setGrid(newGrid);
    onChange(JSON.stringify(newGrid));
  };

  const addRow = () => {
    const colCount = grid[0]?.length || 1;
    const newRow = Array(colCount).fill("");
    updateGrid([...grid, newRow]);
  };

  const removeRow = (rowIndex: number) => {
    if (grid.length <= 1) return; // Must have at least header row
    const newGrid = [...grid];
    newGrid.splice(rowIndex, 1);
    updateGrid(newGrid);
  };

  const addColumn = () => {
    const newGrid = grid.map((row, i) => {
      return [...row, i === 0 ? `Kolom ${row.length + 1}` : ""];
    });
    updateGrid(newGrid);
  };

  const removeColumn = (colIndex: number) => {
    if ((grid[0]?.length || 0) <= 1) return; // Must have at least one column
    const newGrid = grid.map((row) => {
      const newRow = [...row];
      newRow.splice(colIndex, 1);
      return newRow;
    });
    updateGrid(newGrid);
  };

  const handleChange = (rowIndex: number, colIndex: number, val: string) => {
    const newGrid = [...grid];
    newGrid[rowIndex] = [...newGrid[rowIndex]];
    newGrid[rowIndex][colIndex] = val;
    updateGrid(newGrid);
  };

  return (
    <div className="space-y-2">
      {label && <label className="block text-xs font-semibold text-slate-600 mb-1">{label}</label>}
      
      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white/[0.02]">
        <div className="overflow-x-auto p-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                {grid[0]?.map((header, colIndex) => (
                  <th key={colIndex} className="p-1 min-w-[120px] relative group">
                    <Input
                      value={header}
                      onChange={(e) => handleChange(0, colIndex, e.target.value)}
                      className="font-semibold text-center bg-slate-100 border-transparent focus:border-primary-500/50"
                    />
                    {grid[0].length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeColumn(colIndex)}
                        className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-slate-900 opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs transition-opacity shadow-lg cursor-pointer"
                        title="Hapus Kolom"
                      >
                        ×
                      </button>
                    )}
                  </th>
                ))}
                <th className="p-1 w-10 text-center align-middle">
                  <button
                    type="button"
                    onClick={addColumn}
                    className="w-6 h-6 rounded flex items-center justify-center text-primary-400 hover:bg-primary-500/10 transition-colors mx-auto cursor-pointer"
                    title="Tambah Kolom"
                  >
                    +
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {grid.slice(1).map((row, rowIndex) => (
                <tr key={rowIndex + 1}>
                  {row.map((cell, colIndex) => (
                    <td key={colIndex} className="p-1">
                      <Input
                        value={cell}
                        onChange={(e) => handleChange(rowIndex + 1, colIndex, e.target.value)}
                      />
                    </td>
                  ))}
                  <td className="p-1 text-center align-middle">
                    <button
                      type="button"
                      onClick={() => removeRow(rowIndex + 1)}
                      className="w-6 h-6 rounded flex items-center justify-center text-rose-400 hover:bg-rose-500/10 transition-colors mx-auto cursor-pointer"
                      title="Hapus Baris"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-2 border-t border-slate-200 flex justify-center">
          <Button type="button" variant="ghost" size="sm" onClick={addRow} className="text-primary-400">
            + Tambah Baris
          </Button>
        </div>
      </div>
    </div>
  );
}
