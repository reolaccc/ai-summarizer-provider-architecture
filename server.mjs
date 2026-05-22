import "dotenv/config";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer as createViteServer } from "vite";
import { createSpendLedger } from "./services/spendLedger.js";
import { createChatRouter } from "./routes/chat.js";
import { createSummarizeRouter } from "./routes/summarize.js";
import { MAX_INPUT_CHARACTERS, MAX_INPUT_TOKENS } from "./src/lib/limits.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProduction = process.env.NODE_ENV === "production" || process.env.RENDER === "true";
const port = Number(process.env.PORT || 10000);
const ledgerPath = path.resolve(__dirname, "spend-ledger.json");

const app = express();
const spendLedger = createSpendLedger(ledgerPath);

// Supports large pasted inputs (e.g. ebooks). Keep spend + token guards enabled server-side.
app.use(express.json({ limit: "10mb" }));

app.get("/api/health", (_req, res) => {
  const openaiConfigured = Boolean(process.env.OPENAI_API_KEY?.trim());
  const deepseekConfigured = Boolean(process.env.DEEPSEEK_API_KEY?.trim());

  res.json({
    ok: true,
    limits: {
      maxInputCharacters: MAX_INPUT_CHARACTERS,
      maxInputTokens: MAX_INPUT_TOKENS,
    },
    providers: {
      requested: {
        summary: process.env.SUMMARY_PROVIDER || process.env.LLM_PROVIDER || "openai",
        chat: process.env.CHAT_PROVIDER || process.env.LLM_PROVIDER || "openai",
      },
      configured: {
        openai: openaiConfigured,
        deepseek: deepseekConfigured,
      },
    },
  });
});

app.use("/api", createSummarizeRouter({ spendLedger }));
app.use("/api", createChatRouter({ spendLedger }));

if (isProduction) {
  app.use(express.static(path.resolve(__dirname, "dist")));

  app.get("*", (_req, res) => {
    res.sendFile(path.resolve(__dirname, "dist", "index.html"));
  });
} else {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });

  app.use(vite.middlewares);
}

app.listen(port, "0.0.0.0", () => {
  console.log(`AI Summarizer running at http://localhost:${port}`);
});
