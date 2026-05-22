import { getProviderConfig } from "../config/providers.js";
import { createOpenAICompatibleProvider } from "./createOpenAICompatibleProvider.js";

export function createOpenAIProvider() {
  return createOpenAICompatibleProvider(getProviderConfig("openai"));
}
