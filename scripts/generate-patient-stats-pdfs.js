/**
 * Generates patient statistics PDF reports from reports/patient-stats-data.json
 * Run: node scripts/generate-patient-stats-pdfs.js
 * Refresh data first: node scripts/export-patient-stats.js (or re-run full pipeline)
 */
const fs = require("fs");
const path = require("path");
const { jsPDF } = require("jspdf");
require("jspdf-autotable");

const ROOT = path.join(__dirname, "..");
const DATA_PATH = path.join(ROOT, "reports", "patient-stats-data.json");
const OUT_DIR = path.join(ROOT, "reports");

function fmt(n) {
  return Number(n).toLocaleString("en-US");
}

function fmtDate(iso) {
  return new Date(iso).toLocaleString("en-US", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "America/Chicago",
  });
}

function addHeader(doc, title, subtitle) {
  doc.setFillColor(0, 102, 255);
  doc.rect(0, 0, 210, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(title, 14, 12);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(subtitle, 14, 20);
  doc.setTextColor(40, 40, 40);
}

function addFooter(doc, pageNum) {
  const h = doc.internal.pageSize.getHeight();
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text("MyClinic MD — Patient Data Report", 14, h - 8);
  doc.text(`Page ${pageNum}`, 196, h - 8, { align: "right" });
}

function generateSummaryPdf(data) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const s = data.summary;
  const generated = fmtDate(data.generatedAt);

  addHeader(
    doc,
    "Patient Data Statistics",
    `Generated ${generated} · Source: allpatients (active, non-deleted)`
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Overview", 14, 38);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(
    `This report summarizes contact and date-of-birth coverage across ${fmt(s.totalPatients)} active patient records.`,
    14,
    45,
    { maxWidth: 182 }
  );

  doc.autoTable({
    startY: 52,
    head: [["Metric", "Count", "Share"]],
    body: [
      ["Total active patients", fmt(s.totalPatients), "100%"],
      ["Have date of birth (DOB)", fmt(s.hasDob), `${s.pctHasDob}%`],
      ["Missing DOB", fmt(s.missingDob), `${s.pctMissingDob}%`],
      ["Have phone", fmt(s.hasPhone), `${s.pctHasPhone}%`],
      ["Missing phone", fmt(s.missingPhone), `${((s.missingPhone / s.totalPatients) * 100).toFixed(1)}%`],
      ["Have email", fmt(s.hasEmail), `${s.pctHasEmail}%`],
      ["Missing email", fmt(s.missingEmail), `${((s.missingEmail / s.totalPatients) * 100).toFixed(1)}%`],
      ["Have both phone & email", fmt(s.hasBothPhoneAndEmail), `${((s.hasBothPhoneAndEmail / s.totalPatients) * 100).toFixed(1)}%`],
      ["Phone only (no email)", fmt(s.phoneOnly), `${((s.phoneOnly / s.totalPatients) * 100).toFixed(1)}%`],
      ["Email only (no phone)", fmt(s.emailOnly), `${((s.emailOnly / s.totalPatients) * 100).toFixed(1)}%`],
      ["Missing both phone & email", fmt(s.missingBothPhoneAndEmail), `${((s.missingBothPhoneAndEmail / s.totalPatients) * 100).toFixed(1)}%`],
    ],
    theme: "grid",
    headStyles: { fillColor: [0, 102, 255], textColor: 255, fontStyle: "bold" },
    styles: { fontSize: 10, cellPadding: 3 },
    columnStyles: {
      0: { cellWidth: 90 },
      1: { halign: "right", cellWidth: 40 },
      2: { halign: "right", cellWidth: 40 },
    },
  });

  let y = doc.lastAutoTable.finalY + 12;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Key findings", 14, y);
  y += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const findings = [
    `• ${fmt(s.missingDob)} patients (${s.pctMissingDob}%) are missing date of birth in allpatients.`,
    `• Phone and email are well captured: ${s.pctHasPhone}% have phone, ${s.pctHasEmail}% have email.`,
    `• Only ${fmt(s.missingBothPhoneAndEmail)} patients lack both phone and email.`,
    `• A SQL backfill from appointments updated 0 rows — DOB was not stored on linked appointment records for these patients.`,
    `• Going forward, DOB can be collected when booking returning patients and saved to allpatients.`,
  ];
  findings.forEach((line) => {
    doc.text(line, 14, y, { maxWidth: 182 });
    y += 7;
  });

  addFooter(doc, 1);
  const outPath = path.join(OUT_DIR, "patient-data-statistics.pdf");
  doc.save(outPath);
  return outPath;
}

