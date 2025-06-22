import Image from 'next/image';
import { cn } from '@/lib/utils';

interface BrandLogoProps {
  size?: number;
  className?: string;
}

export function BrandLogo({ size = 120, className }: BrandLogoProps) {
  return (
    <Image
      src="/columbus-logo.svg"
      alt="Columbus AI Logo"
      width={size}
      height={size}
      priority
      className={cn(className)}
    />
  );
} 