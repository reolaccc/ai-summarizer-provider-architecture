const PROVIDER_CONFIGS = {
  openai: {
    name: "openai",
    label: "OpenAI",
    apiKeyEnv: "OPENAI_API_KEY",
    baseUrlEnv: "OPENAI_BASE_URL",
    status: "validated",
  },
  deepseek: {
    name: "deepseek",
    label: "DeepSeek",
    apiKeyEnv: "DEEPSEEK_API_KEY",
    baseUrlEnv: "DEEPSEEK_BASE_URL",
    defaultBaseUrl: "https://api.deepseek.com",
    status: "skeleton",
  },
};

export function normalizeProviderName(value) {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();

  if (!normalized) {
    return "openai";
  }

  if (normalized in PROVIDER_CONFIGS) {
    return normalized;
  }

  throw Object.assign(new Error(`Unsupported provider "${value}".`), { status: 400 });
}

export function getProviderConfig(providerName) {
  const normalizedProvider = normalizeProviderName(providerName);
  return PROVIDER_CONFIGS[normalizedProvider];
}

export function getProviderNameForTask(task) {
  const taskEnvKey = task === "chat" ? "CHAT_PROVIDER" : "SUMMARY_PROVIDER";
  return normalizeProviderName(process.env[taskEnvKey] || process.env.LLM_PROVIDER || "openai");
}

export { PROVIDER_CONFIGS };
