import { getProviderConfig } from "../config/providers.js";
import { createOpenAICompatibleProvider } from "./createOpenAICompatibleProvider.js";

// Placeholder skeleton: this follows an OpenAI-compatible shape, but OpenAI remains
// the primary validated provider for this experimental architecture.
export function createDeepSeekProvider() {
  return createOpenAICompatibleProvider(getProviderConfig("deepseek"));
}
