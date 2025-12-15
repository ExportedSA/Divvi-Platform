/**
 * Fee Module Exports
 */

export {
  PLATFORM_FEE_RATE,
  PLATFORM_FEE_DISPLAY,
  PLATFORM_FEE_DESCRIPTION,
  PLATFORM_FEE_LEGAL_TEXT,
  calculateBookingFees,
  formatFee,
  getFeeBreakdownText,
} from './fee-config'

export type { BookingFeeBreakdown } from './fee-config'

export {
  PLATFORM_FEE_TERMS_SECTION,
  FULL_TERMS_TEMPLATE,
} from './terms-content'
