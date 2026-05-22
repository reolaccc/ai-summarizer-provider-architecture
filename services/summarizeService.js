import { MAX_INPUT_CHARACTERS, MAX_INPUT_TOKENS } from "../src/lib/limits.js";
import { getProviderForTask } from "../providers/index.js";
import {
  buildEli10RewriteInstructions,
  buildStandardExpansionInstructions,
  buildSummaryPromptInstructions,
  getSummaryModeConfig,
} from "../prompts/summarizePrompt.js";
import {
  SPEND_LIMIT_USD,
  estimateCostUsd,
  estimateTokens,
  extractUsageTokens,
} from "./spendLedger.js";
import { resolveSourceInput } from "./sourceService.js";
import {
  enforceMixedStandardSummary,
  formatBulletNodes,
  isTooThinStandardSummary,
  lacksMixedStructure,
  normalizeEli10Paragraphs,
  parseStructuredResponse,
} from "../utils/normalizeOutput.js";
import { splitParagraphs } from "../utils/text.js";
import { createMockSummaryResponse } from "../utils/mockResponses.js";

function buildInputLimitMessage() {
  return `This demo only supports inputs up to ${MAX_INPUT_CHARACTERS.toLocaleString()} characters (about ${MAX_INPUT_TOKENS.toLocaleString()} tokens). Please paste a shorter excerpt, upload a smaller PDF, or split the document into sections.`;
}

function getDefaultQuestions() {
  return [
    "What is the strongest assumption behind the main idea?",
    "What details would change the conclusion most?",
    "How might this affect the future if the trend continues?",
  ];
}

function isMockResponsesEnabled() {
  const apiKey = process.env.OPENAI_API_KEY;
  return (
    process.env.OPENAI_MOCK_RESPONSES === "true" ||
    process.env.NODE_ENV === "test" ||
    Boolean(apiKey && /^test(-mock)?/i.test(apiKey))
  );
}

function mapProviderError(providerLabel, error) {
  const status = typeof error?.status === "number" ? error.status : undefined;
  const message = error instanceof Error ? error.message : "Unknown server error while calling the provider.";

  if (status) {
    if (status === 401) {
      return {
        status,
        message: `${providerLabel} API key invalid, expired, or not authorized for this project.`,
      };
    }

    if (status === 403) {
      return {
        status,
        message: `This API key does not have permission to use the requested ${providerLabel} model.`,
      };
    }

    if (status === 429) {
      return {
        status,
        message: `${providerLabel} API rate limit or billing limit reached. Please check your API usage and billing.`,
      };
    }
  }

  return {
    status: status ?? 500,
    message: `${providerLabel} API error: ${message}`,
  };
}

