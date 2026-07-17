"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as docx from "docx-preview";

interface DocxViewerProps {
  arrayBuffer: ArrayBuffer | null;
  fields?: { name: string; valueText: string; occurrenceIndex?: number }[];
  fieldValues?: Record<string, string>;
  highlightUnfilled?: boolean;
}

import { buildSearchRegexStr } from "@/lib/utils";

export default function DocxViewer({ arrayBuffer, fields = [], fieldValues = {}, highlightUnfilled = false }: DocxViewerProps) {
  const displayContainerRef = useRef<HTMLDivElement>(null);
  const rawContainerRef = useRef<HTMLDivElement>(null);
  const styleContainerRef = useRef<HTMLDivElement>(null);
  const outerRef = useRef<HTMLDivElement>(null);
  const [isRawRendered, setIsRawRendered] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [scaledHeight, setScaledHeight] = useState<number | undefined>(undefined);
  const [translateX, setTranslateX] = useState(0);

  // 1. Render the raw DOCX exactly once when arrayBuffer changes.
  useEffect(() => {
    if (!rawContainerRef.current || !styleContainerRef.current || !arrayBuffer) return;

    let isMounted = true;
    setIsRawRendered(false);
    setRenderError(null);

    const renderRawDocx = async () => {
      try {
        const bufferCopy = arrayBuffer.slice(0);

        await docx.renderAsync(bufferCopy, rawContainerRef.current!, styleContainerRef.current!, {
          inWrapper: false,
          ignoreWidth: false,
          ignoreHeight: false,
          breakPages: true
        });

        if (isMounted) setIsRawRendered(true);
      } catch (err) {
        console.error("Error rendering raw docx:", err);
        if (isMounted) {
          setRenderError("Gagal merender dokumen. Pastikan file adalah format DOCX yang valid (bukan file .doc lama).");
        }
      }
    };

    renderRawDocx();

    return () => {
      isMounted = false;
    };
  }, [arrayBuffer]);

  // Measure the document page width and compute scale to fit the container
  const computeScale = useCallback(() => {
    if (!displayContainerRef.current || !outerRef.current) return;

    const containerWidth = outerRef.current.clientWidth;
    // docx-preview renders each page as a <section> with an inline width
    const firstSection = displayContainerRef.current.querySelector("section");
    if (!firstSection) return;

    const docWidth = firstSection.scrollWidth || firstSection.offsetWidth;
    if (docWidth > 0 && containerWidth > 0) {
      // Allow scaling up to fit the container so there's no empty space on the sides
      const s = containerWidth / docWidth;
      setScale(s);
      // The transform only changes visual size, not layout size.
      // Set the wrapper height to the scaled content height so scrolling works correctly.
      const contentHeight = displayContainerRef.current.scrollHeight;
      setScaledHeight(contentHeight * s);

      // Center visually by translating the extra space
      const visualWidth = docWidth * s;
      const extraSpace = Math.max(0, containerWidth - visualWidth);
      setTranslateX(extraSpace / 2);
    }
  }, []);

  // 2. Clone the raw DOM and apply text replacements.
  useEffect(() => {
    if (!isRawRendered || !rawContainerRef.current || !displayContainerRef.current) return;

    // Fast DOM clone instead of re-parsing the DOCX binary
    displayContainerRef.current.innerHTML = rawContainerRef.current.innerHTML;

    if (fields.length > 0) {
      // Group fields by their search regex to process occurrences safely
      const fieldsByRegex: Record<string, typeof fields> = {};
      fields.forEach((f) => {
        if (!f.valueText) return;
        const regexStr = buildSearchRegexStr(f.valueText, true);
        if (!regexStr) return;
        if (!fieldsByRegex[regexStr]) fieldsByRegex[regexStr] = [];
        fieldsByRegex[regexStr].push(f);
      });

      // Process each regex group, longest regex first to prevent partial matches
      Object.entries(fieldsByRegex)
        .sort((a, b) => b[0].length - a[0].length)
        .forEach(([regexStr, regexFields]) => {
          // Sort fields by occurrenceIndex DESCENDING so we replace from the bottom up.
        const sortedFields = [...regexFields].sort((a, b) => {
          const indexA = a.occurrenceIndex || 0;
          const indexB = b.occurrenceIndex || 0;
          return indexB - indexA;
        });

        sortedFields.forEach((f) => {
          const val = fieldValues[f.name];
          const shouldReplace = val || highlightUnfilled;
          if (!shouldReplace) return;

          const displayVal = val || f.valueText;
          let spanClass = "";
          if (highlightUnfilled && !val) {
            spanClass = "bg-primary-500/30 text-primary-900 border-primary-500/50 rounded px-1 border border-transparent";
          }

          const treeWalker = document.createTreeWalker(displayContainerRef.current!, NodeFilter.SHOW_TEXT);
          let currentNode: Node | null;
          const textNodes: { node: Node; text: string; start: number; end: number; isVirtual?: boolean }[] = [];
          let fullText = "";
          let lastBlockParent: Node | null = null;

          const blockTags = new Set(["P", "DIV", "TR", "TD", "LI", "SECTION", "TABLE", "H1", "H2", "H3", "H4", "H5", "H6"]);
          const getBlockParent = (node: Node) => {
            let curr = node.parentNode;
            while (curr) {
              if (curr.nodeName && blockTags.has(curr.nodeName.toUpperCase())) return curr;
              curr = curr.parentNode;
            }
            return null;
          };

          while ((currentNode = treeWalker.nextNode())) {
            const currentBlockParent = getBlockParent(currentNode);
            if (lastBlockParent && currentBlockParent !== lastBlockParent) {
              fullText += "\n";
              textNodes.push({ node: currentNode, text: "\n", start: fullText.length - 1, end: fullText.length, isVirtual: true });
            }

            const text = currentNode.nodeValue || "";
            textNodes.push({ node: currentNode, text, start: fullText.length, end: fullText.length + text.length });
            fullText += text;
            lastBlockParent = currentBlockParent;
          }

          const searchRegex = new RegExp(regexStr, "g");
          let matchStart = -1;
          let matchEnd = -1;
          const skipsNeeded = f.occurrenceIndex || 0;
          let skipsPassed = 0;
          let regexMatch;

          while ((regexMatch = searchRegex.exec(fullText)) !== null) {
            if (skipsPassed === skipsNeeded) {
              matchStart = regexMatch.index;
              matchEnd = regexMatch.index + regexMatch[0].length;
              break;
            }
            skipsPassed++;
          }

          if (matchStart === -1 || matchEnd === -1) return;

          const affectedNodes = textNodes.filter((n) => n.start < matchEnd && n.end > matchStart);
          if (affectedNodes.length === 0) return;

          const firstNodeInfo = affectedNodes[0];
          const firstNode = firstNodeInfo.node;
          const beforeText = firstNodeInfo.text.substring(0, matchStart - firstNodeInfo.start);

          const lastNodeInfo = affectedNodes[affectedNodes.length - 1];
          const afterText = lastNodeInfo.text.substring(matchEnd - lastNodeInfo.start);

          let injectedNode: Node;
          const span = document.createElement("span");
          span.style.whiteSpace = "pre-wrap";
          span.style.fontFamily = "inherit"; // Fit the majority of the document's font

          if (highlightUnfilled && !val) {
            span.style.backgroundColor = "rgba(99, 102, 241, 0.3)";
            span.style.color = "rgba(49, 46, 129, 1)";
            span.style.border = "1px dashed rgba(99, 102, 241, 0.6)";
            span.style.borderRadius = "4px";
            span.style.padding = "0 4px";
          }

          span.textContent = displayVal;
          injectedNode = span;

          const parent = firstNode.parentNode;
          if (parent) {
            if (beforeText) parent.insertBefore(document.createTextNode(beforeText), firstNode);
            parent.insertBefore(injectedNode, firstNode);
            if (afterText) parent.insertBefore(document.createTextNode(afterText), firstNode);

            affectedNodes.forEach((n) => {
              if (!n.isVirtual && n.node.parentNode) n.node.parentNode.removeChild(n.node);
            });
          }
        });
      });
    }

    // Compute scale after DOM is ready
    requestAnimationFrame(computeScale);
  }, [isRawRendered, fields, fieldValues, highlightUnfilled, computeScale]);

  // 3. Observe container resize to recompute scale
  useEffect(() => {
    if (!outerRef.current) return;
    const observer = new ResizeObserver(computeScale);
    observer.observe(outerRef.current);
    return () => observer.disconnect();
  }, [computeScale]);

  return (
    <>
      {/* Style container: visible so <style> tags rendered by docx-preview are active */}
      <div ref={styleContainerRef} className="docx-style-host" />
      {/* Raw body container: off-screen (NOT display:none, to allow CSS parsing) */}
      <div ref={rawContainerRef} style={{ position: "absolute", left: "-9999px", top: "-9999px", width: "1px", height: "1px", overflow: "hidden" }} />
      {renderError ? (
        <div className="w-full h-full flex flex-col items-center justify-center text-rose-500 bg-rose-500/5 rounded-xl p-6 text-center border border-rose-500/20">
          <svg className="w-10 h-10 mb-3 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="font-medium text-sm">{renderError}</p>
        </div>
      ) : (
        <div ref={outerRef} className="w-full h-full overflow-y-auto overflow-x-hidden rounded-xl docx-preview-container">
          <div className="w-full shrink-0" style={{ height: scaledHeight, overflow: "hidden" }}>
            <div
              ref={displayContainerRef}
              className="docx-preview-scaler"
              style={{
                transform: `translateX(${translateX}px) scale(${scale})`,
                transformOrigin: "top left"
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}
