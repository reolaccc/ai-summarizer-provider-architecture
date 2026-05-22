export function countWords(text) {
  return String(text ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean).length;
}

export function countBulletLines(text) {
  return String(text ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => /^[-*•]\s+/.test(line)).length;
}

export function splitParagraphs(text) {
  return String(text ?? "")
    .split(/\n\s*\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

export function splitBullets(text) {
  return String(text ?? "")
    .split(/\n+/)
    .map((line) => line.replace(/^\s*[-*•]\s*/, "").trim())
    .filter(Boolean);
}

function protectSentenceMarkers(text) {
  const replacements = new Map([
    ["p.m.", "__PM__"],
    ["a.m.", "__AM__"],
    ["U.S.", "__US__"],
    ["D.C.", "__DC__"],
    ["M.D.", "__MD__"],
    ["Ph.D.", "__PHD__"],
    ["e.g.", "__EG__"],
    ["i.e.", "__IE__"],
  ]);

  let protectedText = String(text ?? "");

  for (const [source, token] of replacements) {
    protectedText = protectedText.replaceAll(source, token);
  }

  return protectedText;
}

function restoreSentenceMarkers(text) {
  return String(text ?? "")
    .replaceAll("__PM__", "p.m.")
    .replaceAll("__AM__", "a.m.")
    .replaceAll("__US__", "U.S.")
    .replaceAll("__DC__", "D.C.")
    .replaceAll("__MD__", "M.D.")
    .replaceAll("__PHD__", "Ph.D.")
    .replaceAll("__EG__", "e.g.")
    .replaceAll("__IE__", "i.e.");
}

export function splitSentences(text) {
  const cleaned = String(text ?? "").replace(/\s+/g, " ").trim();

  if (!cleaned) {
    return [];
  }

  const protectedText = protectSentenceMarkers(cleaned);
  const matches = protectedText.match(/[^.!?。！？]+[.!?。！？]*/g);

  return (matches ?? [protectedText])
    .map((sentence) => restoreSentenceMarkers(sentence.trim()))
    .map((sentence) => sentence.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

export function cleanAssistantText(text) {
  return String(text ?? "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .trim();
}
