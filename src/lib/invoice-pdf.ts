import { jsPDF } from "jspdf";

export interface InvoicePdfData {
  invoiceNumber: string;
  orderNumber: string;
  date: string | Date;
  customerName: string;
  customerPhone?: string | null;
  customerEmail?: string | null;
  memberTier: string;
  membershipPlanName?: string | null;
  discountPercent: number;
  fulfillmentType: string;
  deliveryAddress?: string | null;
  paymentMethod: string;
  apiKeyRef?: string | null;
  module?: "SHOP" | "CAFE" | "BAR" | "COURT";
  items: Array<{
    productName: string;
    variantName?: string;
    sku?: string;
    quantity: number;
    fullUnitPricePaise: number;
    fullTotalPricePaise: number;
    discountPercent: number;
    discountAmountPaise: number;
    netPricePaise: number;
  }>;
  totalFullPricePaise: number;
  totalDiscountPaise: number;
  netSubtotalPaise: number;
  securityDepositPaise: number;
  finalPayablePaise: number;
}

function formatPaiseToINR(paise: number): string {
  const inr = (paise / 100).toFixed(2);
  const parts = inr.split(".");
  const intPart = parts[0];
  const decPart = parts[1];
  // Indian numbering format regex
  const lastThree = intPart.substring(intPart.length - 3);
  const otherNumbers = intPart.substring(0, intPart.length - 3);
  const formattedInt = otherNumbers !== "" ? otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + lastThree : lastThree;
  return `INR ${formattedInt}.${decPart}`;
}

/**
 * Builds a professional high-resolution PDF tax invoice matching NYAC luxury aesthetics
 */
