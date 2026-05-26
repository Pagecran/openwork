import { expect, test } from "bun:test";
import { getOnboardingAutoLaunchDecision, type BillingSummary, type OnboardingIntent } from "./den-flow";

const billingAllowed: BillingSummary = {
  featureGateEnabled: true,
  hasActivePlan: true,
  checkoutRequired: false,
  checkoutUrl: null,
  portalUrl: null,
  price: null,
  subscription: null,
  invoices: [],
  productId: null,
  benefitId: null,
};

const billingCheckoutRequired: BillingSummary = {
  ...billingAllowed,
  hasActivePlan: false,
  checkoutRequired: true,
  checkoutUrl: "https://checkout.example.test/session",
};

const onboardingIntent: OnboardingIntent = {
  version: 1,
  workerName: "Ada's Worker",
  shouldLaunch: true,
  completed: false,
  authMethod: "email",
};

test("signup onboarding auto-launch waits for worker list before creating", () => {
  expect(getOnboardingAutoLaunchDecision({
    userId: "user_123",
    activeOrganizationId: "org_1",
    onboardingIntent,
    billingSummary: billingAllowed,
    workersLoadedOnce: false,
    ownedWorkerCount: 0,
    launchBusy: false,
    currentAutoLaunchKey: null,
  })).toBe("wait");
});

test("signup onboarding completes without launch when same active org already has a worker", () => {
  expect(getOnboardingAutoLaunchDecision({
    userId: "user_123",
    activeOrganizationId: "org_1",
    onboardingIntent,
    billingSummary: billingAllowed,
    workersLoadedOnce: true,
    ownedWorkerCount: 1,
    launchBusy: false,
    currentAutoLaunchKey: null,
  })).toBe("complete_existing");
});

test("signup onboarding launches once billing and workers permit first worker creation", () => {
  expect(getOnboardingAutoLaunchDecision({
    userId: "user_123",
    activeOrganizationId: "org_1",
    onboardingIntent,
    billingSummary: billingAllowed,
    workersLoadedOnce: true,
    ownedWorkerCount: 0,
    launchBusy: false,
    currentAutoLaunchKey: null,
  })).toBe("launch");
});

test("signup onboarding does not launch or complete while checkout is required", () => {
  expect(getOnboardingAutoLaunchDecision({
    userId: "user_123",
    activeOrganizationId: "org_1",
    onboardingIntent,
    billingSummary: billingCheckoutRequired,
    workersLoadedOnce: true,
    ownedWorkerCount: 0,
    launchBusy: false,
    currentAutoLaunchKey: null,
  })).toBe("wait");
});

test("signup onboarding duplicate effect calls are suppressed by auto-launch key", () => {
  expect(getOnboardingAutoLaunchDecision({
    userId: "user_123",
    activeOrganizationId: "org_1",
    onboardingIntent,
    billingSummary: billingAllowed,
    workersLoadedOnce: true,
    ownedWorkerCount: 0,
    launchBusy: false,
    currentAutoLaunchKey: "org_1:Ada's Worker",
  })).toBe("wait");
});

test("signup onboarding can launch for a different active org with no worker", () => {
  expect(getOnboardingAutoLaunchDecision({
    userId: "user_123",
    activeOrganizationId: "org_2",
    onboardingIntent,
    billingSummary: billingAllowed,
    workersLoadedOnce: true,
    ownedWorkerCount: 0,
    launchBusy: false,
    currentAutoLaunchKey: "org_1:Ada's Worker",
  })).toBe("launch");
});
