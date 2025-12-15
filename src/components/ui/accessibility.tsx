/**
 * Accessibility Components and Utilities
 * 
 * Helpers for building accessible interfaces.
 */

import React from 'react'

// =============================================================================
// VISUALLY HIDDEN (Screen Reader Only)
// =============================================================================

interface VisuallyHiddenProps {
  children: React.ReactNode
  as?: 'span' | 'div' | 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
}

export function VisuallyHidden({ children, as: Component = 'span' }: VisuallyHiddenProps) {
  return (
    <Component
      className="absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0"
      style={{ clip: 'rect(0, 0, 0, 0)' }}
    >
      {children}
    </Component>
  )
}

// =============================================================================
// SKIP LINK
// =============================================================================

interface SkipLinkProps {
  href?: string
  children?: React.ReactNode
}

export function SkipLink({ href = '#main-content', children = 'Skip to main content' }: SkipLinkProps) {
  return (
    <a
      href={href}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-green-600 focus:text-white focus:rounded-lg focus:outline-none"
    >
      {children}
    </a>
  )
}

// =============================================================================
// FOCUS TRAP (for modals)
// =============================================================================

interface FocusTrapProps {
  children: React.ReactNode
  active?: boolean
}

export function FocusTrap({ children, active = true }: FocusTrapProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!active) return

    const container = containerRef.current
    if (!container) return

    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const firstElement = focusableElements[0] as HTMLElement
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement?.focus()
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement?.focus()
        }
      }
    }

    container.addEventListener('keydown', handleKeyDown)
    firstElement?.focus()

    return () => {
      container.removeEventListener('keydown', handleKeyDown)
    }
  }, [active])

  return <div ref={containerRef}>{children}</div>
}

// =============================================================================
// LIVE REGION (for announcements)
// =============================================================================

interface LiveRegionProps {
  children: React.ReactNode
  mode?: 'polite' | 'assertive'
  atomic?: boolean
}

export function LiveRegion({ children, mode = 'polite', atomic = true }: LiveRegionProps) {
  return (
    <div
      role="status"
      aria-live={mode}
      aria-atomic={atomic}
      className="sr-only"
    >
      {children}
    </div>
  )
}

// =============================================================================
// FORM FIELD WRAPPER (with proper labeling)
// =============================================================================

interface FormFieldProps {
  id: string
  label: string
  error?: string
  hint?: string
  required?: boolean
  children: React.ReactNode
}

export function FormField({ id, label, error, hint, required, children }: FormFieldProps) {
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined

  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1" aria-hidden="true">*</span>}
        {required && <VisuallyHidden>(required)</VisuallyHidden>}
      </label>
      
      {hint && (
        <p id={hintId} className="text-sm text-gray-500">
          {hint}
        </p>
      )}
      
      {React.isValidElement(children) && 
        React.cloneElement(children as React.ReactElement<any>, {
          id,
          'aria-describedby': describedBy,
          'aria-invalid': error ? true : undefined,
          'aria-required': required,
        })
      }
      
      {error && (
        <p id={errorId} className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

// =============================================================================
// ICON BUTTON (with proper labeling)
// =============================================================================

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
  icon: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'ghost' | 'danger'
}

export function IconButton({ 
  label, 
  icon, 
  size = 'md', 
  variant = 'default',
  className = '',
  ...props 
}: IconButtonProps) {
  const sizeClasses = {
    sm: 'p-1',
    md: 'p-2',
    lg: 'p-3',
  }

  const variantClasses = {
    default: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
    ghost: 'hover:bg-gray-100 text-gray-600',
    danger: 'bg-red-100 hover:bg-red-200 text-red-700',
  }

  return (
    <button
      type="button"
      aria-label={label}
      className={`rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {icon}
      <VisuallyHidden>{label}</VisuallyHidden>
    </button>
  )
}

// =============================================================================
// LOADING ANNOUNCEMENT
// =============================================================================

export function LoadingAnnouncement({ loading, message = 'Loading' }: { loading: boolean; message?: string }) {
  return (
    <LiveRegion mode="polite">
      {loading ? message : ''}
    </LiveRegion>
  )
}

// =============================================================================
// KEYBOARD NAVIGATION HELPERS
// =============================================================================

export function useArrowNavigation(
  itemCount: number,
  onSelect?: (index: number) => void
) {
  const [activeIndex, setActiveIndex] = React.useState(0)

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
        case 'ArrowRight':
          e.preventDefault()
          setActiveIndex(prev => (prev + 1) % itemCount)
          break
        case 'ArrowUp':
        case 'ArrowLeft':
          e.preventDefault()
          setActiveIndex(prev => (prev - 1 + itemCount) % itemCount)
          break
        case 'Home':
          e.preventDefault()
          setActiveIndex(0)
          break
        case 'End':
          e.preventDefault()
          setActiveIndex(itemCount - 1)
          break
        case 'Enter':
        case ' ':
          e.preventDefault()
          onSelect?.(activeIndex)
          break
      }
    },
    [itemCount, activeIndex, onSelect]
  )

  return { activeIndex, setActiveIndex, handleKeyDown }
}

// =============================================================================
// RESPONSIVE UTILITIES
// =============================================================================

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = React.useState(false)

  React.useEffect(() => {
    const media = window.matchMedia(query)
    setMatches(media.matches)

    const listener = (e: MediaQueryListEvent) => setMatches(e.matches)
    media.addEventListener('change', listener)
    
    return () => media.removeEventListener('change', listener)
  }, [query])

  return matches
}

export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 639px)')
}

export function useIsTablet(): boolean {
  return useMediaQuery('(min-width: 640px) and (max-width: 1023px)')
}

export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 1024px)')
}

// =============================================================================
// REDUCED MOTION
// =============================================================================

export function usePrefersReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)')
}
