import { PageLoading } from "@/components/app/page-loading";

/**
 * App-level loading UI. Shown by Next.js while route segments are loading.
 * The PageLoading component provides an engaging orbital spinner + skeleton
 * cards so users always have something cool to look at during transitions.
 */
export default function Loading() {
  return <PageLoading />;
}
