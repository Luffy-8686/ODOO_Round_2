import { prisma } from "./prisma";
import { logAudit } from "./audit";
import { calculateBarDiscount } from "./pricing";

export interface AddBarOrderInput {
  tabId?: string;
  tableId?: string;
  memberId?: string;
  guestName?: string;
  items: Array<{
    menuItemId: string;
    quantity: number;
    unitPricePaise: number;
    notes?: string;
  }>;
  orderNotes?: string;
  staffUserId?: string;
}

export interface SettleTabInput {
  tabId: string;
  payments: Array<{
    method: "CASH" | "CARD" | "UPI" | "TAB_CHARGE" | "MEMBER_CREDIT";
    amountPaise: number;
  }>;
  manualDiscountPaise?: number;
  discountReason?: string;
  staffUserId?: string;
}

export async function addItemsToTabAtomic(input: AddBarOrderInput) {
  return await prisma.$transaction(
    async (tx) => {
      let tabId = input.tabId;

      // 1. If no tab provided, create or find open tab for table/member
      if (!tabId) {
        const tabCount = await tx.tab.count();
        const tabNumber = `TAB-${new Date().getFullYear()}-${String(tabCount + 1).padStart(5, "0")}`;

        const newTab = await tx.tab.create({
          data: {
            tabNumber,
            tableId: input.tableId,
            memberId: input.memberId,
            guestName: input.guestName || "Walk-in Guest",
            status: "OPEN",
          },
        });
        tabId = newTab.id;

        if (input.tableId) {
          await tx.table.update({
            where: { id: input.tableId },
            data: { status: "OCCUPIED", currentTabId: tabId },
          });
        }
      }

      // 2. Generate bar order for KDS
      const orderCount = await tx.barOrder.count();
      const orderNumber = `BO-${new Date().getFullYear()}-${String(orderCount + 1).padStart(5, "0")}`;

      const barOrder = await tx.barOrder.create({
        data: {
          orderNumber,
          tabId,
          tableId: input.tableId,
          status: "NEW",
          notes: input.orderNotes,
          staffUserId: input.staffUserId,
        },
      });

      let orderTotalPaise = 0;
      for (const item of input.items) {
        const lineTotal = item.quantity * item.unitPricePaise;
        orderTotalPaise += lineTotal;

        await tx.barOrderItem.create({
          data: {
            barOrderId: barOrder.id,
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            unitPricePaise: item.unitPricePaise,
            totalPricePaise: lineTotal,
            notes: item.notes,
          },
        });
      }

      // 3. Update tab totals with auto tier discount
      const currentTab = await tx.tab.findUnique({
        where: { id: tabId },
        include: {
          member: {
            include: {
              memberships: {
                where: { status: "ACTIVE" },
                include: { plan: true },
              },
            },
          },
          orders: {
            where: { status: { not: "CANCELLED" } },
            include: { items: true },
          },
        },
      });

      if (currentTab) {
        const allOrders = await tx.barOrder.findMany({
          where: { tabId, status: { not: "CANCELLED" } },
          include: { items: true },
        });

        const totalAmountPaise = allOrders.reduce((sum, ord) => {
          return sum + ord.items.reduce((s, it) => s + it.totalPricePaise, 0);
        }, 0);

        const memberTier = currentTab.member?.memberships[0]?.plan?.tier;
        const discountPercent = calculateBarDiscount(memberTier);
        const discountAmountPaise = Math.round((totalAmountPaise * discountPercent) / 100);
        const finalAmountPaise = Math.max(0, totalAmountPaise - discountAmountPaise);

        await tx.tab.update({
          where: { id: tabId },
          data: {
            totalAmountPaise,
            discountAmountPaise,
            finalAmountPaise,
          },
        });
      }

      await logAudit({
        userId: input.staffUserId,
        action: "CREATE",
        entity: "BAR_ORDER",
        entityId: barOrder.id,
        details: { orderNumber, tabId, itemsCount: input.items.length },
        tx,
      });

      return { barOrder, tabId };
    },
    { timeout: 15000 }
  );
}

export async function settleTabAtomic(input: SettleTabInput) {
  return await prisma.$transaction(
    async (tx) => {
      const tab = await tx.tab.findUnique({
        where: { id: input.tabId },
        include: { table: true, member: true },
      });

      if (!tab || tab.status === "CLOSED") {
        throw new Error("Tab not found or already settled.");
      }

      const totalPaidPaise = input.payments.reduce((sum, p) => sum + p.amountPaise, 0);
      const expectedPaise = tab.finalAmountPaise - (input.manualDiscountPaise || 0);

      if (totalPaidPaise < expectedPaise) {
        throw new Error(
          `Insufficient payment: Provided ₹${(totalPaidPaise / 100).toFixed(2)}, required ₹${(
            expectedPaise / 100
          ).toFixed(2)}`
        );
      }

      // Record each split payment
      for (const p of input.payments) {
        const receiptCount = await tx.payment.count();
        const receiptNumber = `RCP-${new Date().getFullYear()}-${String(receiptCount + 1).padStart(5, "0")}`;

        await tx.payment.create({
          data: {
            receiptNumber,
            tabId: tab.id,
            amountPaise: p.amountPaise,
            method: p.method,
            status: "SUCCESS",
            module: "BAR",
            referenceId: tab.tabNumber,
            notes: `Settlement for Tab ${tab.tabNumber}`,
          },
        });
      }

      // Ledger entry for total bill
      const txCount = await tx.ledgerTransaction.count();
      await tx.ledgerTransaction.create({
        data: {
          entryNumber: `TX-${new Date().getFullYear()}-${String(txCount + 1).padStart(6, "0")}`,
          description: `Bar Tab Settlement #${tab.tabNumber} (${tab.guestName || tab.member?.name || 'Walk-in'})`,
          module: "BAR",
          creditPaise: totalPaidPaise,
          paymentMethod: input.payments.map((p) => p.method).join(", "),
          taxAmountPaise: Math.round(totalPaidPaise * 0.05),
          referenceType: "TAB",
          referenceId: tab.id,
        },
      });

      // Close Tab
      const closedTab = await tx.tab.update({
        where: { id: tab.id },
        data: {
          status: "CLOSED",
          closedAt: new Date(),
          closedByUserId: input.staffUserId,
        },
      });

      // Free table
      if (tab.tableId) {
        await tx.table.update({
          where: { id: tab.tableId },
          data: { status: "FREE", currentTabId: null },
        });
      }

      await logAudit({
        userId: input.staffUserId,
        action: "PAYMENT",
        entity: "TAB",
        entityId: tab.id,
        details: { tabNumber: tab.tabNumber, amountPaidPaise: totalPaidPaise },
        tx,
      });

      return closedTab;
    },
    { timeout: 15000 }
  );
}
