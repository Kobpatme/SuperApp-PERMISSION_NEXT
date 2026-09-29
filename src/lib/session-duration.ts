const hoursToMs = 60 * 60 * 1000;
const minutesToMs = 60 * 1000;

type Environment = Record<string, string | undefined>;

function durationFromEnv(name: string, fallback: number, multiplier: number, env: Environment) {
  const value = Number.parseInt(env[name] || "", 10);
  return Number.isFinite(value) && value > 0 ? value * multiplier : fallback * multiplier;
}

export function getSessionDurationMs(env: Environment = process.env) {
  return durationFromEnv("AUTH_ABSOLUTE_TIMEOUT_HOURS", 12, hoursToMs, env);
}

export function getIdleDurationMs(env: Environment = process.env) {
  return durationFromEnv("AUTH_IDLE_TIMEOUT_MINUTES", 30, minutesToMs, env);
}
