/**
 * UI Components Index
 * 
 * Centralized exports for reusable UI components.
 */

// Loading states
export {
  Spinner,
  LoadingOverlay,
  PageLoading,
  ButtonLoading,
  Skeleton,
  SkeletonText,
  SkeletonAvatar,
  SkeletonCard,
  SkeletonListingCard,
  SkeletonListingGrid,
  SkeletonTableRow,
  SkeletonTable,
  ProgressBar,
} from './loading'

// Error states
export {
  ErrorAlert,
  PageError,
  FormError,
  InlineError,
  ErrorBoundaryFallback,
  NetworkError,
} from './error-states'

// Empty states
export {
  EmptyState,
  NoSearchResults,
  NoListings,
  NoBookings,
  NoMessages,
  NoNotifications,
  NoFavorites,
  NoReviews,
  TableEmpty,
  CardEmpty,
} from './empty-states'

// Accessibility
export {
  VisuallyHidden,
  SkipLink,
  FocusTrap,
  LiveRegion,
  FormField,
  IconButton,
  LoadingAnnouncement,
  useArrowNavigation,
  useMediaQuery,
  useIsMobile,
  useIsTablet,
  useIsDesktop,
  usePrefersReducedMotion,
} from './accessibility'
