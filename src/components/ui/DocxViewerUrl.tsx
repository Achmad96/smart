"use client";

import React, { useEffect, useState } from "react";
import DocxViewer from "./DocxViewer";

interface DocxViewerUrlProps {
  url: string;
  fields?: { name: string; valueText: string }[];
  fieldValues?: Record<string, string>;
  highlightUnfilled?: boolean;
}

export default function DocxViewerUrl({ url, fields = [], fieldValues = {}, highlightUnfilled = false }: DocxViewerUrlProps) {
  const [arrayBuffer, setArrayBuffer] = useState<ArrayBuffer | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    async function loadDocx() {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to load document");
        const buffer = await res.arrayBuffer();
        if (isMounted) setArrayBuffer(buffer);
      } catch (err) {
        if (isMounted) setError(err instanceof Error ? err.message : "Error loading docx");
      }
    }
    
    loadDocx();
    
    return () => { isMounted = false; };
  }, [url]);

  if (error) {
    return <div className="w-full h-full flex items-center justify-center text-rose-400 bg-white rounded-xl">{error}</div>;
  }

  if (!arrayBuffer) {
    return <div className="w-full h-full flex items-center justify-center text-slate-500 bg-white rounded-xl">Loading document...</div>;
  }

  return (
    <DocxViewer 
      arrayBuffer={arrayBuffer} 
      fields={fields} 
      fieldValues={fieldValues} 
      highlightUnfilled={highlightUnfilled} 
    />
  );
}
