import { prisma } from "./prisma";
import { logAudit } from "./audit";
import { sendNotification } from "./notifications";

export interface CreateSaleInput {
  memberId?: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  fulfillmentType?: "CLICK_AND_COLLECT" | "HOME_DELIVERY";
  deliveryAddress?: string;
  paymentMethod?: string;
  items: Array<{
    variantId: string;
    quantity: number;
    unitPricePaise: number;
  }>;
  discountPaise?: number;
  userId?: string;
}

export async function executeShopSaleAtomic(input: CreateSaleInput) {
  return await prisma.$transaction(
    async (tx) => {
      let totalPricePaise = 0;

      // 1. Verify stock availability for all items
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
            `Insufficient stock for "${variant.product.name} (${variant.size || variant.color || 'Standard'})". Available: ${availableStock}, Requested: ${item.quantity}`
          );
        }

        totalPricePaise += item.quantity * item.unitPricePaise;
      }

      const discountPaise = input.discountPaise || 0;
      const finalPricePaise = Math.max(0, totalPricePaise - discountPaise);

      // 2. Generate order number
      const orderCount = await tx.shopOrder.count();
      const orderNumber = `SO-${new Date().getFullYear()}-${String(orderCount + 1).padStart(5, "0")}`;

      // 3. Create Shop Order
      const shopOrder = await tx.shopOrder.create({
        data: {
          orderNumber,
          memberId: input.memberId,
          customerName: input.customerName,
          customerPhone: input.customerPhone,
          customerEmail: input.customerEmail,
          fulfillmentType: input.fulfillmentType || "CLICK_AND_COLLECT",
          deliveryAddress: input.deliveryAddress,
          status: input.fulfillmentType === "HOME_DELIVERY" ? "PLACED" : "COLLECTED",
          totalPricePaise,
          discountPaise,
          finalPricePaise,
          paymentStatus: "PAID",
          paymentMethod: input.paymentMethod || "CASH",
        },
      });

      // 4. Create Order Items & Decrement Stock
      for (const item of input.items) {
        await tx.orderItem.create({
          data: {
            shopOrderId: shopOrder.id,
            variantId: item.variantId,
            quantity: item.quantity,
            unitPricePaise: item.unitPricePaise,
            totalPricePaise: item.quantity * item.unitPricePaise,
          },
        });

        const currentVariant = await tx.productVariant.findUnique({
          where: { id: item.variantId },
          include: { product: true },
        });

        if (currentVariant) {
          const prevQty = currentVariant.stockQuantity;
          const newQty = prevQty - item.quantity;

          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stockQuantity: newQty },
          });

          // Stock movement ledger
          await tx.stockMovement.create({
            data: {
              variantId: item.variantId,
              type: input.fulfillmentType === "HOME_DELIVERY" ? "SALE_ONLINE" : "SALE_POS",
              quantityChange: -item.quantity,
              previousQuantity: prevQty,
              newQuantity: newQty,
              reason: `Sale #${orderNumber}`,
              referenceId: shopOrder.id,
              staffUserId: input.userId,
            },
          });

          // Check if now at or below reorder level
          if (newQty <= currentVariant.product.reorderLevel) {
            await sendNotification({
              type: "LOW_STOCK",
              title: "Low Stock Alert",
              message: `Product "${currentVariant.product.name}" is low on stock (${newQty} left).`,
              channel: "IN_APP",
              tx,
            });
          }
        }
      }

      // 5. Create Payment & Ledger Transaction
      if (finalPricePaise > 0) {
        const receiptCount = await tx.payment.count();
        const receiptNumber = `RCP-${new Date().getFullYear()}-${String(receiptCount + 1).padStart(5, "0")}`;

        await tx.payment.create({
          data: {
            receiptNumber,
            shopOrderId: shopOrder.id,
            amountPaise: finalPricePaise,
            method: input.paymentMethod || "CASH",
            status: "SUCCESS",
            module: "SHOP",
            referenceId: shopOrder.orderNumber,
            notes: `Gear Shop Sale: ${shopOrder.orderNumber}`,
          },
        });

        const txCount = await tx.ledgerTransaction.count();
        await tx.ledgerTransaction.create({
          data: {
            entryNumber: `TX-${new Date().getFullYear()}-${String(txCount + 1).padStart(6, "0")}`,
            description: `Gear Shop Sale #${shopOrder.orderNumber} - ${shopOrder.customerName}`,
            module: "SHOP",
            creditPaise: finalPricePaise,
            paymentMethod: input.paymentMethod || "CASH",
            taxAmountPaise: Math.round(finalPricePaise * 0.18),
            referenceType: "SHOP_ORDER",
            referenceId: shopOrder.id,
          },
        });
      }

      // 6. Audit Log
      await logAudit({
        userId: input.userId,
        action: "CREATE",
        entity: "SHOP_ORDER",
        entityId: shopOrder.id,
        details: { orderNumber, finalPricePaise, itemsCount: input.items.length },
        tx,
      });

      return shopOrder;
    },
    { timeout: 15000 }
  );
}
