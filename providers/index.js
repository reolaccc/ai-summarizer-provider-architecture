import { getModelForTask } from "../config/models.js";
import { getProviderNameForTask } from "../config/providers.js";
import { createDeepSeekProvider } from "./deepseek.js";
import { createOpenAIProvider } from "./openai.js";

const PROVIDER_FACTORIES = {
  openai: createOpenAIProvider,
  deepseek: createDeepSeekProvider,
};

export function getProviderForTask(task) {
  const providerName = getProviderNameForTask(task);
  const factory = PROVIDER_FACTORIES[providerName];

  if (!factory) {
    throw Object.assign(new Error(`Unsupported provider "${providerName}".`), { status: 400 });
  }

  const allowFallback = process.env.ALLOW_PROVIDER_FALLBACK !== "false";
  const provider = factory();

  if (allowFallback && providerName !== "openai" && !provider.isConfigured()) {
    const fallback = createOpenAIProvider();
    return {
      providerName: "openai",
      requestedProviderName: providerName,
      model: getModelForTask("openai", task),
      provider: fallback,
    };
  }

  return {
    providerName,
    requestedProviderName: providerName,
    model: getModelForTask(providerName, task),
    provider,
  };
}
