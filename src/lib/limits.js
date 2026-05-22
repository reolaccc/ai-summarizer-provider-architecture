// Raised to support long-form inputs (e.g. chapters / large excerpts).
// Hard guard still applies via MAX_INPUT_TOKENS and the server-side spend guard.
// Approx conversion used elsewhere in the app: ~4 characters per token.
// 600k tokens ~= 2.4M characters.
export const MAX_INPUT_CHARACTERS = 2400000;
export const MAX_INPUT_TOKENS = 600000;
