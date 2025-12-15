/**
 * SSR Utilities Index
 * 
 * Centralized exports for server-side rendering optimization.
 */

export {
  // React cache wrappers (request deduplication)
  getListingById,
  getListingBySlug,
  getUserById,
  getBookingById,
  
  // Cached data fetchers
  getFeaturedListings,
  getListingsByCategory,
  getListingsByRegion,
  getOwnerProfile,
  
  // Parallel fetchers
  getHomepageData,
  getListingPageData,
  
  // Static data
  getCategories,
  getRegions,
  
  // Search
  searchListings,
} from './data-fetching'
