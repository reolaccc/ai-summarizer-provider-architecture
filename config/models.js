const DEFAULT_MODELS = {
  openai: {
    summary: "gpt-5.4-mini",
    chat: "gpt-5.4-mini",
  },
  deepseek: {
    summary: "deepseek-chat",
    chat: "deepseek-chat",
  },
};

export function getModelForTask(providerName, task) {
  const envKey = task === "chat" ? "CHAT_MODEL" : "SUMMARY_MODEL";
  const configuredModel = process.env[envKey]?.trim();

  if (configuredModel) {
    return configuredModel;
  }

  return DEFAULT_MODELS[providerName]?.[task] ?? DEFAULT_MODELS.openai[task];
}

export { DEFAULT_MODELS };
