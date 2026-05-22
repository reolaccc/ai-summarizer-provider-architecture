import express from "express";
import { answerFollowUpQuestion } from "../services/chatService.js";

export function createChatRouter({ spendLedger }) {
  const router = express.Router();

  router.post("/chat", async (req, res) => {
    try {
      const result = await answerFollowUpQuestion({
        sourceContext: typeof req.body?.sourceContext === "string" ? req.body.sourceContext.trim() : "",
        summaryType:
          req.body?.summaryType === "insights"
            ? "insights"
            : req.body?.summaryType === "paragraph"
              ? "paragraph"
              : "bullets",
        summaryText: typeof req.body?.summaryText === "string" ? req.body.summaryText.trim() : "",
        summaryBullets: Array.isArray(req.body?.summaryBullets) ? req.body.summaryBullets : [],
        insightPairs: Array.isArray(req.body?.insightPairs) ? req.body.insightPairs : [],
        messages: Array.isArray(req.body?.messages) ? req.body.messages : [],
        spendLedger,
      });

      return res.json(result);
    } catch (error) {
      const status = typeof error?.status === "number" ? error.status : 500;
      const message = error instanceof Error ? error.message : "Unknown server error while answering the chat question.";

      console.error("Chat request failed:", error);
      return res.status(status).json({ error: message });
    }
  });

  return router;
}
