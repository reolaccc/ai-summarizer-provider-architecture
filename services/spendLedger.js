import { readFile, writeFile } from "node:fs/promises";

const MODEL_PRICING = {
  inputPerMillion: 0.75,
  outputPerMillion: 4.5,
};

export const SPEND_LIMIT_USD = 7;

export function getMonthKey(date = new Date()) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function estimateTokens(text) {
  return Math.max(1, Math.ceil(String(text ?? "").length / 4));
}

export function estimateCostUsd(inputTokens, outputTokens) {
  return (
    (inputTokens * MODEL_PRICING.inputPerMillion) / 1_000_000 +
    (outputTokens * MODEL_PRICING.outputPerMillion) / 1_000_000
  );
}

export function extractUsageTokens(usage) {
  if (!usage || typeof usage !== "object") {
    return { inputTokens: 0, outputTokens: 0 };
  }

  const inputTokens =
    typeof usage.input_tokens === "number"
      ? usage.input_tokens
      : typeof usage.prompt_tokens === "number"
        ? usage.prompt_tokens
        : 0;

  const outputTokens =
    typeof usage.output_tokens === "number"
      ? usage.output_tokens
      : typeof usage.completion_tokens === "number"
        ? usage.completion_tokens
        : 0;

  return { inputTokens, outputTokens };
}

export function createSpendLedger(ledgerPath) {
  async function readLedger() {
    try {
      const raw = await readFile(ledgerPath, "utf8");
      const data = JSON.parse(raw);

      if (data && typeof data === "object") {
        return {
          monthKey: typeof data.monthKey === "string" ? data.monthKey : getMonthKey(),
          spentUsd: typeof data.spentUsd === "number" ? data.spentUsd : 0,
        };
      }
    } catch {
      // Ignore missing or malformed ledger files and start fresh.
    }

    return {
      monthKey: getMonthKey(),
      spentUsd: 0,
    };
  }

  async function writeLedger(ledger) {
    await writeFile(ledgerPath, JSON.stringify(ledger, null, 2), "utf8");
  }

  async function getNormalizedLedger() {
    const ledger = await readLedger();
    const currentMonth = getMonthKey();

    return ledger.monthKey === currentMonth ? ledger : { monthKey: currentMonth, spentUsd: 0 };
  }

  async function updateSpend(ledger, addedCostUsd) {
    const updatedLedger = {
      monthKey: getMonthKey(),
      spentUsd: Number((ledger.spentUsd + addedCostUsd).toFixed(6)),
    };

    await writeLedger(updatedLedger);
    return updatedLedger;
  }

  return {
    readLedger,
    writeLedger,
    getNormalizedLedger,
    updateSpend,
  };
}
