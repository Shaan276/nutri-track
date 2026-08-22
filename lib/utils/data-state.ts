/**
 * Nutri-Track Universal Data-State & Zero-Data Standards
 * Standardizes missing-data handling, percentage calculations, pace formatting,
 * and eliminates NaN, Infinity, undefined, and false health alarmism.
 */

export type HealthDataState = "NOT_LOGGED_YET" | "IN_PROGRESS" | "GOAL_MET" | "GOAL_MISSED";

/**
 * Calculates safe completion percentage with protection against NaN / Infinity.
 */
export function calculateSafePercentage(
  current: number | null | undefined,
  target: number | null | undefined,
  options: { maxCap?: number; round?: boolean } = {}
): number {
  const numCurrent = Number(current) || 0;
  const numTarget = Number(target) || 0;

  if (numTarget <= 0 || isNaN(numCurrent) || isNaN(numTarget)) {
    return 0;
  }

  const rawPercent = (numCurrent / numTarget) * 100;
  if (!isFinite(rawPercent)) return 0;

  let result = rawPercent;
  if (options.maxCap !== undefined) {
    result = Math.min(options.maxCap, result);
  }

  return options.round !== false ? Math.round(result) : Math.round(result * 10) / 10;
}

/**
 * Resolves standardized health data status distinguishing day in progress from missing or failed data.
 */
export function resolveDataStatus(
  current: number | null | undefined,
  target: number | null | undefined,
  options: { isEndOfDay?: boolean; thresholdPercent?: number } = {}
): HealthDataState {
  const numCurrent = Number(current) || 0;
  const numTarget = Number(target) || 0;
  const threshold = options.thresholdPercent ?? 100;

  if (numCurrent <= 0) {
    return options.isEndOfDay ? "GOAL_MISSED" : "NOT_LOGGED_YET";
  }

  const pct = calculateSafePercentage(numCurrent, numTarget);
  if (pct >= threshold) {
    return "GOAL_MET";
  }

  return options.isEndOfDay ? "GOAL_MISSED" : "IN_PROGRESS";
}

/**
 * Formats running / movement pace safely without NaN / Infinity.
 */
export function formatSafePace(secondsPerKm: number | null | undefined): string {
  if (!secondsPerKm || !isFinite(secondsPerKm) || secondsPerKm <= 0 || isNaN(secondsPerKm)) {
    return "--:-- /km";
  }

  const mins = Math.floor(secondsPerKm / 60);
  const secs = Math.floor(secondsPerKm % 60);
  return `${mins}'${secs.toString().padStart(2, "0")}"/km`;
}

/**
 * Formats safe number with precision fallback.
 */
export function formatSafeNumber(
  val: number | string | null | undefined,
  fallback: number = 0,
  precision: number = 0
): number {
  const parsed = Number(val);
  if (isNaN(parsed) || !isFinite(parsed)) {
    return fallback;
  }
  return precision > 0 ? Number(parsed.toFixed(precision)) : Math.round(parsed);
}