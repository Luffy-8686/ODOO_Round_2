export interface PriceCalculationParams {
  tier: "GOLD" | "SILVER" | "JUNIOR" | "FREE" | "WALK_IN" | "TRIAL" | string;
  isPeak: boolean;
  baseHourlyRatePaise: number; // e.g. 80000 for ₹800
  durationMinutes?: number; // default 60
}

export interface PriceBreakdown {
  tier: string;
  isPeak: boolean;
  baseRatePaise: number;
  discountPercent: number;
  discountPaise: number;
  finalPricePaise: number;
  peakSurchargePaise: number;
  explanation: string;
}

/**
 * Peak hours: 6:00 PM - 10:00 PM (18:00 - 22:00) on weekdays, and 7:00 AM - 12:00 PM & 5:00 PM - 10:00 PM on weekends.
 */
export function isPeakHour(date: Date): boolean {
  const d = new Date(date);
  const hour = d.getHours();
  const day = d.getDay(); // 0 = Sunday, 6 = Saturday

  if (day === 0 || day === 6) {
    // Weekend peak: 7-12 AM or 5-10 PM
    return (hour >= 7 && hour < 12) || (hour >= 17 && hour < 22);
  } else {
    // Weekday peak: 6-10 PM
    return hour >= 18 && hour < 22;
  }
}

/**
 * Core Pricing Matrix:
 * - GOLD: 100% free court access during off-peak and peak.
 * - SILVER: 50% discount on off-peak, 25% discount on peak.
 * - JUNIOR: 60% discount on off-peak, 40% discount on peak (under 18).
 * - FREE / WALK_IN / GUEST: Full base rate (+ 20% surcharge during peak).
 * - TRIAL: 100% free single trial session.
 */
export function calculateCourtPrice(params: PriceCalculationParams): PriceBreakdown {
  const durationMultiplier = (params.durationMinutes || 60) / 60;
  const baseRate = Math.round(params.baseHourlyRatePaise * durationMultiplier);

  let discountPercent = 0;
  let peakSurchargePaise = 0;
  let finalPricePaise = baseRate;
  let explanation = "";

  const tierKey = (params.tier || "WALK_IN").toUpperCase();

  switch (tierKey) {
    case "GOLD":
      discountPercent = 100;
      finalPricePaise = 0;
      explanation = params.isPeak
        ? "Gold Member: 100% free peak court access"
        : "Gold Member: 100% free off-peak court access";
      break;

    case "SILVER":
      if (params.isPeak) {
        discountPercent = 25;
        finalPricePaise = Math.round(baseRate * 0.75);
        explanation = "Silver Member: 25% peak discount applied";
      } else {
        discountPercent = 50;
        finalPricePaise = Math.round(baseRate * 0.5);
        explanation = "Silver Member: 50% off-peak discount applied";
      }
      break;

    case "JUNIOR":
      if (params.isPeak) {
        discountPercent = 40;
        finalPricePaise = Math.round(baseRate * 0.6);
        explanation = "Junior Member (<18): 40% peak discount applied";
      } else {
        discountPercent = 60;
        finalPricePaise = Math.round(baseRate * 0.4);
        explanation = "Junior Member (<18): 60% off-peak discount applied";
      }
      break;

    case "FREE":
      if (params.isPeak) {
        peakSurchargePaise = Math.round(baseRate * 0.2); // 20% peak surge
        finalPricePaise = baseRate + peakSurchargePaise;
        explanation = "Community Member: Standard rate + 20% peak surcharge";
      } else {
        finalPricePaise = baseRate;
        explanation = "Community Member: Standard off-peak rate";
      }
      break;

    case "TRIAL":
      discountPercent = 100;
      finalPricePaise = 0;
      explanation = "Complimentary Visitor Trial Session";
      break;

    case "WALK_IN":
    default:
      if (params.isPeak) {
        peakSurchargePaise = Math.round(baseRate * 0.2); // 20% peak surge
        finalPricePaise = baseRate + peakSurchargePaise;
        explanation = "Walk-in Guest: Standard rate + 20% peak surcharge";
      } else {
        finalPricePaise = baseRate;
        explanation = "Walk-in Guest: Standard off-peak rate";
      }
      break;
  }

  const discountPaise = baseRate - (finalPricePaise - peakSurchargePaise);

  return {
    tier: tierKey,
    isPeak: params.isPeak,
    baseRatePaise: baseRate,
    discountPercent,
    discountPaise: Math.max(0, discountPaise),
    peakSurchargePaise,
    finalPricePaise,
    explanation,
  };
}

/**
 * Calculate product discount based on member tier
 */
export function calculateShopDiscount(tier?: string | null): number {
  if (!tier) return 0;
  switch (tier.toUpperCase()) {
    case "GOLD":
      return 15; // 15% off gear
    case "SILVER":
      return 10; // 10% off gear
    case "JUNIOR":
      return 10; // 10% off gear
    default:
      return 0;
  }
}

/**
 * Calculate bar discount based on member tier
 */
export function calculateBarDiscount(tier?: string | null): number {
  if (!tier) return 0;
  switch (tier.toUpperCase()) {
    case "GOLD":
      return 20; // 20% off F&B
    case "SILVER":
      return 10; // 10% off F&B
    case "JUNIOR":
      return 15; // 15% off healthy snacks & juices
    default:
      return 0;
  }
}
