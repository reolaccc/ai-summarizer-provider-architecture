import OpenAI from "openai";

export function createOpenAICompatibleProvider(providerConfig) {
  const apiKey = process.env[providerConfig.apiKeyEnv]?.trim();
  const baseURL = process.env[providerConfig.baseUrlEnv]?.trim();
  const client = apiKey
    ? new OpenAI({
        apiKey,
        ...(baseURL ? { baseURL } : {}),
      })
    : null;

  function isConfigured() {
    return Boolean(client);
  }

  function ensureConfigured() {
    if (!client) {
      throw Object.assign(
        new Error(`Missing ${providerConfig.apiKeyEnv} in the .env file. Please add it and restart the app.`),
        { status: 500 },
      );
    }
  }

  async function runResponseRequest({ model, instructions, input, temperature = 0 }) {
    ensureConfigured();

    const response = await client.responses.create({
      model,
      temperature,
      instructions,
      input,
    });

    return {
      outputText: response.output_text ?? "",
      usage: response.usage,
      raw: response,
    };
  }

  return {
    name: providerConfig.name,
    label: providerConfig.label,
    status: providerConfig.status,
    isConfigured,
    ensureConfigured,
    generateSummary: runResponseRequest,
    generateChat: runResponseRequest,
  };
}
