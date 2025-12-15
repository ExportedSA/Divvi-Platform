/**
 * Payments Module
 * 
 * Centralized exports for payment processing.
 */

// Core Stripe service
export {
  stripe,
  calculatePaymentAmounts,
  calculateDepositAmount,
  createPaymentIntent,
  createDepositPaymentIntent,
  confirmPaymentStatus,
  createBondHold,
  captureBond,
  releaseBond,
  processRefund,
} from './stripe-service'

export type {
  PaymentAmounts,
  CreatePaymentIntentParams,
  PaymentIntentResult,
  DepositPaymentParams,
  PaymentMode,
} from './stripe-service'

// Webhook handling with idempotency and reconciliation
export {
  verifyWebhookSignature,
  processWebhookEvent,
  getFailedWebhookEvents,
  retryWebhookEvent,
  reconcilePaymentIntent,
} from './webhook-handler'

export type {
  WebhookResult,
  WebhookEventRecord,
} from './webhook-handler'

// Owner payout service
export {
  getPlatformFeePercent,
  calculatePlatformFee,
  getEligibleBookingsForPayout,
  getOwnerPayoutSummary,
  hasActiveDispute,
  calculateAdjustedPayoutAmount,
  holdPayoutForDispute,
  releaseDisputeHold,
  createOwnerPayout,
  getOwnersDueForPayout,
  processScheduledPayouts,
  getOwnerPayoutHistory,
  updatePayoutStatus,
  createStripeConnectAccount,
  refreshStripeAccountStatus,
} from './payout-service'

export type {
  PayoutEligibleBooking,
  OwnerPayoutSummary,
  CreatePayoutResult,
  PayoutSchedule,
} from './payout-service'
