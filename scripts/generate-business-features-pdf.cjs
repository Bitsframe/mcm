const path = require('path');
const { jsPDF } = require('jspdf');
require('jspdf-autotable');

const outPath = path.join(__dirname, '..', 'BUSINESS_FEATURES_ONE_PAGE.pdf');

/** jsPDF Helvetica is Latin-1 only — strip/replace Unicode that renders as garbage */
function toPdfText(text) {
  return String(text)
    .replace(/\u2192/g, ' -> ')       // →
    .replace(/\u2014/g, ' - ')       // —
    .replace(/\u2013/g, ' - ')       // –
    .replace(/\u00b7/g, ' | ')       // ·
    .replace(/\u2022/g, '-')         // •
    .replace(/\u00ed/g, 'i')         // í
    .replace(/\u00e1/g, 'a')         // á
    .replace(/\u00e9/g, 'e')         // é
    .replace(/\u00f3/g, 'o')         // ó
    .replace(/\u00fa/g, 'u')         // ú
    .replace(/\u00f1/g, 'n')         // ñ
    .replace(/[^\x00-\xFF]/g, '');   // drop anything else non-Latin-1
}

const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
const pageW = doc.internal.pageSize.getWidth();
const pageH = doc.internal.pageSize.getHeight();
const margin = 14;
const gutter = 6;
const colW = (pageW - margin * 2 - gutter) / 2;
let y = margin;

const brand = { r: 0, g: 102, b: 255 };
const muted = { r: 60, g: 60, b: 60 };
const BULLET_INDENT = 3.5;
const LINE_H = 3.2;

function setFont(size, style = 'normal') {
  doc.setFont('helvetica', style);
  doc.setFontSize(size);
}

