import { getProviderForTask } from "../providers/index.js";
import { buildChatPromptInstructions } from "../prompts/chatPrompt.js";
import { SPEND_LIMIT_USD, estimateCostUsd, estimateTokens, extractUsageTokens } from "./spendLedger.js";
import { formatBulletNodes, splitBullets } from "../utils/normalizeOutput.js";
import { cleanAssistantText } from "../utils/text.js";
import { createMockChatResponse } from "../utils/mockResponses.js";

function isMockResponsesEnabled() {
  const apiKey = process.env.OPENAI_API_KEY;
  return (
    process.env.OPENAI_MOCK_RESPONSES === "true" ||
    process.env.NODE_ENV === "test" ||
    Boolean(apiKey && /^test(-mock)?/i.test(apiKey))
  );
}

function buildSummaryBlock({ summaryType, summaryText, summaryBullets, insightPairs }) {
  if (summaryType === "bullets") {
    return formatBulletNodes(summaryBullets);
  }

  if (summaryType === "insights") {
    return insightPairs
      .map((pair) => `Insight: ${pair?.insight || ""}\nQuestion: ${pair?.question || ""}`)
      .join("\n\n");
  }

  return summaryText;
}

function mapProviderError(providerLabel, error) {
  const status = typeof error?.status === "number" ? error.status : undefined;
  const message = error instanceof Error ? error.message : "Unknown server error while calling the provider.";

  return {
    status: status ?? 500,
    message: `${providerLabel} API error: ${message}`,
  };
}

export async function answerFollowUpQuestion({
  sourceContext,
  summaryType,
  summaryText,
  summaryBullets,
  insightPairs,
  messages,
  spendLedger,
}) {
  if (!sourceContext) {
    throw Object.assign(new Error("Please generate a summary first so I have page context."), { status: 400 });
  }

  const conversation = Array.isArray(messages)
    ? messages
        .filter(
          (message) =>
            message &&
            (message.role === "user" || message.role === "assistant") &&
            typeof message.content === "string",
        )
        .map((message) => ({
          role: message.role,
          content: message.content.trim(),
        }))
    : [];

  const question = conversation.length > 0 ? conversation[conversation.length - 1].content : "";
  if (!question) {
    throw Object.assign(new Error("Please type a question first."), { status: 400 });
  }

  const useMockResponses = isMockResponsesEnabled();
  const { provider, model } = getProviderForTask("chat");

  if (!useMockResponses) {
    provider.ensureConfigured();
  }

  const normalizedLedger = await spendLedger.getNormalizedLedger();
  const conversationText = conversation.map((message) => `${message.role.toUpperCase()}: ${message.content}`).join("\n");
  const summaryBlock = buildSummaryBlock({ summaryType, summaryText, summaryBullets, insightPairs });
  const input = `Source content:\n${sourceContext}\n\nSummary type: ${summaryType}\n\nSummary:\n${summaryBlock}\n\nConversation:\n${conversationText}\n\nAnswer the user's last question.`;

  const estimatedInputTokens = estimateTokens(input);
  const estimatedRequestCost = estimateCostUsd(estimatedInputTokens, 200);

  if (normalizedLedger.spentUsd + estimatedRequestCost >= SPEND_LIMIT_USD) {
    throw Object.assign(
      new Error(`Spend guard active: this demo has reached its monthly safety limit of about $${SPEND_LIMIT_USD}.`),
      { status: 402 },
    );
  }

  try {
    const response = useMockResponses
      ? createMockChatResponse({ sourceContext, question, summaryType, summaryText, summaryBullets, insightPairs, conversationText })
      : await provider.generateChat({
          model,
          instructions: buildChatPromptInstructions(),
          input,
        });

    const answerBullets = splitBullets(response.outputText.trim());
    const { inputTokens, outputTokens } = extractUsageTokens(response.usage);
    const actualCost =
      inputTokens > 0 || outputTokens > 0
        ? estimateCostUsd(inputTokens, outputTokens)
        : estimatedRequestCost;
    const updatedLedger = await spendLedger.updateSpend(normalizedLedger, actualCost);

    return {
      answer:
        answerBullets.length > 0
          ? answerBullets.map(cleanAssistantText).join("\n")
          : cleanAssistantText(response.outputText.trim()) ||
            "I could not generate a response for that question, but the source may still contain the answer.",
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
