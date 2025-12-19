import Link from 'next/link'

interface LogoProps {
  className?: string
  showTagline?: boolean
  size?: 'sm' | 'md' | 'lg' | 'xl'
  linkToHome?: boolean
}

export function Logo({ 
  className = '', 
  showTagline = false, 
  size = 'md',
  linkToHome = true 
}: LogoProps) {
  const sizeClasses = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl',
    xl: 'text-4xl',
  }

  const taglineSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg',
  }

  const logoContent = (
    <div className={`flex flex-col ${className}`}>
      <span className={`font-bold tracking-tight ${sizeClasses[size]}`}>
        <span className="text-lendit-green">Divvi</span>
      </span>
      {showTagline && (
        <span className={`text-lendit-brown font-medium ${taglineSizes[size]}`}>
          Rent with confidence
        </span>
      )}
    </div>
  )

  if (linkToHome) {
    return (
      <Link href="/" className="inline-block hover:opacity-90 transition-opacity">
        {logoContent}
      </Link>
    )
  }

  return logoContent
}

// Icon-only version for small spaces
export function LogoIcon({ className = '', size = 24 }: { className?: string; size?: number }) {
  return (
    <div 
      className={`flex items-center justify-center font-bold text-lendit-green ${className}`}
      style={{ fontSize: size * 0.8 }}
    >
      L
    </div>
  )
}

// Full logo with icon styling
export function LogoFull({ className = '' }: { className?: string }) {
  return (
    <Link href="/" className={`inline-flex items-center space-x-2 ${className}`}>
      <div className="w-10 h-10 bg-lendit-green rounded-lg flex items-center justify-center">
        <span className="text-white font-bold text-xl">D</span>
      </div>
      <div className="flex flex-col">
        <span className="font-bold text-xl text-lendit-green leading-tight">Divvi</span>
        <span className="text-xs text-lendit-brown leading-tight">Rent with confidence</span>
      </div>
    </Link>
  )
}

export default Logo
