import { useState, ImgHTMLAttributes } from 'react';

interface SafeImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallbackSrc?: string;
  fallbackElement?: React.ReactNode;
  onErrorCallback?: () => void;
}

/**
 * SafeImage component that handles image loading errors gracefully
 * - Shows fallback image or element when primary image fails to load
 * - Logs errors to console for debugging
 * - Prevents broken image icons from showing
 */
export default function SafeImage({
  src,
  alt,
  fallbackSrc,
  fallbackElement,
  onErrorCallback,
  className,
  ...props
}: SafeImageProps) {
  const [hasError, setHasError] = useState(false);
  const [fallbackError, setFallbackError] = useState(false);

  const handleError = () => {
    console.error('Image failed to load:', src);
    setHasError(true);
    onErrorCallback?.();
  };

  const handleFallbackError = () => {
    console.error('Fallback image failed to load:', fallbackSrc);
    setFallbackError(true);
  };

  // If both primary and fallback failed, show fallback element or nothing
  if (hasError && (fallbackError || !fallbackSrc)) {
    if (fallbackElement) {
      return <>{fallbackElement}</>;
    }
    return (
      <div
        className={`flex items-center justify-center bg-forum-bg/50 border border-forum-border/30 ${className || ''}`}
        title={alt}
      >
        <span className="text-[8px] text-forum-muted/40 font-mono">No image</span>
      </div>
    );
  }

  // If primary failed but fallback exists, show fallback
  if (hasError && fallbackSrc && !fallbackError) {
    return (
      <img
        src={fallbackSrc}
        alt={alt}
        className={className}
        onError={handleFallbackError}
        {...props}
      />
    );
  }

  // Show primary image
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={handleError}
      {...props}
    />
  );
}
