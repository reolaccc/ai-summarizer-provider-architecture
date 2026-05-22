import express from "express";
import { summarizeContent } from "../services/summarizeService.js";

export function createSummarizeRouter({ spendLedger }) {
  const router = express.Router();

  router.post("/summarize", async (req, res) => {
    try {
      const result = await summarizeContent({
        value: req.body?.value,
        summaryMode: typeof req.body?.summaryMode === "string" ? req.body.summaryMode : "standard",
        spendLedger,
      });

      return res.json(result);
    } catch (error) {
      const status = typeof error?.status === "number" ? error.status : 500;
      const message = error instanceof Error ? error.message : "Unknown server error while generating the summary.";

      console.error("Summary request failed:", error);
      return res.status(status).json({ error: message });
    }
  });

  return router;
}
