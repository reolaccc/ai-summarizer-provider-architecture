import { countBulletLines, countWords, splitBullets, splitParagraphs, splitSentences } from "./text.js";

export function normalizeBulletNodes(items) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((item) => {
      if (typeof item === "string") {
        return { text: item.trim(), level: 0 };
      }

      const text = typeof item?.text === "string" ? item.text.trim() : "";
      const rawLevel = typeof item?.level === "number" ? item.level : 0;
      const level = Number.isFinite(rawLevel) ? Math.max(0, Math.min(3, Math.floor(rawLevel))) : 0;

      return { text, level };
    })
    .filter((item) => item.text);
}

export function formatBulletNodes(items) {
  return normalizeBulletNodes(items)
    .map((item) => `${"  ".repeat(item.level)}- ${item.text}`)
    .join("\n");
}

function supportsMixedStandardSummary(contextText) {
  return countWords(contextText) >= 120;
}

function cleanSupportSentence(sentence) {
  return String(sentence ?? "")
    .replace(/\s+/g, " ")
    .replace(/^[\s-–—:]+/, "")
    .replace(/^[“"']+/, "")
    .replace(/[”"']+$/, "")
    .replace(/^[A-Z][a-z]+,\s*/, "")
    .replace(/\s+\((?:[^()]|\([^()]*\))*\)\s*$/, "")
    .replace(/[.!?。！？]+$/, "")
    .trim();
}

function splitSupportClauses(paragraph) {
  const normalized = String(paragraph ?? "").replace(/\s+/g, " ").trim();
  if (!normalized) {
    return [];
  }

  const byPunctuation = normalized
    .split(/(?<=[,;:])\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (byPunctuation.length >= 2) {
    return byPunctuation
      .slice(1)
      .map(cleanSupportSentence)
      .filter((clause) => Boolean(clause) && countWords(clause) >= 6);
  }

  const byConjunction = normalized
    .split(/\s+\b(?:and|but|while|because|since|so|also)\b\s+/i)
    .map((part) => part.trim())
    .filter(Boolean);

  if (byConjunction.length >= 2) {
    return byConjunction
      .slice(1)
      .map(cleanSupportSentence)
      .filter((clause) => Boolean(clause) && countWords(clause) >= 6);
  }

  return [];
}

function hasParagraphContent(text) {
  return String(text ?? "")
    .split(/\n\s*\n+/)
    .map((block) => block.trim())
    .some((block) => block && !block.split("\n").every((line) => /^[-*•]\s+/.test(line.trim())));
}

function splitWordsIntoThree(text) {
  const words = String(text ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean);

  if (words.length === 0) {
    return [];
  }

  const chunkSize = Math.max(1, Math.ceil(words.length / 3));
  const first = words.slice(0, chunkSize).join(" ");
  const second = words.slice(chunkSize, chunkSize * 2).join(" ");
  const third = words.slice(chunkSize * 2).join(" ");

  return [first, second, third].filter(Boolean);
}

export function normalizeEli10Paragraphs(text) {
  const paragraphBlocks = splitParagraphs(text);

  if (paragraphBlocks.length >= 3) {
    return paragraphBlocks.slice(0, 3).join("\n\n");
  }

  const sentenceBlocks = splitSentences(paragraphBlocks.join(" "));

  if (sentenceBlocks.length >= 3) {
    const base = Math.floor(sentenceBlocks.length / 3);
    const remainder = sentenceBlocks.length % 3;
    let cursor = 0;

    const chunks = Array.from({ length: 3 }, (_value, index) => {
      const take = base + (index < remainder ? 1 : 0);
      const chunk = sentenceBlocks.slice(cursor, cursor + take);
      cursor += take;
      return chunk.join(" ").trim();
    }).filter(Boolean);

    if (chunks.length === 3) {
      return chunks.join("\n\n");
    }
  }

  const wordChunks = splitWordsIntoThree(sentenceBlocks.join(" "));

  if (wordChunks.length === 3) {
    return wordChunks.join("\n\n");
  }

  return paragraphBlocks.join("\n\n") || sentenceBlocks.join(" ");
}

export function isTooThinStandardSummary(summary) {
  if (summary?.summaryType !== "paragraph") {
    return true;
  }

  const paragraphCount = splitParagraphs(summary.summaryText).length;
  const wordCount = countWords(summary.summaryText);
  const bulletLineCount = countBulletLines(summary.summaryText);

  return !hasParagraphContent(summary.summaryText) || paragraphCount < 2 || wordCount < 90 || bulletLineCount > 8;
}

export function lacksMixedStructure(summary, contextText) {
  if (summary?.summaryType !== "paragraph") {
    return true;
  }

  if (!supportsMixedStandardSummary(contextText)) {
    return false;
  }

  return countBulletLines(summary.summaryText) === 0;
}

export function enforceMixedStandardSummary(summaryText, contextText) {
  const original = String(summaryText ?? "").trim();
  if (!original || countBulletLines(original) > 0) {
    return original;
  }

  const paragraphs = splitParagraphs(original);
  if (paragraphs.length === 0) {
    return original;
  }

  if (!supportsMixedStandardSummary(contextText) && splitSentences(original).length < 2) {
    return original;
  }

  const mixedBlocks = [];
  let generatedBulletCount = 0;

  for (const paragraph of paragraphs) {
    const sentences = splitSentences(paragraph).map((sentence) => sentence.trim()).filter(Boolean);

    if (sentences.length <= 1) {
      mixedBlocks.push(paragraph.trim());
      continue;
    }

    const leadSentence = sentences[0];
    const supportSentences = sentences.slice(1).map(cleanSupportSentence).filter(Boolean).slice(0, 3);
    const supportClauses = supportSentences.length > 0 ? supportSentences : splitSupportClauses(paragraph).slice(0, 3);

    const groupLines = [leadSentence];
    if (supportClauses.length > 0) {
      supportClauses.forEach((item) => groupLines.push(`- ${item}`));
      generatedBulletCount += supportClauses.length;
    }

    mixedBlocks.push(groupLines.join("\n"));
  }

  if (generatedBulletCount === 0) {
    const fallbackParagraph = paragraphs
      .slice()
      .sort((a, b) => b.length - a.length)[0];
    const fallbackClauses = splitSupportClauses(fallbackParagraph).slice(0, 3);

    if (fallbackClauses.length > 0) {
      const fallbackLines = [splitSentences(fallbackParagraph)[0] || fallbackParagraph.trim()];
      fallbackClauses.forEach((item) => fallbackLines.push(`- ${item}`));

      mixedBlocks.length = 0;
      mixedBlocks.push(fallbackLines.join("\n"));
      for (const paragraph of paragraphs.slice(1)) {
        mixedBlocks.push(paragraph.trim());
      }
    }
  }

  return mixedBlocks.filter(Boolean).join("\n\n");
}

export function parseStructuredResponse(outputText) {
  const cleaned = String(outputText ?? "")
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("The model did not return valid JSON.");
  }

  const payload = JSON.parse(cleaned.slice(start, end + 1));
  const summaryType =
    payload.summaryType === "insights"
      ? "insights"
      : payload.summaryType === "paragraph"
        ? "paragraph"
        : "bullets";
  const summaryText = typeof payload.summaryText === "string" ? payload.summaryText.trim() : "";
  const summaryBullets = Array.isArray(payload.summaryBullets) ? normalizeBulletNodes(payload.summaryBullets) : [];
  const insightPairs = Array.isArray(payload.insightPairs)
    ? payload.insightPairs
        .map((item) => ({
          insight: typeof item?.insight === "string" ? item.insight.trim() : "",
          question: typeof item?.question === "string" ? item.question.trim() : "",
        }))
        .filter((item) => item.insight)
    : [];
  const questions = Array.isArray(payload.questions)
    ? payload.questions.map((item) => String(item).trim()).filter(Boolean).slice(0, 3)
    : [];

  return {
    summaryType,
    summaryText,
    summaryBullets,
    insightPairs,
    questions,
  };
}

export { splitBullets };
