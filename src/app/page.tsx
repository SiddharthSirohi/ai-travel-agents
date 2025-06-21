import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-muted/20 text-center p-6 space-y-8">
      <div className="max-w-2xl space-y-4">
        <h1 className="text-4xl md:text-6xl font-extrabold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Your AI Travel Planning Companion
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground">
          Plan unforgettable trips with the power of multiple AI agents working together.
        </p>
      </div>
      <Button asChild size="lg" className="px-8 py-6 text-xl">
        <Link href="/plan">New Trip</Link>
      </Button>
    </main>
  );
}
