import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting The Champions Club database seed...");
  const demoPasswordHash = bcrypt.hashSync("Demo@1234", 10);

  // Clean existing data in logical order
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.quote.deleteMany();
  await prisma.leadActivity.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.payslip.deleteMany();
  await prisma.payroll.deleteMany();
  await prisma.leaveRequest.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.memberAttendance.deleteMany();
  await prisma.shift.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.vendor.deleteMany();
  await prisma.invoiceLine.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.ledgerTransaction.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.barOrderItem.deleteMany();
  await prisma.barOrder.deleteMany();
  await prisma.tab.deleteMany();
  await prisma.table.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.serviceJob.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.shopOrder.deleteMany();
  await prisma.purchaseOrderItem.deleteMany();
  await prisma.purchaseOrder.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.socialParticipant.deleteMany();
  await prisma.socialSession.deleteMany();
  await prisma.waitlist.deleteMany();
  await prisma.maintenanceBlock.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.court.deleteMany();
  await prisma.sport.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.plan.deleteMany();
  await prisma.member.deleteMany();
  await prisma.user.deleteMany();
  await prisma.setting.deleteMany();

  // 1. Settings
  await prisma.setting.createMany({
    data: [
      {
        key: "CLUB_INFO",
        valueJson: JSON.stringify({
          name: "The Champions Club",
          tagline: "Premier Sports & Wellness Destination",
          address: "Plot 42, Sport City Boulevard, Bangalore - 560102",
          phone: "+91 80 2345 6789",
          email: "info@championsclub.in",
          gstin: "29AAAAA0000A1Z5",
          currency: "INR",
          openingHour: 6,
          closingHour: 23,
        }),
        description: "General club profile and metadata",
      },
      {
        key: "CANCELLATION_POLICY",
        valueJson: JSON.stringify({
          freeCancellationHours: 6,
          lateCancellationFeePercent: 50,
          noShowFeePercent: 100,
        }),
        description: "Court booking cancellation and refund rules",
      },
    ],
  });

  // 2. Plans
  const goldPlan = await prisma.plan.create({
    data: {
      tier: "GOLD",
      name: "Gold All-Access Tier",
      monthlyFeePaise: 500000, // ₹5,000 / mo
      annualFeePaise: 5000000, // ₹50,000 / yr
      courtRatePerHourPaise: 0, // 100% Free courts
      shopDiscountPercent: 15,
      barDiscountPercent: 20,
      maxBookingsPerDay: 2,
      advanceBookingDays: 14,
      description: "Unlimited complimentary court access, premium lounge privileges, priority booking.",
      featuresJson: JSON.stringify([
        "100% Free Court Access (All Sports)",
        "14-Day Advance Booking Window",
        "20% Discount on Bar & Cafeteria",
        "15% Discount at Pro Shop",
        "Dedicated Locker & Towel Service",
      ]),
    },
  });

  const silverPlan = await prisma.plan.create({
    data: {
      tier: "SILVER",
      name: "Silver Standard Tier",
      monthlyFeePaise: 250000, // ₹2,500 / mo
      annualFeePaise: 2500000, // ₹25,000 / yr
      courtRatePerHourPaise: 40000, // ₹400 / hr (50% off)
      shopDiscountPercent: 10,
      barDiscountPercent: 10,
      maxBookingsPerDay: 2,
      advanceBookingDays: 7,
      description: "Discounted court rates, full facility access, 7-day advance booking window.",
      featuresJson: JSON.stringify([
        "50% Off Court Bookings",
        "7-Day Advance Booking Window",
        "10% Discount on Bar & Cafeteria",
        "10% Discount at Pro Shop",
        "Club Tournaments Entry Access",
      ]),
    },
  });

  const juniorPlan = await prisma.plan.create({
    data: {
      tier: "JUNIOR",
      name: "Junior Academy Tier (Under 18)",
      monthlyFeePaise: 150000, // ₹1,500 / mo
      annualFeePaise: 1500000, // ₹15,000 / yr
      courtRatePerHourPaise: 30000, // ₹300 / hr (60% off)
      shopDiscountPercent: 10,
      barDiscountPercent: 15,
      maxBookingsPerDay: 2,
      advanceBookingDays: 7,
      description: "Exclusive subsidized tier for budding athletes under 18 years.",
      featuresJson: JSON.stringify([
        "60% Off Off-Peak Court Bookings",
        "Dedicated Contact to Coaches",
        "15% Discount on Healthy Juices & Snacks",
        "Junior League Entry",
      ]),
    },
  });

  // 3. Sports & Courts
  const tennis = await prisma.sport.create({
    data: { name: "Tennis", icon: "🎾", description: "Standard international size tennis courts" },
  });
  const padel = await prisma.sport.create({
    data: { name: "Padel", icon: "🏸", description: "State-of-the-art panoramic glass padel courts" },
  });
  const badminton = await prisma.sport.create({
    data: { name: "Badminton", icon: "🏸", description: "BWF-standard wooden and synthetic indoor courts" },
  });
  const cricket = await prisma.sport.create({
    data: { name: "Cricket", icon: "🏏", description: "Professional turf bowling and batting nets" },
  });

  const court1 = await prisma.court.create({
    data: {
      name: "Center Court (Clay)",
      sportId: tennis.id,
      surfaceType: "Clay",
      isIndoor: false,
      status: "ACTIVE",
      hourlyRatePaise: 80000, // ₹800
    },
  });
  const court2 = await prisma.court.create({
    data: {
      name: "Tennis Court 2 (Hard)",
      sportId: tennis.id,
      surfaceType: "Hard",
      isIndoor: false,
      status: "ACTIVE",
      hourlyRatePaise: 70000, // ₹700
    },
  });
  const court3 = await prisma.court.create({
    data: {
      name: "Padel Court 1 (Panoramic)",
      sportId: padel.id,
      surfaceType: "Glass",
      isIndoor: false,
      status: "ACTIVE",
      hourlyRatePaise: 100000, // ₹1,000
    },
  });
  const court4 = await prisma.court.create({
    data: {
      name: "Padel Court 2 (Pro Glass)",
      sportId: padel.id,
      surfaceType: "Glass",
      isIndoor: false,
      status: "ACTIVE",
      hourlyRatePaise: 100000, // ₹1,000
    },
  });
  const court5 = await prisma.court.create({
    data: {
      name: "Badminton Hall 1 (Indoor Wooden)",
      sportId: badminton.id,
      surfaceType: "Wooden",
      isIndoor: true,
      status: "ACTIVE",
      hourlyRatePaise: 60000, // ₹600
    },
  });
  const court6 = await prisma.court.create({
    data: {
      name: "Cricket Net 1 (Astro Turf)",
      sportId: cricket.id,
      surfaceType: "AstroTurf",
      isIndoor: false,
      status: "ACTIVE",
      hourlyRatePaise: 50000, // ₹500
    },
  });

  const allCourts = [court1, court2, court3, court4, court5, court6];

  // 4. Staff Users & Employees
  const ownerUser = await prisma.user.create({
    data: {
      id: "user-owner-1",
      name: "Vikram Malhotra",
      email: "owner@championsclub.in",
      passwordHash: demoPasswordHash,
      role: "OWNER",
      phone: "+91 98765 43210",
      isActive: true,
    },
  });

  const managerUser = await prisma.user.create({
    data: {
      id: "user-manager-1",
      name: "Ananya Sharma",
      email: "manager@championsclub.in",
      passwordHash: demoPasswordHash,
      role: "MANAGER",
      phone: "+91 98765 43211",
      isActive: true,
    },
  });
  const managerEmp = await prisma.employee.create({
    data: {
      id: "emp-001",
      employeeCode: "EMP-001",
      userId: managerUser.id,
      name: managerUser.name,
      role: "MANAGER",
      email: managerUser.email,
      phone: managerUser.phone!,
      monthlySalaryPaise: 6500000, // ₹65,000
    },
  });

  const frontDeskUser = await prisma.user.create({
    data: {
      id: "user-frontdesk-1",
      name: "Rahul Verma",
      email: "frontdesk@championsclub.in",
      passwordHash: demoPasswordHash,
      role: "FRONT_DESK",
      phone: "+91 98765 43212",
      isActive: true,
    },
  });
  const frontDeskEmp = await prisma.employee.create({
    data: {
      id: "emp-002",
      employeeCode: "EMP-002",
      userId: frontDeskUser.id,
      name: frontDeskUser.name,
      role: "FRONT_DESK",
      email: frontDeskUser.email,
      phone: frontDeskUser.phone!,
      monthlySalaryPaise: 3500000, // ₹35,000
    },
  });

  const barUser = await prisma.user.create({
    data: {
      id: "user-bar-1",
      name: "Sanjay Kumar",
      email: "bar@championsclub.in",
      passwordHash: demoPasswordHash,
      role: "BAR_STAFF",
      phone: "+91 98765 43213",
      isActive: true,
    },
  });
  const barEmp = await prisma.employee.create({
    data: {
      id: "emp-004",
      employeeCode: "EMP-004",
      userId: barUser.id,
      name: barUser.name,
      role: "BAR_STAFF",
      email: barUser.email,
      phone: barUser.phone!,
      monthlySalaryPaise: 3000000, // ₹30,000
    },
  });

  const shopUser = await prisma.user.create({
    data: {
      id: "user-shop-1",
      name: "Pooja Patel",
      email: "shop@championsclub.in",
      passwordHash: demoPasswordHash,
      role: "SHOP_STAFF",
      phone: "+91 98765 43214",
      isActive: true,
    },
  });
  const shopEmp = await prisma.employee.create({
    data: {
      id: "emp-007",
      employeeCode: "EMP-007",
      userId: shopUser.id,
      name: shopUser.name,
      role: "SHOP_STAFF",
      email: shopUser.email,
      phone: shopUser.phone!,
      monthlySalaryPaise: 3200000, // ₹32,000
    },
  });

  const coachUser = await prisma.user.create({
    data: {
      id: "user-coach-1",
      name: "Rohan Bopanna",
      email: "coach@championsclub.in",
      passwordHash: demoPasswordHash,
      role: "COACH",
      phone: "+91 98765 43215",
      isActive: true,
    },
  });
  const coachEmp = await prisma.employee.create({
    data: {
      id: "emp-008",
      employeeCode: "EMP-008",
      userId: coachUser.id,
      name: coachUser.name,
      role: "COACH",
      email: coachUser.email,
      phone: coachUser.phone!,
      monthlySalaryPaise: 5500000, // ₹55,000
    },
  });

  // 5. Members across Tiers
  const memberData = [
    {
      name: "Arjun Reddy",
      email: "arjun.gold@gmail.com",
      phone: "+91 98111 00001",
      tier: "GOLD",
      planId: goldPlan.id,
      status: "ACTIVE",
      dob: new Date("1992-05-14"),
      daysRemaining: 180,
    },
    {
      name: "Priya Nair",
      email: "priya.silver@gmail.com",
      phone: "+91 98111 00002",
      tier: "SILVER",
      planId: silverPlan.id,
      status: "ACTIVE",
      dob: new Date("1995-11-20"),
      daysRemaining: 90,
    },
    {
      name: "Rohan Kapoor (Junior)",
      email: "rohan.junior@gmail.com",
      phone: "+91 98111 00003",
      tier: "JUNIOR",
      planId: juniorPlan.id,
      status: "ACTIVE",
      dob: new Date("2009-08-10"), // 15 years old
      daysRemaining: 240,
    },
    {
      name: "Karan Johar",
      email: "karan.gold@gmail.com",
      phone: "+91 98111 00004",
      tier: "GOLD",
      planId: goldPlan.id,
      status: "EXPIRING_SOON",
      dob: new Date("1988-02-17"),
      daysRemaining: 5, // 5 days left
    },
    {
      name: "Kabir Mehta",
      email: "kabir.expiring@gmail.com",
      phone: "+91 98111 00099",
      tier: "GOLD",
      planId: goldPlan.id,
      status: "ACTIVE",
      dob: new Date("1991-07-22"),
      daysRemaining: 3, // 3 days left (Triggers Expiry Warning Banner)
    },
    {
      name: "Tara Sharma",
      email: "tara.expiring@gmail.com",
      phone: "+91 98111 00098",
      tier: "SILVER",
      planId: silverPlan.id,
      status: "ACTIVE",
      dob: new Date("1994-03-11"),
      daysRemaining: 1, // 1 day left (Urgent Expiry Alert)
    },
    {
      name: "Sneha Rao",
      email: "sneha.silver@gmail.com",
      phone: "+91 98111 00005",
      tier: "SILVER",
      planId: silverPlan.id,
      status: "EXPIRED",
      dob: new Date("1990-09-03"),
      daysRemaining: -12, // Expired 12 days ago
    },
    {
      name: "Aaditya Birla",
      email: "aaditya.b@gmail.com",
      phone: "+91 98111 00006",
      tier: "GOLD",
      planId: goldPlan.id,
      status: "ACTIVE",
      dob: new Date("1985-12-01"),
      daysRemaining: 300,
    },
    {
      name: "Zara Khan",
      email: "zara.k@gmail.com",
      phone: "+91 98111 00007",
      tier: "SILVER",
      planId: silverPlan.id,
      status: "ACTIVE",
      dob: new Date("1998-04-25"),
      daysRemaining: 120,
    },
    {
      name: "Aditi Joshi",
      email: "aditi.j@gmail.com",
      phone: "+91 98111 00008",
      tier: "JUNIOR",
      planId: juniorPlan.id,
      status: "ACTIVE",
      dob: new Date("2010-01-15"), // 14 years old
      daysRemaining: 150,
    },
  ];

  // Generate ~50 additional realistic members for rich demo
  const indianNames = [
    "Siddharth Rao", "Deepika Padukone", "Ranveer Singh", "Virat Kohli", "Anushka Sharma",
    "Manish Malhotra", "Kareena Kapoor", "Saif Ali", "Tara Sutaria", "Ishan Kishan",
    "Shubman Gill", "Hardik Pandya", "Smriti Mandhana", "Harmanpreet Kaur", "Neeraj Chopra",
    "PV Sindhu", "Saina Nehwal", "Sanio Mirza", "Leander Paes", "Mahesh Bhupathi",
    "Gaurav Kapur", "Harsha Bhogle", "Sunil Chhetri", "Bhaichung Bhutia", "Devendra Jhajharia",
    "Abhinav Bindra", "Mary Kom", "Mirabai Chanu", "Lovlina Borgohain", "Bajrang Punia",
    "Vinesh Phogat", "Ravi Dahiya", "Sakshi Malik", "Yogeshwar Dutt", "Sushil Kumar",
    "Dipa Karmakar", "Manika Batra", "Sharath Kamal", "Sathiyan Gnanasekaran", "Srikanth Kidambi",
    "Lakshya Sen", "HS Prannoy", "Satwiksairaj Rankireddy", "Chirag Shetty", "Ashwini Ponnappa",
    "Pullela Gopichand", "Prakash Padukone", "Aparna Popat", "Chetan Anand", "Jwala Gutta"
  ];

  for (let i = 0; i < indianNames.length; i++) {
    const tier = i % 3 === 0 ? "GOLD" : i % 3 === 1 ? "SILVER" : "JUNIOR";
    const planId = tier === "GOLD" ? goldPlan.id : tier === "SILVER" ? silverPlan.id : juniorPlan.id;
    const isJunior = tier === "JUNIOR";
    const birthYear = isJunior ? 2008 + (i % 6) : 1975 + (i % 25);
    const status = i === 34 ? "EXPIRING_SOON" : i === 37 ? "EXPIRED" : "ACTIVE";

    // Distribute join dates across time horizons
    let daysRemaining = 120;
    if (status === "EXPIRED") {
      daysRemaining = -5;
    } else if (status === "EXPIRING_SOON") {
      daysRemaining = 4;
    } else if (i < 2) {
      daysRemaining = 365; // Joined TODAY
    } else if (i < 6) {
      daysRemaining = 365 - (i * 2 - 1); // Joined in last 7 days (days -3, -5, -7)
    } else if (i < 18) {
      daysRemaining = 365 - (i * 2 + 3); // Joined in last 8-30 days
    } else if (i < 30) {
      daysRemaining = 365 - (i * 2 + 8); // Joined in previous 30 days (days -31 to -60)
    } else {
      daysRemaining = 45 + ((i % 20) * 8); // Joined earlier in the year
    }

    memberData.push({
      name: indianNames[i],
      email: `${indianNames[i].toLowerCase().replace(/\s+/g, ".")}${i}@example.com`,
      phone: `+91 98${String(100 + i).padStart(3, "0")} ${String(10000 + i).slice(-5)}`,
      tier,
      planId,
      status,
      dob: new Date(`${birthYear}-0${(i % 9) + 1}-15`),
      daysRemaining,
    });
  }

  const createdMembers = [];
  const now = new Date();

  for (let i = 0; i < memberData.length; i++) {
    const m = memberData[i];
    const memberCode = `CC-2024-${String(i + 1).padStart(3, "0")}`;

    // Create User record for member portal login
    const userRecord = await prisma.user.create({
      data: {
        id: `user-member-${i + 1}`,
        name: m.name,
        email: m.email,
        phone: m.phone,
        passwordHash: demoPasswordHash,
        role: "MEMBER",
        isActive: true,
      },
    });

    const member = await prisma.member.create({
      data: {
        id: `member-${i + 1}`,
        memberId: memberCode,
        userId: userRecord.id,
        name: m.name,
        email: m.email,
        phone: m.phone,
        dateOfBirth: m.dob,
        status: m.status,
        emergencyContactName: "Family Contact",
        emergencyContactPhone: "+91 98000 00000",
        address: "Bengaluru, Karnataka",
        qrCodeData: `MEMBER:${memberCode}:${m.name}:${m.tier}`,
      },
    });

    // Create Membership record
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - (365 - m.daysRemaining));
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + m.daysRemaining);

    const membershipAmount = m.tier === "GOLD" ? 5000000 : m.tier === "SILVER" ? 2500000 : 1500000;

    await prisma.membership.create({
      data: {
        memberId: member.id,
        planId: m.planId,
        tier: m.tier,
        startDate,
        endDate,
        status: m.status === "EXPIRED" ? "EXPIRED" : "ACTIVE",
        amountPaidPaise: membershipAmount,
        paymentMethod: "UPI",
      },
    });

    // Create Ledger Inflow Transaction for Membership
    await prisma.ledgerTransaction.create({
      data: {
        entryNumber: `TX-MEM-${String(i + 1).padStart(5, "0")}`,
        date: startDate,
        description: `Annual Membership Subscription (${m.tier} Tier) - ${m.name}`,
        module: "MEMBERSHIPS",
        creditPaise: membershipAmount,
        paymentMethod: "UPI",
        taxAmountPaise: Math.round(membershipAmount * 0.18),
        referenceType: "MEMBERSHIP",
      },
    });

    // Create GST Invoices for recent members
    if (i < 15) {
      const subtotal = Math.round(membershipAmount / 1.18);
      const tax = membershipAmount - subtotal;
      const cgst = Math.round(tax / 2);
      const sgst = tax - cgst;
      await prisma.invoice.create({
        data: {
          invoiceNumber: `INV-${now.getFullYear()}-${String(i + 1).padStart(4, "0")}`,
          memberId: member.id,
          clientName: m.name,
          clientAddress: "Bengaluru, Karnataka",
          issueDate: startDate,
          dueDate: new Date(startDate.getTime() + 15 * 24 * 60 * 60 * 1000),
          subtotalPaise: subtotal,
          taxAmountPaise: tax,
          cgstPaise: cgst,
          sgstPaise: sgst,
          totalPaise: membershipAmount,
          status: "PAID",
          lines: {
            create: [
              {
                description: `Annual ${m.tier} Membership Subscription Plan (CGST 9% + SGST 9%)`,
                quantity: 1,
                unitPricePaise: subtotal,
                taxRatePercent: 18,
                totalPaise: membershipAmount,
              },
            ],
          },
        },
      });
    }

    createdMembers.push(member);
  }

  // 6. Tables for Bar & Restaurant
  const tables = [];
  for (let i = 1; i <= 8; i++) {
    const t = await prisma.table.create({
      data: {
        tableNumber: i,
        name: i <= 4 ? `Lounge Table ${i}` : `Poolside ${i}`,
        capacity: 4,
        status: i === 1 ? "OCCUPIED" : i === 2 ? "OCCUPIED" : "FREE",
      },
    });
    tables.push(t);
  }

  // 7. Menu Items for Bar & Cafeteria
  const menuItemsData = [
    { name: "Signature Espresso", category: "HOT_BEVERAGES", pricePaise: 18000, costPaise: 4000 },
    { name: "Cold Brew Latte", category: "COLD_BEVERAGES", pricePaise: 24000, costPaise: 6000 },
    { name: "Fresh Whey Protein Shake", category: "HEALTH_SHAKES", pricePaise: 28000, costPaise: 9000 },
    { name: "Electrolyte Hydration Drink", category: "COLD_BEVERAGES", pricePaise: 15000, costPaise: 3000 },
    { name: "Avocado & Egg Sourdough Toast", category: "SNACKS", pricePaise: 35000, costPaise: 12000 },
    { name: "Grilled Chicken Protein Bowl", category: "MEALS", pricePaise: 42000, costPaise: 16000 },
    { name: "Mediterranean Hummus & Pita", category: "SNACKS", pricePaise: 29000, costPaise: 8000 },
    { name: "Artisanal Margherita Pizza", category: "MEALS", pricePaise: 48000, costPaise: 15000 },
    { name: "Peri Peri Fries", category: "SNACKS", pricePaise: 20000, costPaise: 5000 },
    { name: "Greek Salad with Feta", category: "MEALS", pricePaise: 34000, costPaise: 11000 },
    { name: "Dark Chocolate Brownie", category: "DESSERTS", pricePaise: 22000, costPaise: 6000 },
    { name: "Kingfisher Ultra Draught (Pint)", category: "COLD_BEVERAGES", pricePaise: 32000, costPaise: 14000 },
  ];

  const createdMenuItems = [];
  for (const item of menuItemsData) {
    const mi = await prisma.menuItem.create({
      data: {
        name: item.name,
        category: item.category,
        pricePaise: item.pricePaise,
        costPaise: item.costPaise,
        taxRatePercent: 5,
        isAvailable: true,
      },
    });
    createdMenuItems.push(mi);
  }

  // 8. Open Tabs & KDS Orders for Table 1 & Table 2
  const tab1 = await prisma.tab.create({
    data: {
      tabNumber: "TAB-2024-00101",
      tableId: tables[0].id,
      memberId: createdMembers[0].id, // Arjun Reddy (Gold, 20% discount)
      status: "OPEN",
      totalAmountPaise: 76000,
      discountAmountPaise: 15200, // 20%
      finalAmountPaise: 60800,
      openedByUserId: barUser.id,
    },
  });

  const order1 = await prisma.barOrder.create({
    data: {
      orderNumber: "BO-2024-00201",
      tabId: tab1.id,
      tableId: tables[0].id,
      status: "PREPARING",
      notes: "Less spicy for the protein bowl",
    },
  });

  await prisma.barOrderItem.createMany({
    data: [
      {
        barOrderId: order1.id,
        menuItemId: createdMenuItems[2].id, // Protein Shake
        quantity: 1,
        unitPricePaise: 28000,
        totalPricePaise: 28000,
      },
      {
        barOrderId: order1.id,
        menuItemId: createdMenuItems[5].id, // Grilled Chicken Bowl
        quantity: 1,
        unitPricePaise: 42000,
        totalPricePaise: 42000,
      },
    ],
  });

  // 9. Gear Shop Products & Variants
  const productsData = [
    {
      name: "Wilson Pro Staff 97 V14 Racket",
      category: "RACKETS",
      brand: "Wilson",
      sku: "WLS-PS97-V14",
      pricePaise: 2499900, // ₹24,999
      costPricePaise: 1600000,
      reorderLevel: 3,
      variants: [
        { sku: "WLS-PS97-G2", size: "Grip 2 (4 1/4)", stockQuantity: 6 },
        { sku: "WLS-PS97-G3", size: "Grip 3 (4 3/8)", stockQuantity: 2 }, // Low stock!
      ],
    },
    {
      name: "Babolat Pure Drive 2024",
      category: "RACKETS",
      brand: "Babolat",
      sku: "BAB-PD-2024",
      pricePaise: 2199900, // ₹21,999
      costPricePaise: 1400000,
      reorderLevel: 4,
      variants: [
        { sku: "BAB-PD-G2", size: "Grip 2", stockQuantity: 8 },
        { sku: "BAB-PD-G3", size: "Grip 3", stockQuantity: 1 }, // Low stock!
      ],
    },
    {
      name: "Head Bela Pro Padel Racket",
      category: "RACKETS",
      brand: "Head",
      sku: "HED-BELA-PRO",
      pricePaise: 2850000, // ₹28,500
      costPricePaise: 1800000,
      reorderLevel: 2,
      variants: [
        { sku: "HED-BELA-STD", size: "370g", stockQuantity: 5 },
      ],
    },
    {
      name: "Yonex Astrox 99 Pro Badminton Racket",
      category: "RACKETS",
      brand: "Yonex",
      sku: "YNX-AX99-PRO",
      pricePaise: 1850000, // ₹18,500
      costPricePaise: 1200000,
      reorderLevel: 3,
      variants: [
        { sku: "YNX-AX99-4U", size: "4U G5", stockQuantity: 10 },
      ],
    },
    {
      name: "Wilson US Open Tennis Balls (Can of 3)",
      category: "BALLS",
      brand: "Wilson",
      sku: "WLS-USO-CAN3",
      pricePaise: 65000, // ₹650
      costPricePaise: 38000,
      reorderLevel: 20,
      variants: [
        { sku: "WLS-USO-3B", size: "Can of 3", stockQuantity: 45 },
      ],
    },
    {
      name: "Nike Court Air Zoom Vapor Pro 2 Shoes",
      category: "SHOES",
      brand: "Nike",
      sku: "NKE-VAPOR-PRO2",
      pricePaise: 1299500, // ₹12,995
      costPricePaise: 800000,
      reorderLevel: 2,
      variants: [
        { sku: "NKE-VP2-UK8", size: "UK 8", stockQuantity: 4 },
        { sku: "NKE-VP2-UK9", size: "UK 9", stockQuantity: 5 },
        { sku: "NKE-VP2-UK10", size: "UK 10", stockQuantity: 1 }, // Low stock!
      ],
    },
    {
      name: "Champions Club Performance Dri-FIT Polo",
      category: "APPAREL",
      brand: "Champions Club",
      sku: "CC-POLO-NAVY",
      pricePaise: 189900, // ₹1,899
      costPricePaise: 75000,
      reorderLevel: 10,
      variants: [
        { sku: "CC-POLO-M", size: "M", color: "Navy", stockQuantity: 25 },
        { sku: "CC-POLO-L", size: "L", color: "Navy", stockQuantity: 18 },
        { sku: "CC-POLO-XL", size: "XL", color: "Navy", stockQuantity: 8 },
      ],
    },
  ];

  const createdProducts = [];
  const createdVariants: any[] = [];

  for (const prod of productsData) {
    const p = await prisma.product.create({
      data: {
        name: prod.name,
        category: prod.category,
        brand: prod.brand,
        sku: prod.sku,
        pricePaise: prod.pricePaise,
        costPricePaise: prod.costPricePaise,
        reorderLevel: prod.reorderLevel,
      },
    });
    createdProducts.push(p);

    for (const v of prod.variants) {
      const pv = await prisma.productVariant.create({
        data: {
          productId: p.id,
          sku: v.sku,
          size: v.size,
          color: (v as any).color || null,
          stockQuantity: v.stockQuantity,
        },
      });
      createdVariants.push({ ...pv, product: p });
    }
  }

  // 10. Service Jobs (Racket Stringing)
  await prisma.serviceJob.create({
    data: {
      ticketNumber: "ST-2024-00042",
      memberId: createdMembers[0].id,
      customerName: "Arjun Reddy",
      customerPhone: "+91 98111 00001",
      racketDetails: "Wilson Pro Staff 97",
      stringType: "Luxilon ALU Power 125",
      tension: "54 lbs",
      isExpress: true,
      status: "IN_PROGRESS",
      costPaise: 120000,
      eta: new Date(Date.now() + 2 * 60 * 60 * 1000), // In 2 hours
    },
  });

  // 11. Historical & Today Bookings (300+ entries)
  let bookingSeq = 1;
  const bookingsToCreate = [];
  const ledgerEntriesToCreate = [];

  for (let dayOffset = -45; dayOffset <= 5; dayOffset++) {
    const day = new Date(now);
    day.setDate(day.getDate() + dayOffset);
    day.setMinutes(0, 0, 0);

    // Pick 4-6 slots per day across courts
    for (let h = 7; h <= 21; h += 3) {
      for (let cIdx = 0; cIdx < allCourts.length; cIdx++) {
        if ((dayOffset + h + cIdx) % 3 === 0) {
          const startTime = new Date(day);
          startTime.setHours(h, 0, 0, 0);
          const endTime = new Date(day);
          endTime.setHours(h + 1, 0, 0, 0);

          const memberIndex = (dayOffset + h + cIdx + 50) % createdMembers.length;
          const member = createdMembers[memberIndex];
          const memberTier = memberData[memberIndex]?.tier || "GOLD";
          const isPeak = h >= 18 && h <= 21;
          const price = memberTier === "GOLD" ? 0 : isPeak ? 60000 : 40000;
          const bNumber = `BK-${now.getFullYear()}-${String(bookingSeq++).padStart(5, "0")}`;

          const isPast = dayOffset < 0;
          const status = isPast ? "COMPLETED" : "CONFIRMED";

          bookingsToCreate.push({
            bookingNumber: bNumber,
            courtId: allCourts[cIdx].id,
            memberId: member.id,
            bookerName: member.name,
            bookerPhone: member.phone,
            bookerEmail: member.email,
            bookerType: memberTier,
            startTime,
            endTime,
            durationMinutes: 60,
            status,
            source: "MEMBER_PORTAL",
            totalPricePaise: price,
            isPeak,
            paymentStatus: price === 0 ? "PAID" : "PAID",
            paymentMethod: price === 0 ? "FREE_TIER" : "UPI",
            createdAt: new Date(startTime.getTime() - 2 * 24 * 60 * 60 * 1000),
          });

          if (price > 0) {
            ledgerEntriesToCreate.push({
              entryNumber: `TX-${now.getFullYear()}-${String(bookingSeq).padStart(6, "0")}`,
              date: startTime,
              description: `Court Booking - ${allCourts[cIdx].name} - ${member.name} (${bNumber})`,
              module: "COURTS",
              creditPaise: price,
              paymentMethod: "UPI",
              taxAmountPaise: Math.round(price * 0.18),
              referenceType: "BOOKING",
            });
          }
        }
      }
    }
  }

  for (const b of bookingsToCreate) {
    await prisma.booking.create({ data: b });
  }

  for (const tx of ledgerEntriesToCreate) {
    await prisma.ledgerTransaction.create({ data: tx });
  }

  // 11.b Historical Pro Shop Sales across the last 45 days
  let shopOrderSeq = 1;
  for (let d = -45; d <= 0; d++) {
    const orderDate = new Date(now);
    orderDate.setDate(orderDate.getDate() + d);
    orderDate.setHours(11 + (Math.abs(d) % 8), 15 + (Math.abs(d * 7) % 40), 0, 0);

    const mIdx = (Math.abs(d) + 3) % createdMembers.length;
    const member = createdMembers[mIdx];
    const isMember = d % 4 !== 0;

    const variant = createdVariants[Math.abs(d) % createdVariants.length];
    const price = variant.product.pricePaise;
    const discount = isMember ? Math.round(price * 0.1) : 0;
    const finalPrice = price - discount;

    const shopOrderNumber = `SO-${now.getFullYear()}-${String(shopOrderSeq++).padStart(5, "0")}`;
    const so = await prisma.shopOrder.create({
      data: {
        orderNumber: shopOrderNumber,
        memberId: isMember ? member.id : null,
        customerName: isMember ? member.name : "Walk-in Customer",
        customerPhone: isMember ? member.phone : "+91 99999 00000",
        customerEmail: isMember ? member.email : "guest@championsclub.in",
        fulfillmentType: "CLICK_AND_COLLECT",
        status: "COMPLETED",
        totalPricePaise: price,
        discountPaise: discount,
        finalPricePaise: finalPrice,
        paymentMethod: "UPI",
        paymentStatus: "PAID",
        createdAt: orderDate,
      },
    });

    await prisma.orderItem.create({
      data: {
        shopOrderId: so.id,
        variantId: variant.id,
        quantity: 1,
        unitPricePaise: price,
        totalPricePaise: price,
      },
    });

    await prisma.ledgerTransaction.create({
      data: {
        entryNumber: `TX-SHOP-${String(shopOrderSeq).padStart(5, "0")}`,
        date: orderDate,
        description: `Pro Shop Sale - ${variant.product.name} (${shopOrderNumber})`,
        module: "SHOP",
        creditPaise: finalPrice,
        paymentMethod: "UPI",
        taxAmountPaise: Math.round(finalPrice * 0.18),
        referenceType: "SHOP_ORDER",
        referenceId: so.id,
      },
    });
  }

  // 11.c Historical Bar & Cafe Orders across the last 45 days
  let barOrderSeq = 1;
  for (let d = -45; d <= 0; d++) {
    const orderDate = new Date(now);
    orderDate.setDate(orderDate.getDate() + d);

    // 2 orders per day
    for (let o = 1; o <= 2; o++) {
      orderDate.setHours(9 + o * 5 + (Math.abs(d) % 3), (o * 23) % 60, 0, 0);
      const mIdx = (Math.abs(d * 3 + o)) % createdMembers.length;
      const member = createdMembers[mIdx];
      const isMember = (d + o) % 3 !== 0;

      const mi1 = createdMenuItems[(Math.abs(d * 2 + o)) % createdMenuItems.length];
      const mi2 = createdMenuItems[(Math.abs(d * 3 + o + 1)) % createdMenuItems.length];
      const subtotal = mi1.pricePaise + mi2.pricePaise;
      const discount = isMember ? Math.round(subtotal * 0.15) : 0;
      const finalPrice = subtotal - discount;

      const barOrderNumber = `BO-${now.getFullYear()}-${String(barOrderSeq++).padStart(5, "0")}`;
      const bo = await prisma.barOrder.create({
        data: {
          orderNumber: barOrderNumber,
          tableId: tables[(Math.abs(d + o)) % tables.length].id,
          status: "SERVED",
          notes: "Dining order completed",
          createdAt: orderDate,
        },
      });

      await prisma.barOrderItem.createMany({
        data: [
          {
            barOrderId: bo.id,
            menuItemId: mi1.id,
            quantity: 1,
            unitPricePaise: mi1.pricePaise,
            totalPricePaise: mi1.pricePaise,
          },
          {
            barOrderId: bo.id,
            menuItemId: mi2.id,
            quantity: 1,
            unitPricePaise: mi2.pricePaise,
            totalPricePaise: mi2.pricePaise,
          },
        ],
      });

      await prisma.ledgerTransaction.create({
        data: {
          entryNumber: `TX-BAR-${String(barOrderSeq).padStart(5, "0")}`,
          date: orderDate,
          description: `Club Dining & Lounge - ${mi1.name} & ${mi2.name} (${barOrderNumber})`,
          module: "BAR",
          creditPaise: finalPrice,
          paymentMethod: "UPI",
          taxAmountPaise: Math.round(finalPrice * 0.05),
          referenceType: "TAB",
          referenceId: bo.id,
        },
      });
    }
  }

  // 12. CRM Leads & Pipeline
  const leadsData = [
    {
      leadNumber: "LD-2024-00101",
      name: "Rajesh Mittal",
      phone: "+91 98222 11101",
      email: "rajesh.mittal@infosys.com",
      source: "WEBSITE",
      sportInterest: "Padel",
      status: "NEW",
      notes: "Looking for corporate team weekend packages for 20 players.",
      createdAt: new Date(Date.now() - 30 * 60 * 60 * 1000), // > 24 hours old -> SLA Alert!
    },
    {
      leadNumber: "LD-2024-00102",
      name: "Dr. Shalini Swamy",
      phone: "+91 98222 11102",
      email: "dr.swamy@apollo.com",
      source: "WALK_IN",
      sportInterest: "Tennis",
      status: "CONTACTED",
      notes: "Enquired about Gold annual membership and private coaching.",
    },
    {
      leadNumber: "LD-2024-00103",
      name: "Kiran Mazumdar",
      phone: "+91 98222 11103",
      email: "kiran@biocon.com",
      source: "WEBSITE",
      sportInterest: "Badminton",
      status: "QUOTE_SENT",
      notes: "Sent annual corporate membership quote for 5 executives.",
    },
    {
      leadNumber: "LD-2024-00104",
      name: "Sameer Nigam",
      phone: "+91 98222 11104",
      email: "sameer@phonepe.com",
      source: "REFERRAL",
      sportInterest: "Padel",
      status: "TRIAL_BOOKED",
      notes: "Trial booked for Friday evening 6:30 PM on Padel Court 1.",
    },
    {
      leadNumber: "LD-2024-00105",
      name: "Nikhil Kamath",
      phone: "+91 98222 11105",
      email: "nikhil@zerodha.com",
      source: "SOCIAL",
      sportInterest: "Tennis",
      status: "CONVERTED",
      notes: "Converted to Gold Annual Membership.",
    },
  ];

  for (const l of leadsData) {
    const lead = await prisma.lead.create({ data: l });
    await prisma.leadActivity.create({
      data: {
        leadId: lead.id,
        type: "NOTE",
        summary: "Lead created from " + l.source,
        details: l.notes,
        performedByUserId: managerUser.id,
      },
    });
  }

  // 13. Expenses & Vendors
  const vendor1 = await prisma.vendor.create({
    data: {
      name: "Karnataka Power Transmission Corp",
      category: "UTILITIES",
      phone: "080 2222 0000",
      gstin: "29KPTCL0000A1Z1",
    },
  });
  const vendor2 = await prisma.vendor.create({
    data: {
      name: "Wilson Sporting Goods India Ltd",
      category: "SPORTING_GOODS",
      contactPerson: "Mahesh",
      phone: "+91 98333 44444",
      gstin: "29WILSN0000A1Z2",
    },
  });
  const vendor3 = await prisma.vendor.create({
    data: {
      name: "Supreme Sports Infrastructure & Turf Care",
      category: "MAINTENANCE",
      contactPerson: "Ramesh",
      phone: "+91 98444 55555",
      gstin: "29SUPRM0000A1Z3",
    },
  });
  const vendor4 = await prisma.vendor.create({
    data: {
      name: "Fresh Farms & Organic Dairy Co",
      category: "FOOD_BEVERAGE",
      contactPerson: "Suresh",
      phone: "+91 98555 66666",
      gstin: "29FRESH0000A1Z4",
    },
  });
  const vendor5 = await prisma.vendor.create({
    data: {
      name: "CleanWave Laundry & Hospitality Services",
      category: "MAINTENANCE",
      contactPerson: "Kavita",
      phone: "+91 98666 77777",
      gstin: "29CLEAN0000A1Z5",
    },
  });

  const expensesData = [
    {
      expenseNumber: "EXP-2024-00088",
      vendorId: vendor1.id,
      category: "UTILITIES",
      description: "Monthly Floodlights & Clubhouse Electricity Bill",
      amountPaise: 18500000, // ₹1,85,000
      taxPaise: 3330000,
      status: "PAID",
      paymentMethod: "BANK_TRANSFER",
      paymentDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // 20 days ago (30d)
    },
    {
      expenseNumber: "EXP-2024-00089",
      vendorId: vendor2.id,
      category: "EQUIPMENT",
      description: "Restock: 50x Wilson US Open Balls & Grips",
      amountPaise: 9500000, // ₹95,000
      taxPaise: 1710000,
      status: "PAID",
      paymentMethod: "BANK_TRANSFER",
      paymentDate: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000), // 12 days ago (30d)
    },
    {
      expenseNumber: "EXP-2024-00090",
      vendorId: vendor3.id,
      category: "MAINTENANCE",
      description: "Championship Clay Court Dressing & Net Maintenance",
      amountPaise: 4500000, // ₹45,000
      taxPaise: 810000,
      status: "PAID",
      paymentMethod: "BANK_TRANSFER",
      paymentDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago (7d, 30d)
    },
    {
      expenseNumber: "EXP-2024-00091",
      vendorId: vendor4.id,
      category: "FOOD_BEVERAGE",
      description: "Weekly Cafe Organic Protein, Milk & Produce Restock",
      amountPaise: 1800000, // ₹18,000
      taxPaise: 90000,
      status: "PAID",
      paymentMethod: "BANK_TRANSFER",
      paymentDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago (7d, 30d)
    },
    {
      expenseNumber: "EXP-2024-00092",
      vendorId: vendor5.id,
      category: "MAINTENANCE",
      description: "Daily Towel Laundry & Housekeeping Supplies",
      amountPaise: 250000, // ₹2,500
      taxPaise: 45000,
      status: "PAID",
      paymentMethod: "UPI",
      paymentDate: new Date(), // Today (today, 7d, 30d)
    },
  ];

  for (const exp of expensesData) {
    const createdExp = await prisma.expense.create({ data: exp });
    await prisma.ledgerTransaction.create({
      data: {
        entryNumber: `TX-${exp.expenseNumber}`,
        date: exp.paymentDate,
        description: `Operational Expense - ${exp.description} (${exp.expenseNumber})`,
        module: "EXPENSES",
        debitPaise: exp.amountPaise,
        paymentMethod: exp.paymentMethod,
        taxAmountPaise: exp.taxPaise,
        referenceType: "EXPENSE",
        referenceId: createdExp.id,
      },
    });
  }

  // 14. Recurring Social Play Session (Friday Night Padel Social)
  const nextFriday = new Date();
  nextFriday.setDate(nextFriday.getDate() + ((5 + 7 - nextFriday.getDay()) % 7));
  nextFriday.setHours(19, 0, 0, 0);

  const endFriday = new Date(nextFriday);
  endFriday.setHours(21, 0, 0, 0);

  const social = await prisma.socialSession.create({
    data: {
      courtId: court3.id,
      name: "Friday Night Padel Social & Mix-In",
      dayOfWeek: 5,
      startTime: nextFriday,
      endTime: endFriday,
      capacity: 12,
      pricePerPersonPaise: 35000, // ₹350 per person
      description: "King of the court format, music, complimentary drinks, all skill levels welcome.",
    },
  });

  await prisma.socialParticipant.createMany({
    data: [
      {
        socialSessionId: social.id,
        memberId: createdMembers[0].id,
        guestName: "Arjun Reddy",
        guestPhone: "+91 98111 00001",
        status: "CONFIRMED",
        paidPaise: 35000,
      },
      {
        socialSessionId: social.id,
        memberId: createdMembers[1].id,
        guestName: "Priya Nair",
        guestPhone: "+91 98111 00002",
        status: "CONFIRMED",
        paidPaise: 35000,
      },
    ],
  });

  console.log("✅ Seed finished successfully!");
  console.log(`- 6 Courts across 4 sports`);
  console.log(`- ${createdMembers.length} Members seeded across Gold, Silver, Junior, Expired tiers`);
  console.log(`- ${bookingsToCreate.length} Bookings created`);
  console.log(`- Gear Shop catalog, Bar POS Menu, Tables, Tabs, Leads & Expenses loaded!`);
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
