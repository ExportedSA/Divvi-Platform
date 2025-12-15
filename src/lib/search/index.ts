/**
 * Search Module
 * 
 * Centralized exports for search and discovery functionality.
 */

export {
  searchListings,
  searchAvailableListings,
  getSearchFacets,
  checkListingAvailability,
  getListingAvailability,
  getSearchSuggestions,
} from './search-service'

export type {
  SearchFilters,
  SortOption,
  SearchParams,
  SearchResult,
  SearchResponse,
  SearchFacets,
} from './search-service'
