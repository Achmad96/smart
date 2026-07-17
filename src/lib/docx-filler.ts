import PizZip from "pizzip";
import { buildSearchRegexStr } from "./utils";

export function fillDocx(arrayBuffer: ArrayBuffer, fields: { name: string; valueText?: string; occurrenceIndex?: number }[], fieldValues: Record<string, string>): Blob {
  const zip = new PizZip(arrayBuffer);
  
  // Find all document, header, and footer XML files
  const xmlFilesToProcess = Object.keys(zip.files).filter(name => 
    name.startsWith("word/") && name.endsWith(".xml") && 
    (name.includes("document") || name.includes("header") || name.includes("footer"))
  );

  const parser = new DOMParser();
  const serializer = new XMLSerializer();

  for (const filename of xmlFilesToProcess) {
    const xmlContent = zip.file(filename)?.asText();
    if (!xmlContent) continue;

    const doc = parser.parseFromString(xmlContent, "application/xml");
    const fieldsByRegex: Record<string, typeof fields> = {};
    fields.forEach((f) => {
      if (!f.valueText) return;
      const regexStr = buildSearchRegexStr(f.valueText, true);
      if (!regexStr) return;
      if (!fieldsByRegex[regexStr]) fieldsByRegex[regexStr] = [];
      fieldsByRegex[regexStr].push(f);
    });

    Object.entries(fieldsByRegex)
      .sort((a, b) => b[0].length - a[0].length)
      .forEach(([regexStr, regexFields]) => {
      const sortedFields = [...regexFields].sort((a, b) => {
        const indexA = a.occurrenceIndex || 0;
        const indexB = b.occurrenceIndex || 0;
        return indexB - indexA;
      });

      sortedFields.forEach((f) => {
        const val = fieldValues[f.name];
        if (!val) return;

        const tNodes = doc.getElementsByTagName("w:t");
        const textNodes: { node: Element; text: string; start: number; end: number }[] = [];
        let fullText = "";
        
        for (let i = 0; i < tNodes.length; i++) {
          const node = tNodes[i];
          const text = node.textContent || "";
          textNodes.push({ node, text, start: fullText.length, end: fullText.length + text.length });
          fullText += text;
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

      const lines = (beforeText + val + afterText).split('\n');
      
      firstNode.textContent = lines[0];
      firstNode.setAttribute("xml:space", "preserve");
      
      const parent = firstNode.parentNode;
      let currentNode = firstNode;
      
      for (let i = 1; i < lines.length; i++) {
        const br = doc.createElementNS("http://schemas.openxmlformats.org/wordprocessingml/2006/main", "w:br");
        parent?.insertBefore(br, currentNode.nextSibling);
        currentNode = br;
        
        const newT = doc.createElementNS("http://schemas.openxmlformats.org/wordprocessingml/2006/main", "w:t");
        newT.setAttribute("xml:space", "preserve");
        newT.textContent = lines[i];
        parent?.insertBefore(newT, currentNode.nextSibling);
        currentNode = newT;
      }

      for (let i = 1; i < affectedNodes.length; i++) {
        affectedNodes[i].node.textContent = "";
      }
      });
    });

    const newXml = serializer.serializeToString(doc);
    zip.file(filename, newXml);
  }

  return zip.generate({
    type: "blob",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
}