export function buildInvoicePdf(data: InvoicePdfData): jsPDF {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2; // 182mm

  // Determine module & specific titles
  const isCafe = data.module === "CAFE" || data.invoiceNumber.includes("CAFE");
  const isBar = data.module === "BAR" || data.invoiceNumber.includes("BAR");
  const isCourt = data.module === "COURT" || data.invoiceNumber.includes("COURT");

  const divisionSubtitle = isCourt
    ? "Official Athletic Courts & Racquet Sports Division"
    : isCafe
    ? "Official Clubhouse Cafe & Dining Services"
    : isBar
    ? "Official Clubhouse Bar & Social Quarters"
    : "Official Pro Shop & Athletic Equipment Division";

  const itemColumnTitle = isCourt
    ? "COURT RESERVATION & ACCESS"
    : isCafe
    ? "CAFE & DINING ITEM"
    : isBar
    ? "BAR & BEVERAGE ITEM"
    : "EQUIPMENT DESCRIPTION";

  const subtotalLabel = isCourt
    ? "Full Court Tariff Subtotal:"
    : isCafe
    ? "Full Food & Beverage Subtotal:"
    : isBar
    ? "Full Bar & Refreshments Subtotal:"
    : "Full Equipment Subtotal:";

  const netLabel = isCourt
    ? "Net Court Tariff:"
    : isCafe
    ? "Net Dining Amount:"
    : isBar
    ? "Net Bar Amount:"
    : "Net Equipment Amount:";

  // Palette
  const navy = [11, 19, 32] as const; // #0B1320
  const crimson = [146, 17, 17] as const; // #921111
  const gold = [197, 160, 89] as const; // #C5A059
  const darkGray = [30, 41, 59] as const;
  const mutedGray = [100, 116, 139] as const;
  const bgLight = [250, 248, 245] as const;

  // 1. TOP HEADER BAR
  doc.setFillColor(...crimson);
  doc.rect(0, 0, pageWidth, 6, "F");

  // Gold accent pinstripe
  doc.setFillColor(...gold);
  doc.rect(0, 6, pageWidth, 1.2, "F");

  let y = 16;

  // Club Crest & Name
  doc.setTextColor(...navy);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("THE CHAMPIONS CLUB", margin, y);

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...gold);
  doc.text("ESTABLISHED 1892  •  NEW YORK ATHLETIC CLUB HERITAGE", margin, y + 4.5);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(...mutedGray);
  doc.setFontSize(7.5);
  doc.text(divisionSubtitle, margin, y + 8.5);
  doc.text("Championship Enclave, Sector 42, New Delhi 110001 | GSTIN: 07AAAAA0000A1Z5", margin, y + 12);

  // Right-aligned TAX INVOICE header
  doc.setTextColor(...crimson);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("TAX INVOICE & RECEIPT", pageWidth - margin, y, { align: "right" });

  doc.setTextColor(...navy);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text(`INVOICE #: ${data.invoiceNumber}`, pageWidth - margin, y + 5, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setTextColor(...mutedGray);
  doc.setFontSize(8);
  const formattedDate = data.date instanceof Date ? data.date.toLocaleString("en-IN") : String(data.date);
  doc.text(`Date & Time: ${formattedDate}`, pageWidth - margin, y + 9.5, { align: "right" });
  doc.text(`Order Ref: ${data.orderNumber}`, pageWidth - margin, y + 13.5, { align: "right" });

  // Divider line
  y = 35;
  doc.setDrawColor(...gold);
  doc.setLineWidth(0.4);
  doc.line(margin, y, pageWidth - margin, y);

  // 2. BILLED TO & PAYMENT AUDIT BOXES
  y = 40;
  const boxWidth = (contentWidth - 6) / 2;

  // Left Box: Billed To
  doc.setFillColor(...bgLight);
  doc.roundedRect(margin, y, boxWidth, 34, 2, 2, "F");
  doc.setDrawColor(229, 223, 213);
  doc.setLineWidth(0.2);
  doc.roundedRect(margin, y, boxWidth, 34, 2, 2, "D");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...gold);
  doc.text("BILLED TO / MEMBER DETAILS", margin + 4, y + 5.5);

  doc.setTextColor(...navy);
  doc.setFontSize(10.5);
  doc.text(data.customerName, margin + 4, y + 11.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...darkGray);
  if (data.customerPhone) doc.text(`Phone: ${data.customerPhone}`, margin + 4, y + 16.5);
  if (data.customerEmail) doc.text(`Email: ${data.customerEmail}`, margin + 4, y + 21);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...crimson);
  doc.text(
    `Membership: ${data.memberTier} TIER (${data.discountPercent}% Privilege Allowance)`,
    margin + 4,
    y + 26
  );

  // Right Box: Payment & Authorization
  const rightX = margin + boxWidth + 6;
  doc.setFillColor(...bgLight);
  doc.roundedRect(rightX, y, boxWidth, 34, 2, 2, "F");
  doc.setDrawColor(229, 223, 213);
  doc.setLineWidth(0.2);
  doc.roundedRect(rightX, y, boxWidth, 34, 2, 2, "D");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...gold);
  doc.text("SETTLEMENT & GATEWAY AUTHORIZATION", rightX + 4, y + 5.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...darkGray);
  doc.text(`Fulfillment: ${data.fulfillmentType}`, rightX + 4, y + 11.5);
  doc.text(`Settlement Method: ${data.paymentMethod} (PAID IN FULL)`, rightX + 4, y + 16.5);

  doc.text(`Transaction Status: VERIFIED & SETTLED`, rightX + 4, y + 21.5);
  doc.text(`Gateway Channel: Club Treasury Digital Clearance`, rightX + 4, y + 26);

  // 3. ITEMIZED TABLE
  y = 80;

  // Table Header
  doc.setFillColor(...navy);
  doc.rect(margin, y, contentWidth, 7, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);

  const colX = {
    idx: margin + 2,
    desc: margin + 8,
    qty: margin + 76,
    fullUnit: margin + 104,
    fullTotal: margin + 130,
    discount: margin + 154,
    net: margin + 180,
  };

  doc.text("#", colX.idx, y + 4.8);
  doc.text(itemColumnTitle, colX.desc, y + 4.8);
  doc.text("QTY", colX.qty, y + 4.8, { align: "center" });
  doc.text("FULL UNIT", colX.fullUnit, y + 4.8, { align: "right" });
  doc.text("FULL TOTAL", colX.fullTotal, y + 4.8, { align: "right" });
  doc.text("DISCOUNT", colX.discount, y + 4.8, { align: "right" });
  doc.text("NET PRICE", colX.net, y + 4.8, { align: "right" });

  y += 7;

  // Table Body Rows
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);

  data.items.forEach((item, index) => {
    const isEven = index % 2 === 0;
    if (isEven) {
      doc.setFillColor(252, 251, 249);
      doc.rect(margin, y, contentWidth, 8, "F");
    }

    doc.setDrawColor(235, 230, 220);
    doc.setLineWidth(0.1);
    doc.line(margin, y + 8, margin + contentWidth, y + 8);

    doc.setTextColor(...darkGray);
    doc.text(String(index + 1), colX.idx, y + 5.2);

    // Title & SKU
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...navy);
    const titleText = `${item.productName}${item.variantName ? ` (${item.variantName})` : ""}`;
    const truncatedTitle = titleText.length > 34 ? titleText.substring(0, 32) + "..." : titleText;
    doc.text(truncatedTitle, colX.desc, y + 5.2);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(...darkGray);
    doc.text(String(item.quantity), colX.qty, y + 5.2, { align: "center" });
    doc.text(formatPaiseToINR(item.fullUnitPricePaise), colX.fullUnit, y + 5.2, { align: "right" });
    doc.text(formatPaiseToINR(item.fullTotalPricePaise), colX.fullTotal, y + 5.2, { align: "right" });

    doc.setTextColor(...crimson);
    doc.text(
      item.discountAmountPaise > 0 ? `-${formatPaiseToINR(item.discountAmountPaise)}` : "0.00",
      colX.discount,
      y + 5.2,
      { align: "right" }
    );

    doc.setTextColor(...navy);
    doc.setFont("helvetica", "bold");
    doc.text(formatPaiseToINR(item.netPricePaise), colX.net, y + 5.2, { align: "right" });

    y += 8;
  });

  // 4. BILLING SUMMARY & MANDATORY SECURITY DEPOSIT BOX
  y += 5;
  const summaryBoxWidth = 88;
  const summaryX = pageWidth - margin - summaryBoxWidth;

  doc.setFillColor(...bgLight);
  doc.roundedRect(summaryX, y, summaryBoxWidth, 48, 2, 2, "F");
  doc.setDrawColor(229, 223, 213);
  doc.setLineWidth(0.2);
  doc.roundedRect(summaryX, y, summaryBoxWidth, 48, 2, 2, "D");

  let sy = y + 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...mutedGray);
  doc.text(subtotalLabel, summaryX + 4, sy);
  doc.setTextColor(...navy);
  doc.setFont("helvetica", "bold");
  doc.text(formatPaiseToINR(data.totalFullPricePaise), summaryX + summaryBoxWidth - 4, sy, { align: "right" });

  sy += 6;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...crimson);
  doc.text(`Tier Privilege Allowance (${data.discountPercent}%):`, summaryX + 4, sy);
  doc.setFont("helvetica", "bold");
  doc.text(`-${formatPaiseToINR(data.totalDiscountPaise)}`, summaryX + summaryBoxWidth - 4, sy, { align: "right" });

  sy += 6;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...darkGray);
  doc.text(netLabel, summaryX + 4, sy);
  doc.setFont("helvetica", "bold");
  doc.text(formatPaiseToINR(data.netSubtotalPaise), summaryX + summaryBoxWidth - 4, sy, { align: "right" });

  if (data.securityDepositPaise > 0) {
    // Security deposit highlight bar (Applicable for Gold member court reservations)
    sy += 5;
    doc.setFillColor(250, 247, 238);
    doc.roundedRect(summaryX + 2, sy - 3.5, summaryBoxWidth - 4, 8, 1, 1, "F");
    doc.setDrawColor(...gold);
    doc.setLineWidth(0.3);
    doc.roundedRect(summaryX + 2, sy - 3.5, summaryBoxWidth - 4, 8, 1, 1, "D");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...gold);
    doc.text("SECURITY DEPOSIT (Refundable):", summaryX + 4, sy + 1.5);
    doc.setTextColor(...navy);
    doc.text(`+${formatPaiseToINR(data.securityDepositPaise)}`, summaryX + summaryBoxWidth - 4, sy + 1.5, { align: "right" });
    sy += 11;
  } else {
    sy += 6;
  }

  // Final Total Banner
  doc.setFillColor(...crimson);
  doc.roundedRect(summaryX + 2, sy - 3.5, summaryBoxWidth - 4, 9, 1, 1, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("FINAL PAYABLE TOTAL:", summaryX + 4, sy + 2.5);
  doc.setFontSize(10.5);
  doc.text(formatPaiseToINR(data.finalPayablePaise), summaryX + summaryBoxWidth - 4, sy + 2.5, { align: "right" });

  // Left terms / seal
  const termsWidth = contentWidth - summaryBoxWidth - 8;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...gold);
  const termsTitle = data.securityDepositPaise > 0
    ? "TERMS, PRIVILEGES & SECURITY DEPOSIT POLICY"
    : "TERMS, PRIVILEGES & CLUB REGULATIONS";
  doc.text(termsTitle, margin, y + 5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...mutedGray);
  doc.text(
    "1. Membership discount privilege applies directly per club bylaws based on verified active tier.",
    margin,
    y + 10,
    { maxWidth: termsWidth }
  );

  const securityDepositTerm = data.securityDepositPaise > 0
    ? (isCourt
        ? "2. Refundable Security Deposit of INR 100 is credited per court reservation as facility guarantee and is fully refundable after slot completion."
        : "2. Refundable Security Deposit of INR 100 is credited to the escrow ledger and is fully refundable.")
    : "2. Official computerized receipt governed by The Champions Club Athletic Regulations and facility codes.";

  doc.text(
    securityDepositTerm,
    margin,
    y + 16,
    { maxWidth: termsWidth }
  );
  doc.text(
    "3. Official computerized tax receipt valid for accounting, audit, and tax reimbursement purposes.",
    margin,
    y + 24,
    { maxWidth: termsWidth }
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...darkGray);
  doc.text("Official Digital Audit Trail • Electronic Verification Active", margin, y + 31);

  // Official Seal Stamp Box
  doc.setDrawColor(...gold);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, y + 33, 48, 14, 1, 1, "D");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(...crimson);
  doc.text("THE CHAMPIONS CLUB", margin + 24, y + 37, { align: "center" });
  doc.setTextColor(...navy);
  doc.setFontSize(6);
  doc.text("AUDITED & AUTHORIZED", margin + 24, y + 41, { align: "center" });
  doc.setTextColor(...gold);
  doc.text("TREASURY DIVISION", margin + 24, y + 45, { align: "center" });

  // 5. FOOTER
  const footerY = pageHeight - 12;
  doc.setDrawColor(229, 223, 213);
  doc.setLineWidth(0.3);
  doc.line(margin, footerY, pageWidth - margin, footerY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...mutedGray);
  doc.text(
    "The Champions Club Limited • Registered in New Delhi • www.thechampionsclub.in • support@thechampionsclub.in",
    pageWidth / 2,
    footerY + 4,
    { align: "center" }
  );
  doc.text(
    `Official Tax Invoice Document #${data.invoiceNumber} | Page 1 of 1`,
    pageWidth / 2,
    footerY + 7.5,
    { align: "center" }
  );

  return doc;
}
