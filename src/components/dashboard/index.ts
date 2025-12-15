/**
 * Dashboard Components
 */

// Status Badges
export {
  DamageStatusBadge,
  ReportStatusBadge,
  SeverityBadge,
  default as DamageStatusBadgeDefault,
} from './DamageStatusBadge'

export type {
  DamageStatus,
  DamageReportStatus,
  DamageSeverity,
} from './DamageStatusBadge'

// Owner Dashboard
export {
  OwnerDamageReports,
  default as OwnerDamageReportsDefault,
} from './OwnerDamageReports'

// Renter Dashboard
export {
  RenterDamageReports,
  default as RenterDamageReportsDefault,
} from './RenterDamageReports'

// Admin Dashboard
export {
  AdminDamageQueue,
  default as AdminDamageQueueDefault,
} from './AdminDamageQueue'
