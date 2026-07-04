import { Hero } from "@/components/marketing/hero";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { Partners } from "@/components/marketing/partners";
import { Safety } from "@/components/marketing/safety";
import { SigningFlow } from "@/components/marketing/signing-flow";
import { WhyMonad } from "@/components/marketing/why-monad";

/**
 * Marketing landing page
 * Layout: vertical scroll narrative with layout variance.
 * Serendale-inspired dark atmospheric design with glass-morphism.
 */
export default function MarketingPage() {
  return (
    <>
      <Hero />
      <Partners />
      <HowItWorks />
      <SigningFlow />
      <Safety />
      <WhyMonad />
    </>
  );
}
