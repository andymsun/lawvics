
import { cn } from '@/lib/utils';

interface BrandLogoProps {
    className?: string;
    variant?: 'full' | 'icon';
    height?: number;
}

export function BrandLogo({ className, variant = 'full', height }: BrandLogoProps) {
    // Logic:
    // Light Mode (White Background) -> Needs Dark Text -> Use Lawvics-dark.svg
    // Dark Mode (Black Background) -> Needs Light Text -> Use Lawvics-light.svg

    const lightModeSrc = variant === 'full' ? '/brand/transparent/Lawvics-dark.png' : '/brand/transparent/Lawvics person-dark.png';
    const darkModeSrc = variant === 'full' ? '/brand/transparent/Lawvics-light.png' : '/brand/transparent/Lawvics person-light.png';

    return (
        <div className={cn("relative flex items-center", className)} style={height ? { height } : undefined}>
            {/* Light Mode Image (Dark Logo) */}
            <img
                src={lightModeSrc}
                alt="Lawvics"
                className="h-full w-auto object-contain block dark:hidden"
            />

            {/* Dark Mode Image (Light Logo) */}
            <img
                src={darkModeSrc}
                alt="Lawvics"
                className="h-full w-auto object-contain hidden dark:block"
            />
        </div>
    );
}
