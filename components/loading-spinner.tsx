import Image from 'next/image'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  message?: string
}

export function LoadingSpinner({ size = 'md', message }: LoadingSpinnerProps) {
  const sizes = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16'
  }

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className={`${sizes[size]} animate-pulse`}>
        <Image
          src="/images/clinify-logo.png"
          alt="Loading"
          width={size === 'sm' ? 32 : size === 'md' ? 48 : 64}
          height={size === 'sm' ? 32 : size === 'md' ? 48 : 64}
          className="object-contain"
          priority
        />
      </div>
      {message && (
        <p className="text-sm text-muted-foreground animate-pulse">{message}</p>
      )}
    </div>
  )
}