export async function summarizeContent({ value, summaryMode, spendLedger }) {
  const trimmedValue = typeof value === "string" ? value.trim() : "";
  const modeConfig = getSummaryModeConfig(summaryMode);

  if (!trimmedValue) {
    throw Object.assign(
      new Error("Please paste text, enter a URL, or upload a PDF before generating a summary."),
      { status: 400 },
    );
  }

  const useMockResponses = isMockResponsesEnabled();
  const { provider, model } = getProviderForTask("summary");

  if (!useMockResponses) {
    provider.ensureConfigured();
  }

  const normalizedLedger = await spendLedger.getNormalizedLedger();
  const { contextText, sourceLabel } = await resolveSourceInput(trimmedValue);

  const estimatedInputTokens = estimateTokens(`Source: ${sourceLabel}\n\nContent:\n${contextText}`);
  if (contextText.length > MAX_INPUT_CHARACTERS || estimatedInputTokens > MAX_INPUT_TOKENS) {
    throw Object.assign(new Error(buildInputLimitMessage()), { status: 413 });
  }

  const estimatedRequestCost = estimateCostUsd(estimatedInputTokens, 300);
  if (normalizedLedger.spentUsd + estimatedRequestCost >= SPEND_LIMIT_USD) {
    throw Object.assign(
      new Error(`Spend guard active: this demo has reached its monthly safety limit of about $${SPEND_LIMIT_USD}.`),
      { status: 402 },
    );
  }

  try {
    const response = useMockResponses
      ? createMockSummaryResponse({ summaryMode, contextText, sourceLabel })
      : await provider.generateSummary({
          model,
          temperature: 0,
          instructions: buildSummaryPromptInstructions(modeConfig),
          input: `Source: ${sourceLabel}\n\nContent:\n${contextText}`,
        });

    let parsed = parseStructuredResponse(response.outputText);
    let extraCost = 0;

    if (summaryMode === "eli10") {
      const eli10ParagraphCount = splitParagraphs(parsed.summaryText).length;

      if (!useMockResponses && eli10ParagraphCount < 3) {
        const rewriteResponse = await provider.generateSummary({
          model,
          temperature: 0,
          instructions: buildEli10RewriteInstructions(),
          input: [`Source: ${sourceLabel}`, "", `Content:\n${contextText}`, "", `Current explanation:\n${parsed.summaryText}`].join(
            "\n",
          ),
        });

        const rewrittenParsed = parseStructuredResponse(rewriteResponse.outputText);
        parsed = {
          ...parsed,
          summaryText: rewrittenParsed.summaryText || parsed.summaryText,
        };

        const rewriteUsage = extractUsageTokens(rewriteResponse.usage);
        extraCost +=
          rewriteUsage.inputTokens > 0 || rewriteUsage.outputTokens > 0
            ? estimateCostUsd(rewriteUsage.inputTokens, rewriteUsage.outputTokens)
            : 0;
      }

      parsed = {
        ...parsed,
        summaryText: normalizeEli10Paragraphs(parsed.summaryText),
      };
    }

    if (!useMockResponses && summaryMode === "standard" && (isTooThinStandardSummary(parsed) || lacksMixedStructure(parsed, contextText))) {
      const expansionResponse = await provider.generateSummary({
        model,
        temperature: 0,
        instructions: buildStandardExpansionInstructions(),
        input: [
          `Source: ${sourceLabel}`,
          "",
          `Content:\n${contextText}`,
          "",
          `Current summary to expand:\n${parsed.summaryText || formatBulletNodes(parsed.summaryBullets)}`,
        ].join("\n"),
      });

      const expandedParsed = parseStructuredResponse(expansionResponse.outputText);

      if (!isTooThinStandardSummary(expandedParsed)) {
        parsed = expandedParsed;
      }

      const expansionUsage = extractUsageTokens(expansionResponse.usage);
      extraCost +=
        expansionUsage.inputTokens > 0 || expansionUsage.outputTokens > 0
          ? estimateCostUsd(expansionUsage.inputTokens, expansionUsage.outputTokens)
          : 0;
    }

    if (summaryMode === "standard") {
      parsed = {
        ...parsed,
        summaryText: enforceMixedStandardSummary(parsed.summaryText, contextText),
      };
    }

    const { inputTokens, outputTokens } = extractUsageTokens(response.usage);
    const actualCost =
      inputTokens > 0 || outputTokens > 0
        ? estimateCostUsd(inputTokens, outputTokens)
        : estimatedRequestCost;
    const updatedLedger = await spendLedger.updateSpend(normalizedLedger, actualCost + extraCost);

    return {
      summaryType: parsed.summaryType,
      summaryText: parsed.summaryText,
      summaryBullets:
        parsed.summaryBullets.length > 0
          ? parsed.summaryBullets
          : parsed.summaryType === "bullets"
            ? [{ text: response.outputText.trim() || "No summary was returned.", level: 0 }]
            : [],
      insightPairs: parsed.insightPairs,
      questions: parsed.questions.length > 0 ? parsed.questions.slice(0, 3) : getDefaultQuestions(),
      contextText,
      sourceLabel,
      spend: {
        monthKey: updatedLedger.monthKey,
        spentUsd: updatedLedger.spentUsd,
        limitUsd: SPEND_LIMIT_USD,
      },
      provider: provider.name,
      model,
    };
  } catch (error) {
    const mappedError = mapProviderError(provider.label, error);
    throw Object.assign(new Error(mappedError.message), { status: mappedError.status });
  }
}
