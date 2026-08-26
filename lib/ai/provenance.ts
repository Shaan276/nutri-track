/**
 * Nutri-Track Data Provenance Engine
 *
 * Classifies profile attributes, targets, and daily metrics into clear provenance categories:
 * - CONFIRMED: Explicitly entered or verified by the user as truth.
 * - USER_ENTERED: Provided directly by the user in profile/onboarding.
 * - AI_PROPOSED: Proposed by the AI Health Coach, pending user confirmation.
 * - UNVERIFIED: Seeded, bootstrapped, or estimated without user confirmation.
 * - DEFAULT: General population average/fallback (not personal).
 * - MISSING: Unknown or not set.
 *
 * STRICT RULE: Never represent unverified or default numbers as confirmed facts.
 */

export type DataProvenanceStatus =
  | "CONFIRMED"
  | "USER_ENTERED"
  | "AI_PROPOSED"
  | "UNVERIFIED"
  | "DEFAULT"
  | "MISSING";

export interface ProvenanceValue<T = any> {
  value: T | null;
  status: DataProvenanceStatus;
  label: string;
  sourceDescription: string;
  isConfirmed: boolean;
}

export class DataProvenanceService {
  /**
   * Evaluates provenance for a single profile field.
   */
  static evaluateProfileField(
    fieldName: string,
    value: any,
    metadata?: { isUserProvided?: boolean; isPreFilled?: boolean; isAiProposed?: boolean }
  ): ProvenanceValue {
    if (value === null || value === undefined || value === "") {
      return {
        value: null,
        status: "MISSING",
        label: "Missing",
        sourceDescription: "Not provided yet",
        isConfirmed: false,
      };
    }

    if (metadata?.isAiProposed) {
      return {
        value,
        status: "AI_PROPOSED",
        label: "AI Proposed",
        sourceDescription: "Proposed by AI Coach (Awaiting confirmation)",
        isConfirmed: false,
      };
    }

    if (metadata?.isPreFilled) {
      return {
        value,
        status: "UNVERIFIED",
        label: "Unverified / Pre-filled",
        sourceDescription: "Pre-filled default (Not explicitly confirmed)",
        isConfirmed: false,
      };
    }

    if (metadata?.isUserProvided !== false) {
      return {
        value,
        status: "CONFIRMED",
        label: "Confirmed",
        sourceDescription: "Explicitly entered by user",
        isConfirmed: true,
      };
    }

    return {
      value,
      status: "UNVERIFIED",
      label: "Unverified",
      sourceDescription: "Estimated value",
      isConfirmed: false,
    };
  }

  /**
   * Evaluates provenance for daily nutrition targets.
   */
  static evaluateTarget(
    targetName: string,
    targetValue: number | null | undefined,
    isTargetConfigured: boolean
  ): ProvenanceValue<number> {
    if (!isTargetConfigured || targetValue === null || targetValue === undefined || targetValue <= 0) {
      return {
        value: null,
        status: "MISSING",
        label: "Not configured yet",
        sourceDescription: "No personalized target set by user",
        isConfirmed: false,
      };
    }

    return {
      value: targetValue,
      status: "CONFIRMED",
      label: `${targetValue}`,
      sourceDescription: "Configured personalized target",
      isConfirmed: true,
    };
  }

  /**
   * Evaluates today's logged intake distinguishing "No data logged" from 0 kcal.
   */
  static evaluateDailyLoggedIntake(
    count: number,
    loggedValue: number,
    unit: string
  ): {
    hasData: boolean;
    displayString: string;
    status: "LOGGED" | "NO_DATA_LOGGED";
  } {
    if (count === 0) {
      return {
        hasData: false,
        displayString: "No meals logged yet today",
        status: "NO_DATA_LOGGED",
      };
    }

    return {
      hasData: true,
      displayString: `${loggedValue} ${unit}`,
      status: "LOGGED",
    };
  }
}
