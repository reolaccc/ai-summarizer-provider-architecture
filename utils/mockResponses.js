import { estimateTokens } from "../services/spendLedger.js";

function buildMockUsage(inputText, outputText) {
  return {
    input_tokens: estimateTokens(inputText),
    output_tokens: estimateTokens(outputText),
  };
}

export function createMockSummaryResponse({ summaryMode, contextText, sourceLabel }) {
  const sourcePreview = contextText.slice(0, 800);
  const lowerSource = `${sourceLabel}\n${sourcePreview}`.toLowerCase();

  let payload;

  if (summaryMode === "key_insights") {
    payload = {
      summaryType: "insights",
      summaryText: "",
      summaryBullets: [],
      insightPairs: [
        {
          insight: "The page is focused on a specific mission rather than general SpaceX branding.",
          question: "Why does that specificity matter for what readers expect next?",
        },
        {
          insight: "The content combines launch timing, objectives, and timeline milestones.",
          question: "How does that structure help readers understand the mission more clearly?",
        },
        {
          insight: "The mission is being presented as both a technical test and a public event.",
          question: "What does that dual purpose suggest about SpaceX's communication strategy?",
        },
      ],
      questions: [
        "What part of the mission seems most risky or ambitious?",
        "Which timeline detail matters most for planning around the launch?",
        "How does this mission differ from a routine launch announcement?",
      ],
    };
  } else if (summaryMode === "eli10") {
    payload = {
      summaryType: "paragraph",
      summaryText: [
        "Think of this page like a friendly school announcement for a very big science experiment.",
        "It tells people when the test starts, what the team wants to learn, and which parts they will watch carefully.",
        "For Starship Flight 12, SpaceX is trying a new rocket system and checking whether the pieces work together safely, a bit like making sure every part of a giant toy set fits before you play with it.",
      ].join("\n\n"),
      summaryBullets: [],
      insightPairs: [],
      questions: [
        "What is the most important thing this mission is trying to prove?",
        "Why would engineers test the rocket in so many steps?",
        "What makes this launch different from a normal rocket ride?",
      ],
    };
  } else if (
    lowerSource.includes("starship") &&
    (lowerSource.includes("flight 12") || lowerSource.includes("twelfth flight test"))
  ) {
    payload = {
      summaryType: "paragraph",
      summaryText: [
        "Starship Flight 12 is being presented as a full-system test of the redesigned vehicle rather than a simple launch demonstration. The main goal is to see whether the rocket can move through the major phases of flight cleanly enough to build confidence in the overall system.",
        "- The launch window opens Thursday, May 21 at 5:30 p.m. CT.",
        "- The webcast begins about 45 minutes earlier.",
        "- A successful sequence would strengthen confidence in launch, separation, and landing behavior.",
        "",
        "The booster portion of the mission is important because SpaceX is testing demanding flight behavior without also attempting a launch-site catch. That keeps the mission focused on proving core booster performance before adding another layer of difficulty.",
        "- The booster is expected to complete ascent, stage separation, boostback burn, and landing burn.",
        "- Skipping the catch reduces complexity while still generating critical flight data.",
        "",
        "The upper stage is also doing work that matters beyond this single launch, including payload and reentry-related tests tied to future reuse. That makes the mission useful not only as a pass-or-fail event, but as a way to gather data that supports later Starship operations.",
        "- The plan includes deploying 20 Starlink simulators and two modified satellites.",
        "- SpaceX also wants to attempt a Raptor relight and collect reentry data.",
      ].join("\n"),
      summaryBullets: [],
      insightPairs: [],
      questions: [
        "Which part of the mission is the biggest technical leap?",
        "Why would the team avoid a launch-site catch on this flight?",
        "How do the payload tests help future Starship missions?",
      ],
    };
  } else {
    payload = {
      summaryType: "paragraph",
      summaryText: [
        "A strong standard summary should lead with clear paragraphs that explain the main ideas in plain language instead of instantly collapsing everything into bullets. That gives the reader an actual narrative of what matters and how the ideas connect.",
        "",
        "When a section carries extra detail, a short supporting bullet list can help without taking over the whole response. Used carefully, those bullets add evidence, examples, or consequences under the paragraph they belong to rather than replacing the paragraph itself.",
        "",
        "The result should feel readable first and structured second. In practice, that means the summary stays easy to scan while still preserving the most useful detail from the source.",
      ].join("\n"),
      summaryBullets: [],
      insightPairs: [],
      questions: [
        "What is the central takeaway here?",
        "Which detail is most likely to matter later?",
        "What would change the interpretation most?",
      ],
    };
  }

  const outputText = JSON.stringify(payload);

  return {
    outputText,
    usage: buildMockUsage(`Source: ${sourceLabel}\n${contextText}`, outputText),
  };
}

export function createMockChatResponse({ sourceContext, question }) {
  const lowerQuestion = question.toLowerCase();
  const lowerSource = sourceContext.toLowerCase();

  let answer = "";

  if (lowerQuestion.includes("melbourne") && lowerQuestion.includes("time") && lowerSource.includes("5:30 p.m. ct")) {
    answer =
      "The launch window opens Friday, May 22 at 8:30 a.m. Melbourne time (AEST). That is 15 hours ahead of Central Time in May, so the Thursday evening CT window becomes Friday morning in Melbourne.";
  } else if (lowerQuestion.includes("launch time") && lowerSource.includes("5:30 p.m. ct")) {
    answer =
      "The launch window is Thursday, May 21 at 5:30 p.m. CT. If you want, I can also convert it to another timezone.";
  } else {
    answer =
      "Based on the source, the best answer is the one most directly supported by the mission details. If you want a conversion or a comparison, I can help work it out from the launch information.";
  }

  return {
    outputText: answer,
    usage: buildMockUsage(`${sourceContext}\n${question}`, answer),
  };
}