function drawHeader() {
  // Brand bar
  doc.setFillColor(brand.r, brand.g, brand.b);
  doc.rect(0, 0, pageW, 22, 'F');

  setFont(15, 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(toPdfText('MCM - Business Features'), margin, 10);

  setFont(7.5, 'normal');
  doc.text(
    toPdfText('Multi-location medical clinic management + retail  |  Clinica San Miguel / MyClinicMD'),
    margin,
    16
  );

  y = 28;

  // Subtitle pill
  doc.setFillColor(240, 246, 255);
  doc.setDrawColor(200, 220, 255);
  doc.roundedRect(margin, y - 4, pageW - margin * 2, 10, 1.5, 1.5, 'FD');

  setFont(7, 'normal');
  doc.setTextColor(muted.r, muted.g, muted.b);
  const overview = toPdfText(
    'Back-office console for clinic staff & admins. Clinical ops + Retail POS + Admin tools + Finance. Multi-location, English & Spanish.'
  );
  doc.text(doc.splitTextToSize(overview, pageW - margin * 2 - 4), margin + 2, y + 1.5);
  y += 12;
}

function drawSection(title, items, x, startY, width) {
  let cy = startY;

  // Section title with accent bar
  doc.setFillColor(brand.r, brand.g, brand.b);
  doc.rect(x, cy - 3.2, 1.2, 4, 'F');
  setFont(7.8, 'bold');
  doc.setTextColor(brand.r, brand.g, brand.b);
  doc.text(toPdfText(title), x + 2.5, cy);
  cy += 4.5;

  doc.setTextColor(30, 30, 30);
  setFont(6.8, 'normal');

  for (const raw of items) {
    const text = toPdfText(raw);
    const textX = x + BULLET_INDENT;
    const textW = width - BULLET_INDENT;
    const lines = doc.splitTextToSize(text, textW);

    // Bullet dot
    doc.setFillColor(brand.r, brand.g, brand.b);
    doc.circle(x + 1, cy - 0.8, 0.55, 'F');

    doc.setTextColor(30, 30, 30);
    doc.text(lines, textX, cy);
    cy += lines.length * LINE_H + 0.6;
  }

  return cy + 1;
}

drawHeader();

const leftX = margin;
const rightX = margin + colW + gutter;

const leftSections = [
  {
    title: 'Dashboard & Patients',
    items: [
      'Dashboard: quick stats, uptime/SSL/DNS monitoring',
      'Patients: All / On-site / Off-site directories',
      'Profiles: demographics, contact, sales & transaction history',
    ],
  },
  {
    title: 'Appointments & Reputation',
    items: [
      'Office & virtual visits; approval workflow',
      'Scheduling, address validation, confirmation & reminder emails',
      'Private Feedback: internal review capture',
    ],
  },
  {
    title: 'POS & Transactions',
    items: [
      'Sales register: medical products & services, promo codes',
      'Returns, searchable sales history, patient-linked checkout',
      'Off-site fulfillment: request -> fulfill -> email confirmation',
      'Transactions: per-patient financial ledger & balances',
    ],
  },
  {
    title: 'Bonus & Credits',
    items: [
      'Location Bonus & Individual Bonus (commissions/incentives)',
      'Configurable thresholds, paid/unpaid tracking, leaderboards',
      'Patient store credits: balances, limits, location overviews',
    ],
  },
];

const rightSections = [
  {
    title: 'Inventory & Warehouse',
    items: [
      'Products & categories; archive/unarchive; stock transfers',
      'Per-location stock: available, assigned, remaining',
      'Warehouse: central stock hub feeding clinic locations',
      'AI Stock Panel: batch inventory analysis & insights',
    ],
  },
  {
    title: 'Controls',
    items: [
      'Location credit limits & reporting config',
      'Email templates: create, edit, preview',
      'Staff management: roles, multi-location, active/inactive',
    ],
  },
  {
    title: 'Tools (Admin & Marketing)',
    items: [
      'Email Broadcast: segmented mass email to patients',
      'Website CMS: About, Blogs, FAQs, Services, Locations, etc.',
      'Promo Codes, Specials gallery, Pharmacy partners',
      'Medical Forms (synced to patient website)',
      'Roles & Permissions, User Management, Settings',
    ],
  },
  {
    title: 'Integrations',
    items: [
      'Supabase (data & auth), AWS SNS (SMS), Email (transactional & broadcast)',
      'OpenAI (Stock Panel), Mapbox (address validation), Cronitor (monitoring)',
      'Parent -> Child DB sync for medical forms',
    ],
  },
];

let leftY = y;
for (const s of leftSections) leftY = drawSection(s.title, s.items, leftX, leftY, colW);

let rightY = y;
for (const s of rightSections) rightY = drawSection(s.title, s.items, rightX, rightY, colW);

y = Math.max(leftY, rightY) + 3;

// Module quick reference table
doc.autoTable({
  startY: y,
  margin: { left: margin, right: margin },
  head: [[toPdfText('Module'), toPdfText('Capabilities')]],
  body: [
    ['Home', 'Dashboard'],
    ['Patients', 'All | On-site | Off-site'],
    ['Clinical', 'Appointments | Reputation | Medical Forms | Pharmacy'],
    ['Retail', 'POS (Sales | History | Return | Fulfillment) | Inventory | Warehouse | Stock Panel'],
    ['Finance', 'Transactions | Credits | Bonus (Location | Individual)'],
    ['Admin', 'Controls | Email/SMS Broadcast | CMS | Promo | Roles | Users | Settings'],
  ].map(([a, b]) => [toPdfText(a), toPdfText(b)]),
  theme: 'striped',
  styles: {
    fontSize: 6.5,
    cellPadding: 2,
    lineColor: [220, 220, 220],
    lineWidth: 0.1,
    textColor: [30, 30, 30],
  },
  headStyles: {
    fillColor: [brand.r, brand.g, brand.b],
    textColor: 255,
    fontStyle: 'bold',
  },
  alternateRowStyles: { fillColor: [248, 250, 255] },
  columnStyles: {
    0: { cellWidth: 26, fontStyle: 'bold' },
    1: { cellWidth: 'auto' },
  },
});

// Footer
doc.setDrawColor(220, 220, 220);
doc.setLineWidth(0.2);
doc.line(margin, pageH - 12, pageW - margin, pageH - 12);

setFont(6.5, 'normal');
doc.setTextColor(120, 120, 120);
doc.text(toPdfText('MCM Business Features - One-Page Summary - July 2026'), margin, pageH - 7);
doc.text(toPdfText('Full details: BUSINESS_FEATURES.md'), pageW - margin, pageH - 7, { align: 'right' });

doc.save(outPath);
console.log(`PDF saved: ${outPath}`);
