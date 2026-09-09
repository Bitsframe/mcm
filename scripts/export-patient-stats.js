/**
 * Export patient statistics from Supabase to reports/patient-stats-data.json
 * Run: node scripts/export-patient-stats.js
 */
const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env.local") });

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

const empty = (v) => v == null || String(v).trim() === "";

async function fetchAll(table, select, filterFn) {
  const all = [];
  let from = 0;
  while (true) {
    let q = sb.from(table).select(select).range(from, from + 999);
    if (filterFn) q = filterFn(q);
    const { data, error } = await q;
    if (error) throw error;
    if (!data?.length) break;
    all.push(...data);
    if (data.length < 1000) break;
    from += 1000;
  }
  return all;
}

async function main() {
  const [patients, locs] = await Promise.all([
    fetchAll("allpatients", "id, locationid, dob, phone, email", (q) =>
      q.is("deleted_at", null)
    ),
    sb.from("Locations").select("id, title, address").then((r) => r.data || []),
  ]);

  const locTitle = new Map(
    locs.map((l) => [l.id, { title: l.title, address: l.address }])
  );
  const total = patients.length;
  let noPhone = 0;
  let noEmail = 0;
  let noBoth = 0;
  let hasBoth = 0;
  let noDob = 0;
  let hasDob = 0;
  let phoneOnly = 0;
  let emailOnly = 0;
  const byLoc = new Map();

  for (const p of patients) {
    const phone = !empty(p.phone);
    const email = !empty(p.email);
    if (!phone) noPhone++;
    if (!email) noEmail++;
    if (!phone && !email) noBoth++;
    if (phone && email) hasBoth++;
    if (phone && !email) phoneOnly++;
    if (email && !phone) emailOnly++;
    if (p.dob == null) noDob++;
    else hasDob++;

    const lid = p.locationid ?? null;
    if (!byLoc.has(lid)) {
      byLoc.set(lid, {
        total: 0,
        hasDob: 0,
        missingDob: 0,
        hasPhone: 0,
        hasEmail: 0,
        hasBoth: 0,
        missingBoth: 0,
      });
    }
    const b = byLoc.get(lid);
    b.total++;
    if (p.dob != null) b.hasDob++;
    else b.missingDob++;
    if (phone) b.hasPhone++;
    if (email) b.hasEmail++;
    if (phone && email) b.hasBoth++;
    if (!phone && !email) b.missingBoth++;
  }

  const byLocation = [...byLoc.entries()]
    .map(([id, v]) => {
      const meta =
        id == null
          ? { title: "(no location)", address: "" }
          : locTitle.get(id) || { title: "Unknown", address: "" };
      return {
        locationId: id,
        title: meta.title,
        address: meta.address || "",
        ...v,
        pctMissingDob: ((v.missingDob / v.total) * 100).toFixed(1),
        pctHasDob: ((v.hasDob / v.total) * 100).toFixed(1),
      };
    })
    .sort((a, b) => b.total - a.total);

  const report = {
    generatedAt: new Date().toISOString(),
    summary: {
      totalPatients: total,
      hasDob,
      missingDob: noDob,
      pctMissingDob: ((noDob / total) * 100).toFixed(1),
      pctHasDob: ((hasDob / total) * 100).toFixed(1),
      hasPhone: total - noPhone,
      missingPhone: noPhone,
      pctHasPhone: (((total - noPhone) / total) * 100).toFixed(1),
      hasEmail: total - noEmail,
      missingEmail: noEmail,
      pctHasEmail: (((total - noEmail) / total) * 100).toFixed(1),
      hasBothPhoneAndEmail: hasBoth,
      missingBothPhoneAndEmail: noBoth,
      phoneOnly,
      emailOnly,
    },
    byLocation,
  };

  const outDir = path.join(__dirname, "..", "reports");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(
    path.join(outDir, "patient-stats-data.json"),
    JSON.stringify(report, null, 2)
  );
  console.log(`Exported ${total} patients, ${byLocation.length} locations`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
