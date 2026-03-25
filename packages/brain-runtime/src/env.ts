/**
 * Auto-load .env files and resolve API keys from environment.
 *
 * Supports:
 *   - Direct value: apiKey: "sk-..."
 *   - Env reference: apiKey: "env:OPENAI_API_KEY"
 *   - Empty string: auto-detects from OPENAI_API_KEY or ANTHROPIC_API_KEY
 */

let _loaded = false;

/** Load .env file using dotenv if available. Called once automatically. */
export function loadEnv(): void {
  if (_loaded) return;
  _loaded = true;

  try {
    // Dynamic import — dotenv is optional
    require("dotenv").config();
  } catch {
    // dotenv not installed — that's fine, developer uses process.env directly
  }
}

/**
 * Resolve an API key value.
 *
 * - "sk-..." → returned as-is
 * - "env:OPENAI_API_KEY" → reads from process.env
 * - "" → auto-detects from OPENAI_API_KEY or ANTHROPIC_API_KEY
 */
export function resolveApiKey(apiKey: string | undefined): string {
  loadEnv();

  // Direct value
  if (apiKey && !apiKey.startsWith("env:")) {
    return apiKey;
  }

  // Env reference: "env:VAR_NAME"
  if (apiKey?.startsWith("env:")) {
    const varName = apiKey.slice(4);
    const value = process.env[varName];
    if (!value) {
      throw new Error(`Environment variable ${varName} not set. Check your .env file.`);
    }
    return value;
  }

  // Auto-detect
  const envVars = ["OPENAI_API_KEY", "ANTHROPIC_API_KEY", "MAIA_API_KEY"];
  for (const varName of envVars) {
    const value = process.env[varName];
    if (value) return value;
  }

  throw new Error(
    "No API key found. Set it in one of these ways:\n" +
    '  1. llm: { apiKey: "sk-..." }\n' +
    '  2. llm: { apiKey: "env:OPENAI_API_KEY" }\n' +
    "  3. Set OPENAI_API_KEY in .env file or environment\n" +
    "  4. Set ANTHROPIC_API_KEY in .env file or environment"
  );
}