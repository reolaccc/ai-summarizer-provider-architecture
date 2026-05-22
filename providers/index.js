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

  return {
    providerName,
    model: getModelForTask(providerName, task),
    provider: factory(),
  };
}
