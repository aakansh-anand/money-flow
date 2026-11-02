"use client";

import { Spinner } from "@/components/ui/spinner";
import { OnboardingCtaButton } from "@/features/profile/components/onboarding-cta-button";
import { useGetProfileQuery } from "@/features/profile/services/profile-api";

export function HomeView() {
  const { data, isLoading, isError } = useGetProfileQuery();

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center" aria-busy="true">
        <Spinner className="size-5" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <p className="p-6 text-sm text-destructive" role="alert">
        {"Couldn't"} load your profile.
      </p>
    );
  }

  if (data.onboardingStatus === "completed") {
    return (
      <section className="flex flex-1 flex-col gap-2 p-6">
        <h2 className="font-heading text-3xl font-semibold">Dashboard</h2>
        <p className="text-muted-foreground">Welcome back, {data.name}.</p>
      </section>
    );
  }

  const inProgress = data.onboardingStatus === "in-progress";

  return (
    <section className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
      <h2 className="font-heading text-3xl font-semibold">Welcome, {data.name}</h2>
      <p className="max-w-md text-muted-foreground">
        {inProgress && data.onboardingStep
          ? `Onboarding is on step ${data.onboardingStep}.`
          : "A few setup steps and your dashboard is ready."}
      </p>
      <OnboardingCtaButton href="/onboarding">
        {inProgress ? "Continue onboarding" : "Start onboarding"}
      </OnboardingCtaButton>
    </section>
  );
}
