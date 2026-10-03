import { prisma } from "./prisma";
import { createCourtBookingAtomic } from "./concurrency";
import { executeShopSaleAtomic } from "./inventory";
import { addItemsToTabAtomic } from "./tabs";
import { logAudit } from "./audit";

/**
 * Scripted "Demo Day" Scenario: Simulates the 6:00 PM evening rush at The Champions Club.
 * Executes live transactions across Court Booking, Shop POS, Bar POS, and Lead CRM in seconds!
 */
export async function trigger6PMRushSimulation() {
  const log: string[] = [];

  // 1. Find active courts & members
  const padelCourt = await prisma.court.findFirst({ where: { name: { contains: "Padel" } } });
  const tennisCourt = await prisma.court.findFirst({ where: { name: { contains: "Center" } } });
  const badmintonCourt = await prisma.court.findFirst({ where: { name: { contains: "Badminton" } } });

  const goldMember = await prisma.member.findFirst({
    where: { memberships: { some: { tier: "GOLD", status: "ACTIVE" } } },
  });
  const silverMember = await prisma.member.findFirst({
    where: { memberships: { some: { tier: "SILVER", status: "ACTIVE" } } },
  });

  const today6PM = new Date();
  today6PM.setHours(18, 0, 0, 0);

  const today630PM = new Date();
  today630PM.setHours(18, 30, 0, 0);

  // 2. Book 6:00 PM Padel Court (Gold Member)
  if (padelCourt && goldMember) {
    try {
      const b1 = await createCourtBookingAtomic({
        courtId: padelCourt.id,
        memberId: goldMember.id,
        bookerName: goldMember.name,
        bookerPhone: goldMember.phone,
        bookerEmail: goldMember.email,
        startTime: today6PM,
        durationMinutes: 60,
        source: "FRONT_DESK",
      });
      log.push(`🎾 Booked 6:00 PM Padel Court for Gold Member ${goldMember.name} (#${b1.bookingNumber}) - Free Tier`);
    } catch (e: any) {
      log.push(`⚠️ Padel 6 PM booking note: ${e.message}`);
    }
  }

  // 3. Book 6:30 PM Tennis Court (Silver Member)
  if (tennisCourt && silverMember) {
    try {
      const b2 = await createCourtBookingAtomic({
        courtId: tennisCourt.id,
        memberId: silverMember.id,
        bookerName: silverMember.name,
        bookerPhone: silverMember.phone,
        bookerEmail: silverMember.email,
        startTime: today630PM,
        durationMinutes: 60,
        paymentMethod: "UPI",
        source: "MEMBER_PORTAL",
      });
      log.push(`🎾 Booked 6:30 PM Tennis Court for Silver Member ${silverMember.name} (#${b2.bookingNumber}) - 25% Peak Discount`);
    } catch (e: any) {
      log.push(`⚠️ Tennis 6:30 PM booking note: ${e.message}`);
    }
  }

  // 4. Shop Sale: Wilson balls & Dri-FIT polo
  const variantBalls = await prisma.productVariant.findFirst({
    where: { product: { category: "BALLS" }, stockQuantity: { gt: 2 } },
    include: { product: true },
  });

  if (variantBalls && goldMember) {
    try {
      const sale = await executeShopSaleAtomic({
        memberId: goldMember.id,
        customerName: goldMember.name,
        customerPhone: goldMember.phone,
        fulfillmentType: "CLICK_AND_COLLECT",
        paymentMethod: "UPI",
        items: [
          {
            variantId: variantBalls.id,
            quantity: 2,
            unitPricePaise: variantBalls.product.pricePaise,
          },
        ],
        discountPaise: Math.round(variantBalls.product.pricePaise * 2 * 0.15), // 15% Gold discount
      });
      log.push(`🛍️ Shop POS Sale #${sale.orderNumber}: 2x ${variantBalls.product.name} to ${goldMember.name} (15% Member Discount)`);
    } catch (e: any) {
      log.push(`⚠️ Shop sale note: ${e.message}`);
    }
  }

  // 5. Bar Orders sent to Table 3 & KDS
  const table3 = await prisma.table.findFirst({ where: { tableNumber: 3 } });
  const shakeItem = await prisma.menuItem.findFirst({ where: { category: "HEALTH_SHAKES" } });
  const pizzaItem = await prisma.menuItem.findFirst({ where: { name: { contains: "Pizza" } } });

  if (table3 && shakeItem && pizzaItem) {
    try {
      const barRes = await addItemsToTabAtomic({
        tableId: table3.id,
        guestName: "Team Wilson Players",
        orderNotes: "Rush order for post-match table",
        items: [
          { menuItemId: shakeItem.id, quantity: 2, unitPricePaise: shakeItem.pricePaise },
          { menuItemId: pizzaItem.id, quantity: 1, unitPricePaise: pizzaItem.pricePaise },
        ],
      });
      log.push(`🍕 Bar Order #${barRes.barOrder.orderNumber} sent to Kitchen Display System (KDS) for Table 3`);
    } catch (e: any) {
      log.push(`⚠️ Bar order note: ${e.message}`);
    }
  }

  // 6. Incoming Lead from Website
  const leadCount = await prisma.lead.count();
  const newLead = await prisma.lead.create({
    data: {
      leadNumber: `LD-${new Date().getFullYear()}-${String(leadCount + 1).padStart(5, "0")}`,
      name: "Gaurav Sen",
      phone: "+91 99887 76655",
      email: "gaurav@techcorp.io",
      source: "WEBSITE",
      sportInterest: "Padel",
      status: "NEW",
      notes: "Submitted 'Book a Trial' for Saturday morning padel.",
    },
  });
  log.push(`💼 New Lead captured from Website: ${newLead.name} (${newLead.sportInterest})`);

  await logAudit({
    action: "CREATE",
    entity: "SETTING",
    entityId: "6PM_RUSH_SIMULATION",
    details: { log },
  });

  return { success: true, log };
}
