/** Entitlements barrel (client-safe: model + period + types only). */
export {
  APP_TIMEZONE,
  periodForDate,
  currentPeriod,
} from "./period";
export {
  remaining,
  canConsume,
  InMemoryEntitlementLedger,
  type EntitlementState,
} from "./model";
export {
  PLAN_CODES,
  type PlanCode,
  type MonthlyEntitlement,
  type EntitlementsRepository,
} from "./types";
