
import { Purchases, CustomerInfo, Offerings, Package } from "@revenuecat/purchases-js";

// Use environment variable for the API Key. 
// IMPORTANT: For Web, this must be the Public API Key from the RevenueCat dashboard (Stripe/Web platform).
const REVENUECAT_API_KEY = (import.meta as any).env.VITE_REVENUECAT_API_KEY || "test_yAecqOPQQDxaYLxGtNmFmpKzIcU";
const ENTITLEMENT_ID = "Muriell Pro";

export class BillingService {
  private static instance: BillingService;
  private purchases: any = null;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): BillingService {
    if (!BillingService.instance) {
      BillingService.instance = new BillingService();
    }
    return BillingService.instance;
  }

  /**
   * Initialize RevenueCat and identify the user with their Firebase UID
   */
  async initialize(uid: string): Promise<void> {
    if (!uid) {
      console.warn("RevenueCat: No UID provided for initialization.");
      return;
    }

    try {
      // If already initialized with the same user, skip
      if (this.isInitialized && this.purchases) {
        return;
      }

      this.purchases = Purchases.configure({
        apiKey: REVENUECAT_API_KEY,
        appUserId: uid,
      });
      
      this.isInitialized = true;
      console.log("RevenueCat Protocol Initialized for UID:", uid);
      
      if (REVENUECAT_API_KEY.startsWith("test_")) {
        console.warn("RevenueCat: Using a test API key. Entitlement checks may fail in production environments.");
      }
    } catch (e) {
      console.error("RevenueCat Initialization Failure:", e);
      this.isInitialized = false;
    }
  }

  /**
   * Check if the current user has the 'Muriell Pro' entitlement active
   */
  async checkProEntitlement(): Promise<boolean> {
    if (!this.isInitialized || !this.purchases) {
      console.warn("RevenueCat: Service not initialized. Defaulting to free.");
      return false;
    }

    const maxRetries = 2;
    let attempt = 0;

    while (attempt <= maxRetries) {
      try {
        const customerInfo: CustomerInfo = await this.purchases.getCustomerInfo();
        return !!customerInfo.entitlements.active[ENTITLEMENT_ID];
      } catch (e) {
        attempt++;
        const errorMessage = e instanceof Error ? e.message : String(e);
        
        if (attempt <= maxRetries && errorMessage.includes("Error performing request")) {
          console.warn(`RevenueCat: Entitlement check failed (attempt ${attempt}). Retrying in 1s...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }

        console.error("Entitlement Audit Failure:", errorMessage);
        if (errorMessage.includes("Error performing request")) {
          console.error("RevenueCat: Network error or invalid API key. Please ensure VITE_REVENUECAT_API_KEY is a valid Public Web API Key.");
        }
        return false;
      }
    }
    return false;
  }

  /**
   * Fetch current offerings (Monthly, Yearly, Lifetime)
   */
  async getOfferings(): Promise<Offerings | null> {
    if (!this.isInitialized || !this.purchases) return null;
    
    try {
      return await this.purchases.getOfferings();
    } catch (e) {
      console.error("Offering Retrieval Failure:", e);
      return null;
    }
  }

  /**
   * Purchase a specific package
   */
  async purchase(pkg: Package): Promise<boolean> {
    if (!this.isInitialized || !this.purchases) return false;

    try {
      const { customerInfo } = await this.purchases.purchasePackage(pkg);
      return !!customerInfo.entitlements.active[ENTITLEMENT_ID];
    } catch (e) {
      if ((e as any).userCancelled) {
        console.log("Purchase aborted by user.");
      } else {
        console.error("Transaction Error:", e);
      }
      return false;
    }
  }

  /**
   * Open the RevenueCat Customer Center (for subscription management)
   */
  async openCustomerCenter(): Promise<void> {
    if (!this.isInitialized || !this.purchases) return;

    try {
      const customerInfo = await this.purchases.getCustomerInfo();
      if (customerInfo.managementURL) {
        window.location.href = customerInfo.managementURL;
      } else {
        console.warn("No management URL found for this user.");
      }
    } catch (e) {
      console.error("Customer Center Access Error:", e);
    }
  }
}

export const billing = BillingService.getInstance();
