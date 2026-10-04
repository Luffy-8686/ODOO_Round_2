import { prisma } from "./prisma";
import { calculateShopDiscount } from "./pricing";
import { logAudit } from "./audit";
import { sendNotification } from "./notifications";

/** Security Deposit fee: ₹0 for store purchases (applicable exclusively to Gold court bookings) */
export const SECURITY_DEPOSIT_PAISE = 0; // ₹0 INR

export interface BillingItemInput {
  variantId: string;
  quantity: number;
  unitPricePaise?: number;
  notes?: string;
}

export interface BillingLineItem {
  variantId: string;
  productName: string;
  variantName: string;
  sku: string;
  category: string;
  quantity: number;
  fullUnitPricePaise: number;
  fullTotalPricePaise: number;
  discountPercent: number;
  discountAmountPaise: number;
  netPricePaise: number;
}

export interface BillingCalculationResult {
  items: BillingLineItem[];
  totalFullPricePaise: number;
  memberId: string | null;
  memberName: string | null;
  memberTier: string;
  membershipPlanName: string | null;
  discountPercent: number;
  totalDiscountPaise: number;
  netSubtotalPaise: number;
  securityDepositPaise: number;
  finalPayablePaise: number;
  apiKeyProvided: boolean;
  apiKeyRef: string | null;
  invoiceNumber: string;
  timestamp: string;
}

export interface CheckoutInput {
  items: BillingItemInput[];
  memberId?: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  fulfillmentType?: "CLICK_AND_COLLECT" | "HOME_DELIVERY";
  deliveryAddress?: string;
  paymentMethod?: string;
  apiKey?: string | null;
  userId?: string | null;
}

/**
 * Mask an API key for safe display and logging
 */
export function maskApiKey(apiKey?: string | null): string | null {
  if (!apiKey || typeof apiKey !== "string") return null;
  const trimmed = apiKey.trim();
  if (trimmed.length <= 8) return "****" + trimmed.slice(-2);
  return trimmed.slice(0, 4) + "••••••••" + trimmed.slice(-4);
}

/**
 * Resolves the active billing API key from request input or environment
 */
export function resolveApiKey(providedApiKey?: string | null): { key: string | null; source: string | null } {
  if (providedApiKey && providedApiKey.trim().length > 0) {
    return { key: providedApiKey.trim(), source: "REQUEST_INPUT" };
  }
  const envKey = process.env.BILLING_API_KEY || process.env.PAYMENT_GATEWAY_API_KEY || process.env.NEXT_PUBLIC_BILLING_API_KEY;
  if (envKey && envKey.trim().length > 0) {
    return { key: envKey.trim(), source: "ENVIRONMENT" };
  }
  return { key: null, source: null };
}

/**
 * Calculates complete itemized billing:
 * 1. Full original price of every product bought
 * 2. Membership discount rules according to tier & plan
 * 3. 100 INR security deposit
 * 4. Billing details and API key authorization reference
 */
