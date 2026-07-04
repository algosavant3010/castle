import { Providers } from "@/components/providers";
import { AuthGuard } from "@/components/app/auth-guard";

/**
 * App Shell Layout
 *
 * Providers mount wagmi, TanStack Query, RainbowKit.
 * AuthGuard gates access behind wallet connection and renders the app shell.
 */
export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>
      <AuthGuard>
        {children}
      </AuthGuard>
    </Providers>
  );
}
