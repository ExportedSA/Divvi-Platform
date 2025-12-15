/**
 * Insurance & Damage Module Exports
 */

export {
  // Insurance snapshot
  createInsuranceSnapshot,
  getCurrentPolicyVersion,
  applyInsuranceSnapshotToBooking,
  
  // Damage reporting
  createDamageReport,
  getDamageReportsForBooking,
  getDamageReport,
  addPhotosToReport,
  updateDamageReportStatus,
  resolveDamageReport,
  
  // Admin queries
  getOpenDamageReports,
  getDamageReportStats,
  
  // Risk management
  checkHighRiskThreshold,
  updateListingRiskStatus,
} from './insurance-service'

export type {
  InsuranceMode,
  DamageStatus,
  DamageSeverity,
  DamageReportStatus,
  ReporterRole,
  InsuranceSnapshot,
  CreateDamageReportParams,
  ResolveDamageReportParams,
} from './insurance-service'