export async function calculateBillingDetails(params: {
  items: BillingItemInput[];
  memberId?: string | null;
  memberTier?: string | null;
  apiKey?: string | null;
  isCourtBooking?: boolean;
  includeSecurityDeposit?: boolean;
  tx?: any;
}): Promise<BillingCalculationResult> {
  const db = params.tx || prisma;

  if (!params.items || params.items.length === 0) {
    throw new Error("Cannot calculate billing for an empty items list.");
  }

  // 1. Fetch Member & Membership Plan for discount calculation
  let memberTier = params.memberTier ? params.memberTier.toUpperCase() : "WALK_IN";
  let memberName: string | null = null;
  let membershipPlanName: string | null = null;
  let discountPercent = 0;

  if (params.memberId) {
    const member = await db.member.findUnique({
      where: { id: params.memberId },
      include: {
        memberships: {
          where: { status: "ACTIVE" },
          include: { plan: true },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (member) {
      memberName = member.name;
      const activeMembership = member.memberships?.[0];
      if (activeMembership) {
        memberTier = activeMembership.tier?.toUpperCase() || activeMembership.plan?.tier?.toUpperCase() || "WALK_IN";
        membershipPlanName = activeMembership.plan?.name || `${memberTier} Membership`;
        discountPercent = activeMembership.plan?.shopDiscountPercent ?? calculateShopDiscount(memberTier);
      } else {
        memberTier = "FREE";
        discountPercent = 0;
      }
    }
  } else if (params.memberTier) {
    discountPercent = calculateShopDiscount(params.memberTier);
  }

  // 2. Fetch all product variants and calculate full price & discounts
  const lineItems: BillingLineItem[] = [];
  let totalFullPricePaise = 0;
  let totalDiscountPaise = 0;

  for (const item of params.items) {
    const variant = await db.productVariant.findUnique({
      where: { id: item.variantId },
      include: { product: true },
    });

    if (!variant) {
      throw new Error(`Product variant not found: ${item.variantId}`);
    }

    const fullUnitPricePaise = item.unitPricePaise && item.unitPricePaise > 0
      ? item.unitPricePaise
      : variant.product.pricePaise;

    const fullTotalPricePaise = fullUnitPricePaise * item.quantity;
    const discountAmountPaise = Math.round((fullTotalPricePaise * discountPercent) / 100);
    const netPricePaise = Math.max(0, fullTotalPricePaise - discountAmountPaise);

    totalFullPricePaise += fullTotalPricePaise;
    totalDiscountPaise += discountAmountPaise;

    const variantLabel = [variant.size, variant.color, variant.weight].filter(Boolean).join(" / ") || "Standard";

    lineItems.push({
      variantId: variant.id,
      productName: variant.product.name,
      variantName: variantLabel,
      sku: variant.sku || variant.product.sku,
      category: variant.product.category,
      quantity: item.quantity,
      fullUnitPricePaise,
      fullTotalPricePaise,
      discountPercent,
      discountAmountPaise,
      netPricePaise,
    });
  }

  const netSubtotalPaise = Math.max(0, totalFullPricePaise - totalDiscountPaise);
  // Security deposit: 100 INR (10,000 paise) for Gold court bookings or if explicitly requested; 0 for others
  const isGoldCourtBooking = !!(params.isCourtBooking && memberTier === "GOLD");
  const securityDepositPaise = (params.includeSecurityDeposit || isGoldCourtBooking) ? 10000 : SECURITY_DEPOSIT_PAISE;
  const finalPayablePaise = netSubtotalPaise + securityDepositPaise;

  // Resolve API Key
  const resolved = resolveApiKey(params.apiKey);
  const maskedKey = maskApiKey(resolved.key);

  const randSuffix = Math.floor(1000 + Math.random() * 9000);
  const invoiceNumber = `BILL-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}${randSuffix}`;

  return {
    items: lineItems,
    totalFullPricePaise,
    memberId: params.memberId || null,
    memberName,
    memberTier,
    membershipPlanName,
    discountPercent,
    totalDiscountPaise,
    netSubtotalPaise,
    securityDepositPaise,
    finalPayablePaise,
    apiKeyProvided: !!resolved.key,
    apiKeyRef: maskedKey,
    invoiceNumber,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Executes a full checkout transaction with:
 * - Full price accounting
 * - Membership discount
 * - 100 INR security deposit
 * - API Key recording
 * - Stock deduction & audit log
 */
export async function executeCheckoutService(input: CheckoutInput) {
  return await prisma.$transaction(async (tx) => {
    // 1. Calculate billing details
    const billing = await calculateBillingDetails({
      items: input.items,
      memberId: input.memberId,
      apiKey: input.apiKey,
      tx,
    });

    // 2. Validate physical stock
    for (const item of input.items) {
      const variant = await tx.productVariant.findUnique({
        where: { id: item.variantId },
        include: { product: true },
      });

      if (!variant) {
        throw new Error(`Product variant not found: ${item.variantId}`);
      }

      const availableStock = variant.stockQuantity - variant.reservedQuantity;
      if (availableStock < item.quantity) {
        throw new Error(
          `Insufficient stock for "${variant.product.name}". Available: ${availableStock}, Requested: ${item.quantity}`
        );
      }
    }

    // 3. Generate Order Number
    const orderCount = await tx.shopOrder.count();
    const orderNumber = `SO-${new Date().getFullYear()}-${String(orderCount + 1).padStart(5, "0")}`;

    // 4. Create Shop Order with security deposit and API Key
    const shopOrder = await tx.shopOrder.create({
      data: {
        orderNumber,
        memberId: input.memberId || null,
        customerName: input.customerName,
        customerPhone: input.customerPhone,
        customerEmail: input.customerEmail,
        fulfillmentType: input.fulfillmentType || "CLICK_AND_COLLECT",
        deliveryAddress: input.deliveryAddress,
        status: input.fulfillmentType === "HOME_DELIVERY" ? "PLACED" : "COLLECTED",
        totalPricePaise: billing.totalFullPricePaise,
        discountPaise: billing.totalDiscountPaise,
        securityDepositPaise: billing.securityDepositPaise, // 0 INR for shop orders
        finalPricePaise: billing.finalPayablePaise, // Net Subtotal
        paymentStatus: "PAID",
        paymentMethod: input.paymentMethod || "ONLINE",
        apiKeyRef: billing.apiKeyRef,
        notes: `Billing authorized. API Key: ${billing.apiKeyRef || "N/A"}.`,
      },
    });

    // 5. Create Order Items & Decrement Stock
    for (const line of billing.items) {
      await tx.orderItem.create({
        data: {
          shopOrderId: shopOrder.id,
          variantId: line.variantId,
          quantity: line.quantity,
          unitPricePaise: line.fullUnitPricePaise,
          totalPricePaise: line.fullTotalPricePaise,
        },
      });

      const currentVariant = await tx.productVariant.findUnique({
        where: { id: line.variantId },
      });

      if (currentVariant) {
        const newQty = currentVariant.stockQuantity - line.quantity;
        await tx.productVariant.update({
          where: { id: line.variantId },
          data: { stockQuantity: newQty },
        });

        // Record stock movement
        await tx.stockMovement.create({
          data: {
            variantId: line.variantId,
            type: "SALE_POS",
            quantityChange: -line.quantity,
            previousQuantity: currentVariant.stockQuantity,
            newQuantity: newQty,
            reason: `Order #${orderNumber} (${billing.memberTier} Checkout)`,
            referenceId: shopOrder.id,
            staffUserId: input.userId || null,
          },
        });
      }
    }

    // 6. Record Payment
    const paymentCount = await tx.payment.count();
    const receiptNumber = `RCP-${new Date().getFullYear()}-${String(paymentCount + 1).padStart(5, "0")}`;

    await tx.payment.create({
      data: {
        receiptNumber,
        shopOrderId: shopOrder.id,
        amountPaise: billing.finalPayablePaise,
        method: input.paymentMethod || "UPI",
        module: "SHOP",
        referenceId: shopOrder.id,
        transactionRef: billing.apiKeyRef ? `API-KEY-${billing.apiKeyRef}` : `GATEWAY-${Date.now().toString().slice(-6)}`,
        status: "SUCCESS",
        notes: `Total: ₹${(billing.finalPayablePaise / 100).toFixed(2)} (Incl. ₹100 Security Deposit). Member: ${billing.memberTier}.`,
      },
    });

    // 7. Audit log
    await logAudit({
      userId: input.userId || null,
      userName: input.customerName,
      action: "CREATE",
      entity: "SHOP_ORDER",
      entityId: shopOrder.id,
      details: {
        orderNumber,
        itemsCount: billing.items.length,
        totalFullPricePaise: billing.totalFullPricePaise,
        discountPaise: billing.totalDiscountPaise,
        securityDepositPaise: billing.securityDepositPaise,
        finalPayablePaise: billing.finalPayablePaise,
        apiKeyRef: billing.apiKeyRef,
      },
      tx,
    });

    // 8. Notification if member
    if (input.memberId) {
      await sendNotification({
        memberId: input.memberId,
        type: "ORDER_STATUS",
        title: `Pro Shop Order #${orderNumber} Confirmed`,
        message: `Your order for ₹${(billing.finalPayablePaise / 100).toFixed(2)} (including ₹100 security deposit) has been processed. Member allowance of ₹${(billing.totalDiscountPaise / 100).toFixed(2)} applied.`,
        tx,
      });
    }

    return {
      success: true,
      order: shopOrder,
      billing,
    };
  });
}
