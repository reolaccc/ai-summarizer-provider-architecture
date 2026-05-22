export const SUMMARY_RESPONSE_SCHEMA =
  '{ "summaryType": "bullets" | "paragraph" | "insights", "summaryText": "string", "summaryBullets": [{"text":"string","level":0}], "insightPairs": [{"insight":"string","question":"string"}], "questions": ["string", "string", "string"] }';

export const SUMMARY_MODE_PROMPTS = {
  standard: {
    label: "Standard Summary",
    summaryType: "paragraph",
    instructions:
      "Create a mixed-format summary that is paragraph-first, not list-first. Write as many paragraphs as the source needs, with each paragraph covering one meaningful idea or theme in natural prose. After a paragraph, add a short block of plain '- ' bullets whenever the source provides concrete supporting details such as examples, evidence, steps, implications, dates, metrics, or caveats for that paragraph. For substantial or information-dense sources, at least one paragraph should be followed by supporting bullets. Do not turn the whole response into bullets, and do not put bullets before the paragraph they support. Keep important names, events, missions, and products exact instead of replacing them with generic descriptions. The goal is a readable mixed summary: paragraphs first, then local child bullets where they help.",
  },
  key_insights: {
    label: "Key Insights",
    summaryType: "insights",
    instructions:
      "Write 3 to 5 deeper insights focused on implications, patterns, tradeoffs, assumptions, or second-order effects. Do not paraphrase the source. For each insight, include exactly one reflection question that helps the user think deeper.",
  },
  eli10: {
    label: "Explain Like I'm 10",
    summaryType: "paragraph",
    instructions:
      "Explain the content in very simple language, as if speaking to a curious 10-year-old. Do not just simplify the wording; make the idea concrete, friendly, and easy to picture. Use exactly 3 short paragraphs and separate them with a blank line. Paragraph 1 should explain what it is. Paragraph 2 should give one concrete everyday example or analogy. Paragraph 3 should explain why it matters. Keep the tone warm, encouraging, and a little conversational. Avoid jargon. If you mention a technical term, explain it right away in simple words.",
  },
};

export function getSummaryModeConfig(mode) {
  return SUMMARY_MODE_PROMPTS[mode] ?? SUMMARY_MODE_PROMPTS.standard;
}

export function buildSummaryPromptInstructions(modeConfig) {
  return [
    "You are a helpful summarizer.",
    `Mode: ${modeConfig.label}.`,
    modeConfig.instructions,
    "Return valid JSON only, with this exact shape:",
    SUMMARY_RESPONSE_SCHEMA,
    "If summaryType is bullets, put the main summary in summaryBullets and keep summaryText empty.",
    "If summaryType is paragraph, put the main summary in summaryText and keep summaryBullets empty.",
    "If summaryType is insights, fill insightPairs with 3 to 5 items and keep the other summary fields empty.",
    "The questions field should contain 3 thoughtful follow-up questions unless the mode is insights, in which case the insightPairs already include reflection questions.",
    "Do not include markdown fences, commentary, or any text outside JSON.",
  ].join("\n");
}

export function buildEli10RewriteInstructions() {
  return [
    "You are rewriting an ELI10 explanation so it becomes exactly 3 short paragraphs.",
    "Paragraph 1 should explain what it is.",
    "Paragraph 2 should give one concrete everyday example or analogy.",
    "Paragraph 3 should explain why it matters.",
    "Use a warm, natural, child-friendly tone.",
    "Do not add bullets, headings, markdown fences, or extra commentary.",
    "Return valid JSON only with the same shape as before.",
    SUMMARY_RESPONSE_SCHEMA,
    "Keep summaryType as paragraph and keep summaryBullets empty.",
  ].join("\n");
}

export function buildStandardExpansionInstructions() {
  return [
    "You are rewriting a standard summary so it follows a mixed structure more faithfully.",
    "Rewrite it into a richer paragraph-based summary with more concrete information.",
    "Write as many real paragraphs as the source needs.",
    "Each paragraph should cover one meaningful idea in natural prose.",
    "For any paragraph with concrete supporting details, add a short '- ' bullet block immediately after that paragraph.",
    "For substantial or information-dense content, include supporting bullets after at least one paragraph.",
    "Do not turn the whole output into bullets, and do not place bullets before the paragraph they support.",
    "Return valid JSON only with the same shape as before.",
    SUMMARY_RESPONSE_SCHEMA,
    "Keep summaryType as paragraph and keep summaryBullets empty.",
    "Do not include markdown fences, commentary, or any text outside JSON.",
  ].join("\n");
}
