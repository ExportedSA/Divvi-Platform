/**
 * Content Module Exports
 * Static content for policies, expectations, and guidance
 */

export {
  // Owner responsibilities
  OWNER_RESPONSIBILITIES,
  getOwnerResponsibilitiesText,
  getRequiredOwnerResponsibilities,
  
  // Renter responsibilities
  RENTER_RESPONSIBILITIES,
  getRenterResponsibilitiesText,
  getRequiredRenterResponsibilities,
  
  // Combined expectations
  RENTAL_EXPECTATIONS,
  PRE_BOOKING_EXPECTATIONS,
  PICKUP_CHECKLIST_EXPECTATIONS,
  
  // Helpers
  formatExpectationsForContext,
  getRentalExpectationsMarkdown,
} from './rental-expectations'
