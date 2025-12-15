/**
 * Payments Module
 * 
 * Centralized exports for payment processing.
 */

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
  verifyWebhookSignature,
  handleWebhookEvent,
} from './stripe-service'

export type {
  PaymentAmounts,
  CreatePaymentIntentParams,
  PaymentIntentResult,
  DepositPaymentParams,
  PaymentMode,
} from './stripe-service'
