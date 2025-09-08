import Image from 'next/image'
import { cn } from '@/lib/utils'

interface LogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'light' | 'dark'
  showText?: boolean
}

export function Logo({ className, size = 'md', variant = 'light', showText = true }: LogoProps) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8', 
    lg: 'h-12 w-12'
  }

  return (
    <div className={cn("flex items-center", showText ? "space-x-3" : "", className)}>
      <div className={cn("flex items-center justify-center", sizeClasses[size])}>
        <Image
          src="/logo.svg"
          alt="ClassSight"
          width={size === 'sm' ? 24 : size === 'md' ? 32 : 48}
          height={size === 'sm' ? 24 : size === 'md' ? 32 : 48}
          className={cn("w-full h-full object-contain", 
            variant === 'dark' ? 'filter brightness-0 invert' : ''
          )}
        />
      </div>
      {showText && (
        <span className={cn(
          "font-bold text-slate-900 dark:text-white",
          size === 'sm' ? 'text-lg' : size === 'md' ? 'text-xl' : 'text-2xl'
        )}>
          ClassSight
        </span>
      )}
    </div>
  )
}