function generateByLocationPdf(data) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const generated = fmtDate(data.generatedAt);
  const rows = data.byLocation;

  addHeader(
    doc,
    "Patients by Location",
    `Generated ${generated} · ${fmt(data.summary.totalPatients)} total active patients across ${rows.length} locations`
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(
    "Breakdown of patient counts, DOB coverage, and contact info by clinic location.",
    14,
    36
  );

  doc.autoTable({
    startY: 42,
    head: [[
      "ID",
      "Location",
      "Total",
      "Has DOB",
      "Missing DOB",
      "% Missing DOB",
      "Has Phone",
      "Has Email",
      "Both Contact",
      "Missing Both",
    ]],
    body: rows.map((r) => [
      r.locationId ?? "—",
      r.title,
      fmt(r.total),
      fmt(r.hasDob),
      fmt(r.missingDob),
      `${r.pctMissingDob}%`,
      fmt(r.hasPhone),
      fmt(r.hasEmail),
      fmt(r.hasBoth),
      fmt(r.missingBoth),
    ]),
    foot: [[
      "TOTAL",
      "",
      fmt(data.summary.totalPatients),
      fmt(data.summary.hasDob),
      fmt(data.summary.missingDob),
      `${data.summary.pctMissingDob}%`,
      fmt(data.summary.hasPhone),
      fmt(data.summary.hasEmail),
      fmt(data.summary.hasBothPhoneAndEmail),
      fmt(data.summary.missingBothPhoneAndEmail),
    ]],
    theme: "grid",
    headStyles: { fillColor: [0, 102, 255], textColor: 255, fontStyle: "bold", fontSize: 8 },
    footStyles: { fillColor: [240, 244, 249], textColor: [20, 20, 20], fontStyle: "bold", fontSize: 8 },
    styles: { fontSize: 8, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 12 },
      1: { cellWidth: 62 },
      2: { halign: "right", cellWidth: 16 },
      3: { halign: "right", cellWidth: 16 },
      4: { halign: "right", cellWidth: 20 },
      5: { halign: "right", cellWidth: 22 },
      6: { halign: "right", cellWidth: 18 },
      7: { halign: "right", cellWidth: 18 },
      8: { halign: "right", cellWidth: 20 },
      9: { halign: "right", cellWidth: 20 },
    },
    didDrawPage: (hookData) => {
      addFooter(doc, hookData.pageNumber);
    },
  });

  // Second page: addresses
  doc.addPage("landscape");
  addHeader(doc, "Patients by Location — Addresses", `Generated ${generated}`);
  doc.autoTable({
    startY: 36,
    head: [["ID", "Location", "Address", "Total Patients", "Missing DOB"]],
    body: rows.map((r) => [
      r.locationId ?? "—",
      r.title,
      r.address || "—",
      fmt(r.total),
      fmt(r.missingDob),
    ]),
    theme: "striped",
    headStyles: { fillColor: [0, 102, 255], textColor: 255, fontStyle: "bold", fontSize: 8 },
    styles: { fontSize: 8, cellPadding: 2.5 },
    columnStyles: {
      0: { cellWidth: 12 },
      1: { cellWidth: 55 },
      2: { cellWidth: 110 },
      3: { halign: "right", cellWidth: 28 },
      4: { halign: "right", cellWidth: 28 },
    },
    didDrawPage: (hookData) => {
      addFooter(doc, hookData.pageNumber);
    },
  });

  const outPath = path.join(OUT_DIR, "patients-by-location.pdf");
  doc.save(outPath);
  return outPath;
}

function main() {
  if (!fs.existsSync(DATA_PATH)) {
    console.error("Missing data file. Run: node scripts/export-patient-stats.js");
    process.exit(1);
  }
  const data = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const summaryPath = generateSummaryPdf(data);
  const locationPath = generateByLocationPdf(data);
  console.log("Created:");
  console.log(" ", summaryPath);
  console.log(" ", locationPath);
}

main();
