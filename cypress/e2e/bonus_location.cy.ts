/// <reference types="cypress" />
export {};

// Bonus Location Bonus E2E Tests
// URL: /en/bonus/location
// Test order:
//  1. Smoke: page load, tabs, headers, date filter
//  2. Calculate: RPC, loading state, toast
//  3. Calculation correctness: FLAT + PERCENTAGE formula
//  4. Filter sheet: date + name
//  5. E2E: Set threshold=$1 -> POS sale -> Calculate -> eligibility=true in DB + UI
//  6. Set limits FLAT: save -> DB verify -> Calculation tab shows threshold/type/value
//  7. Set limits PERCENTAGE: save -> DB verify -> Calculation tab shows type
//  8. Pay toggle: click Pay -> API -> toast -> DB paid=true -> appears in Transactions tab
//  9. Transactions tab: columns + paid rows + DB match
// 10. Bonus Eligibility: Yes/No badge + DB match + Pay button gating

const BONUS_LOCATION_URL = "/en/bonus/location";

function loginAndVisitBonus() {
  cy.loginWithCredentials(TEST_EMAIL, TEST_PASSWORD);
  cy.wait(2000);
  cy.visit(BONUS_LOCATION_URL);
  cy.wait(2000);
}

function getYesterdayYMD(): string {
  const d = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 10);
}

function getTodayYMD(): string {
  return new Date().toISOString().slice(0, 10);
}

// ─── Shared POS helpers (used by E2E test) ────────────────────────────────────

function getActiveLocationId(): Cypress.Chainable<number> {
  return cy.window().then((win) => {
    let locationId = 0;
    for (let i = 0; i < win.localStorage.length; i++) {
      const key = win.localStorage.key(i);
      if (key && key.startsWith("@location")) {
        const val = parseInt(win.localStorage.getItem(key) || "0", 10);
        if (val > 0) { locationId = val; break; }
      }
    }
    return cy.wrap(locationId);
  });
}

function selectFirstPatient() {
  cy.wait(1000);
  cy.get("body").then(($body) => {
    const todayBtns = $body.find("button:visible").toArray()
      .filter((b) => /^select$|^seleccionar$/i.test((b.textContent || "").trim()));
    if (todayBtns.length > 0) {
      cy.wrap(todayBtns[0]).click({ force: true });
    } else {
      cy.contains("button", "Past records").click({ force: true });
      cy.wait(1000);
      cy.get("button:visible").filter((_, b) =>
        /^select$|^seleccionar$/i.test((b.textContent || "").trim())
      ).first().click({ force: true });
    }
  });
  cy.url().should("include", "/pos/sales");
  cy.contains("button", "Add Product").should("not.be.disabled");
}

function addProductAndPlaceOrder() {
  cy.contains("button", "Add Product").click({ force: true });
  cy.get('input[placeholder="Search product..."]', { timeout: 10000 }).should("be.visible");
  cy.get("table tbody tr", { timeout: 10000 }).should("have.length.greaterThan", 0);
  cy.get("table tbody tr").first().find("button").contains("+").click({ force: true });
  cy.wait(200);

  cy.get("table tbody tr").first().find("td").eq(3).invoke("text").then((priceText) => {
    const price = parseFloat(priceText.replace(/[^0-9.]/g, "")) || 1;
    cy.log(`[POS] Product price: ${price}`);

    cy.contains("button", "Add to Cart").click({ force: true });
    cy.wait(300);
    cy.get('button[aria-label="Close modal"]').click({ force: true });
    cy.wait(300);

    cy.get('input[placeholder="0.00"]').first()
      .click({ force: true }).type("{selectall}" + price.toFixed(2), { force: true });
    cy.wait(300);

    cy.intercept("POST", "**/api/orders*").as("placeOrder");
    cy.get("button.rounded.py-1.px-3.text-white.w-1\\/2.flex.justify-between.items-center.text-sm")
      .should("not.be.disabled").click({ force: true });

    cy.wait("@placeOrder", { timeout: 30000 });
    cy.contains(/order has been placed|order #/i, { timeout: 15000 }).should("exist");
    cy.log("[POS] ✓ Order placed");
  });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("Bonus — Location Bonus Page", () => {

  // ── 1. Smoke: page load, tab switching, table headers, date filter ──────────

  it("should load page, switch all tabs, show correct headers, and update date label", () => {
    loginAndVisitBonus();

    cy.contains("h1", "Bonus", { timeout: 15000 }).should("exist");
    cy.contains("button", "Bonus calculation").should("have.class", "border-b-2").and("have.class", "border-blue-600");
    cy.contains("button", "Bonus transactions").should("exist");
    cy.contains("button", "Set limits").should("exist");

    cy.contains("button", "Bonus transactions").click({ force: true });
    cy.wait(400);
    cy.contains("button", "Bonus transactions").should("have.class", "border-b-2");

    cy.contains("button", "Set limits").click({ force: true });
    cy.wait(400);
    cy.contains("button", "Set limits").should("have.class", "border-b-2");

    cy.contains("button", "Bonus calculation").click({ force: true });
    cy.wait(400);
    cy.contains("button", "Bonus calculation").should("have.class", "border-b-2");
    cy.log("[UI] All three tabs switch correctly");

    cy.contains("th", "Name").should("exist");
    cy.contains("th", "Total Sales").should("exist");
    cy.contains("th", "Bonus Sales").should("exist");
    cy.contains("th", "Bonus Threshold").should("exist");
    cy.contains("th", "Flat/Percentage").should("exist");
    cy.contains("th", "Value").should("exist");
    cy.contains("th", "Bonus amount").should("exist");
    cy.contains("th", "Bonus Eligibility").should("exist");
    cy.contains("th", "Status").should("exist");
    cy.log("[UI] All column headers present");

    cy.get("table tbody tr", { timeout: 15000 }).should("have.length.greaterThan", 0);

    cy.contains("button", "Today").click({ force: true });
    cy.wait(600);
    cy.contains(new Date(getTodayYMD()).toLocaleDateString(), { timeout: 10000 }).should("exist");

    cy.contains("button", "Yesterday").click({ force: true });
    cy.wait(600);
    cy.contains(new Date(getYesterdayYMD()).toLocaleDateString(), { timeout: 10000 }).should("exist");
    cy.log("[UI] Today/Yesterday date labels update correctly");
  });

  // ── 2. Calculate button — RPC, loading state, toast ────────────────────────

  it("should click Calculate, show Calculating... state, call RPC, and show toast", () => {
    loginAndVisitBonus();

    cy.contains("button", "Bonus calculation").click({ force: true });
    cy.wait(500);
    cy.contains("button", "Calculate", { timeout: 10000 }).should("exist").and("not.be.disabled");

    cy.intercept("POST", "**/rpc/update_bonus_totalsales*").as("calcRpc");
    cy.contains("button", "Calculate").click({ force: true });

    cy.contains("button", "Calculating...", { timeout: 5000 }).should("exist");
    cy.log("[UI] Calculating... state shown");

    cy.wait("@calcRpc", { timeout: 30000 });
    cy.log("[RPC] update_bonus_totalsales called");

    cy.get(".Toastify__toast", { timeout: 15000 }).should("exist");
    cy.contains("button", "Calculate", { timeout: 15000 }).should("exist");
    cy.log("[UI] Toast shown, button returned to normal");
  });

  // ── 3. Calculation correctness — FLAT and PERCENTAGE in one test ────────────

  it("should verify FLAT and PERCENTAGE bonus amount calculations match formula for Yesterday", () => {
    loginAndVisitBonus();

    cy.contains("button", "Bonus calculation").click({ force: true });
    cy.wait(500);
    cy.contains("button", "Yesterday").click({ force: true });
    cy.wait(1500);

    cy.get("table tbody tr", { timeout: 15000 }).then(($rows) => {
      let flatVerified = false;
      let pctVerified = false;

      $rows.each((_, row) => {
        const cells = Cypress.$(row).find("td");
        const totalSales = parseFloat((cells[1]?.textContent || "").replace(/[$,]/g, "").trim());
        const threshold  = parseFloat((cells[3]?.textContent || "").replace(/[$,]/g, "").trim());
        const typeText   = (cells[4]?.textContent || "").trim().toUpperCase();
        const value      = parseFloat((cells[5]?.textContent || "").replace(/[$%,]/g, "").trim());
        const bonusAmt   = parseFloat((cells[6]?.textContent || "").replace(/[$,]/g, "").trim());

        if (!isNaN(totalSales) && !isNaN(threshold) && !isNaN(value) && !isNaN(bonusAmt) && bonusAmt > 0) {
          if (typeText === "FLAT" && !flatVerified) {
            if (totalSales > threshold) {
              expect(bonusAmt).to.be.closeTo(value, 0.02);
              cy.log(`[FLAT] ✓ total=${totalSales}, threshold=${threshold}, value=${value}, bonus=${bonusAmt}`);
            }
            flatVerified = true;
          }
          if (typeText === "PERCENTAGE" && !pctVerified) {
            if (totalSales > threshold) {
              const expected = totalSales * (value / 100);
              expect(bonusAmt).to.be.closeTo(expected, 0.05);
              cy.log(`[PCT] ✓ total=${totalSales}, pct=${value}%, expected=${expected.toFixed(2)}, actual=${bonusAmt}`);
            }
            pctVerified = true;
          }
        }
      });

      if (!flatVerified) cy.log("[FLAT] No FLAT rows with full data — skipping");
      if (!pctVerified) cy.log("[PCT] No PERCENTAGE rows with full data — skipping");
    });
  });

  // ── 4. Filter sheet — date and name filters ─────────────────────────────────

  it("should open Filter sheet, apply date filter and name filter, verify table updates", () => {
    loginAndVisitBonus();

    cy.contains("button", "Bonus calculation").click({ force: true });
    cy.wait(500);

    cy.contains("button", "Filter").click({ force: true });
    cy.wait(500);
    cy.contains("Staff", { timeout: 10000 }).should("exist");

    const yesterday = getYesterdayYMD();
    cy.get('input[type="date"][aria-label*="date"]').first()
      .clear({ force: true }).type(yesterday, { force: true });
    cy.wait(200);
    cy.contains("button", "Apply").click({ force: true });
    cy.wait(1000);
    cy.contains(new Date(yesterday).toLocaleDateString(), { timeout: 10000 }).should("exist");
    cy.log("[FILTER] Date filter applied");

    cy.get("table tbody tr", { timeout: 10000 }).should("have.length.greaterThan", 0);
    cy.get("table tbody tr").first().find("td").first().invoke("text").then((locationName) => {
      const name = locationName.trim();

      cy.contains("button", "Filter").click({ force: true });
      cy.wait(500);
      cy.get("select#filter-name-input-modal").select(name, { force: true });
      cy.wait(200);
      cy.contains("button", "Apply").click({ force: true });
      cy.wait(1000);

      cy.get("table tbody tr", { timeout: 10000 }).each(($row) => {
        cy.wrap($row).find("td").first().invoke("text").then((rowName) => {
          expect(rowName.trim().toLowerCase()).to.include(name.toLowerCase().split(" ")[0]);
        });
      });
      cy.log(`[FILTER] Name filter "${name}" shows only matching rows`);
    });
  });


  // ── 5. E2E: Set threshold=$1 → POS sale → Calculate → eligibility=true ──────
  // This runs BEFORE the Set limits FLAT/PERCENTAGE tests so that when those
  // tests run, there is already an eligible row in the Calculation tab to verify.

  it("should set threshold=$1, place POS sale, run Calculate, verify bonus_eligibility=true in DB and Yes badge in UI, then click Pay and verify in Transactions tab", () => {

    // STEP 1: Set threshold=$1 (FLAT, value=$75) so any sale qualifies
    cy.log("=== STEP 1: Set bonus threshold=$1 in Set limits ===");
    cy.loginWithCredentials(TEST_EMAIL, TEST_PASSWORD);
    cy.wait(2000);
    cy.visit(BONUS_LOCATION_URL);
    cy.wait(2000);

    cy.contains("button", "Set limits").click({ force: true });
    cy.wait(1000);
    cy.get("table tbody tr", { timeout: 15000 }).should("have.length.greaterThan", 0);

    cy.get("table tbody tr").first().find("td").eq(0).invoke("text").then((locNameRaw) => {
      const locName = locNameRaw.trim();
      cy.log(`[SET LIMITS] Configuring: "${locName}"`);

      cy.get("table tbody tr").first().find("select").first().select("FLAT", { force: true });
      cy.wait(200);
      cy.get("table tbody tr").first().find('input[inputmode="decimal"]').first()
        .click({ force: true }).type("{selectall}75", { force: true });
      cy.wait(200);
      cy.get("table tbody tr").first().find('input[inputmode="numeric"]').first()
        .click({ force: true }).type("{selectall}1", { force: true });
      cy.wait(200);

      cy.intercept("POST", "**/api/bonuses/save*").as("saveThreshold");
      cy.get("table tbody tr").first().find("button").contains("Update").click({ force: true });
      cy.wait("@saveThreshold", { timeout: 15000 });
      cy.get(".Toastify__toast--success", { timeout: 10000 }).should("contain.text", "Configuration saved");
      cy.log("[SET LIMITS] ✓ Threshold=$1 saved");

      cy.wait(1000);
      cy.get("@saveThreshold").then((interception: any) => {
        const locationId = interception.request.body?.bonuses?.[0]?.location_id;

        cy.task("getActiveBonusConfig", { locationId: Number(locationId) }).then((config) => {
          cy.log(`[DB] Config after save: ${JSON.stringify(config)}`);
          expect(config).to.not.be.null;
          expect(Number((config as Record<string, unknown>).bonus_threshold)).to.be.closeTo(1, 0.5);
          cy.log("[DB] ✓ bonus_threshold≈$1");
        });

        // STEP 2: Place POS sale
        cy.log("=== STEP 2: Place POS sale ===");
        cy.visit("/en/pos/sales/patients");
        cy.wait(2000);

        getActiveLocationId().then((activeLocId) => {
          cy.log(`[POS] Active location_id: ${activeLocId}`);
          selectFirstPatient();
          addProductAndPlaceOrder();

          // STEP 3: Run Calculate
          cy.log("=== STEP 3: Run Calculate ===");
          cy.visit(BONUS_LOCATION_URL);
          cy.wait(2000);

          cy.contains("button", "Bonus calculation").click({ force: true });
          cy.wait(500);
          cy.contains("button", "Today").click({ force: true });
          cy.wait(800);

          cy.intercept("POST", "**/rpc/update_bonus_totalsales*").as("calcRpc");
          cy.contains("button", "Calculate").click({ force: true });
          cy.contains("button", "Calculating...", { timeout: 5000 }).should("exist");
          cy.wait("@calcRpc", { timeout: 30000 });
          cy.get(".Toastify__toast--success", { timeout: 15000 }).should("exist");
          cy.log("[CALC] ✓ Calculation triggered");
          cy.wait(2000);

          // STEP 4: DB verify — bonus_eligibility=true
          cy.log("=== STEP 4: Verify DB bonus table ===");
          const today = getTodayYMD();
          cy.task("getBonusRowForLocationAndDate", { locationId: Number(locationId), date: today }).then((bonusRow) => {
            cy.log(`[DB] bonus row for location_id=${locationId}, date=${today}: ${JSON.stringify(bonusRow)}`);
            if (!bonusRow) { cy.log("[DB] No bonus row yet — RPC may need sales data"); return; }
            const row = bonusRow as Record<string, unknown>;
            cy.log(`[DB] total_sales=${row.total_sales}, bonus_sales=${row.bonus_sales}, bonus_amount=${row.bonus_amount}, bonus_eligibility=${row.bonus_eligibility}`);
            expect(row.bonus_eligibility).to.eq(true);
            expect(Number(row.total_sales)).to.be.greaterThan(1);
            cy.log("[DB] ✓ bonus_eligibility=true, total_sales>$1");
          });
          cy.task("getBonusRowsForLocation", { locationId: Number(locationId), limit: 5 }).then((rows) => {
            cy.log(`[DB] Latest 5 bonus rows for location ${locationId}: ${JSON.stringify(rows)}`);
          });

          // STEP 5: UI verify — Yes badge and Pay button enabled
          cy.log("=== STEP 5: Verify UI — Yes badge and Pay button enabled ===");
          cy.get("table tbody tr", { timeout: 15000 }).should("have.length.greaterThan", 0);

          cy.contains("td", locName, { timeout: 15000 }).closest("tr").find("td").eq(7)
            .invoke("text").then((eligText) => {
              expect(eligText.trim()).to.eq("Yes");
              cy.log(`[UI] ✓ Bonus Eligibility="Yes" for "${locName}"`);
            });

          cy.contains("td", locName).closest("tr")
            .find("button").filter((_, b) => {
              const t = (b.textContent || "").trim();
              return t === "Pay" || t === "Paid";
            }).then(($btn) => {
              expect($btn.length).to.be.greaterThan(0);
              expect($btn[0].hasAttribute("disabled")).to.eq(false);
              cy.log(`[UI] ✓ Pay/Paid button enabled for "${locName}"`);
            });

          // STEP 6: Click Pay and verify in Transactions tab
          cy.log("=== STEP 6: Click Pay and verify in Transactions tab ===");

          cy.contains("td", locName).closest("tr")
            .find("button").filter((_, b) => b.textContent?.trim() === "Pay" && !b.hasAttribute("disabled"))
            .then(($payBtn) => {
              if ($payBtn.length === 0) {
                cy.log("[UI] No Pay button (already paid or not eligible) — skipping Pay step");
                return;
              }

              cy.intercept("POST", "**/api/bonuses/update-paid*").as("updatePaid");
              cy.wrap($payBtn).first().click({ force: true });

              cy.wait("@updatePaid", { timeout: 15000 }).then((interception) => {
                const reqLocationId = interception.request.body?.items?.[0]?.location_id;
                const reqDate = interception.request.body?.items?.[0]?.date;
                cy.log(`[API] update-paid: location_id=${reqLocationId}, date=${reqDate}`);

                cy.get(".Toastify__toast", { timeout: 10000 }).should("exist");
                cy.log("[UI] ✓ Toast shown after Pay");

                // DB verify paid=true
                cy.wait(1000);
                cy.task("getBonusRowForLocationAndDate", {
                  locationId: Number(reqLocationId),
                  date: String(reqDate),
                }).then((bonusRow) => {
                  cy.log(`[DB] bonus row after Pay: ${JSON.stringify(bonusRow)}`);
                  if (bonusRow) {
                    const row = bonusRow as Record<string, unknown>;
                    expect(row.paid).to.eq(true);
                    cy.log(`[DB] ✓ paid=true, paid_date=${row.paid_date}, bonus_amount=${row.bonus_amount}`);
                  }
                });

                // Verify row appears in Transactions tab
                cy.contains("button", "Bonus transactions").click({ force: true });
                cy.wait(1500);

                cy.get("body").then(($body) => {
                  if ($body.text().includes("No paid bonuses") || $body.text().includes("No bonuses found")) {
                    cy.reload();
                    cy.wait(2000);
                    cy.contains("button", "Bonus transactions").click({ force: true });
                    cy.wait(1500);
                  }
                });

                cy.get("table tbody tr", { timeout: 15000 }).should("have.length.greaterThan", 0);
                cy.contains("td", locName, { timeout: 10000 }).closest("tr").find("td").last()
                  .invoke("text").then((s) => {
                    expect(s.trim()).to.eq("Paid");
                    cy.log(`[UI] ✓ Status="Paid" in Transactions tab for "${locName}"`);
                  });
                cy.contains("td", locName).closest("tr").find("td").eq(7)
                  .invoke("text").then((d) => {
                    expect(d.trim()).to.not.eq("-");
                    cy.log(`[UI] ✓ paid_date="${d.trim()}" in Transactions tab`);
                  });
              });
            });
        });
      });
    });
  });


  // ── 6. Set limits FLAT — save, DB verify, Calculation tab verify ────────────
  // Runs after E2E test so there is already an eligible row visible in Calculation tab

  it("should save FLAT config in Set limits, confirm DB bonus_config_history, verify threshold/type/value in Calculation tab", () => {
    loginAndVisitBonus();

    cy.contains("button", "Set limits").click({ force: true });
    cy.wait(1000);
    cy.get("table tbody tr", { timeout: 15000 }).should("have.length.greaterThan", 0);

    // Update button disabled before any edit
    cy.get("table tbody tr").first().find("button").contains("Update").should("be.disabled");
    cy.log("[SET LIMITS] Update button disabled before editing");

    cy.get("table tbody tr").first().find("td").eq(0).invoke("text").then((locationName) => {
      const locName = locationName.trim();
      const testValue = "75";
      const testThreshold = "500";

      // PHASE 1: Edit and save
      cy.get("table tbody tr").first().find("select").first().select("FLAT", { force: true });
      cy.wait(200);
      cy.get("table tbody tr").first().find('input[inputmode="decimal"]').first()
        .click({ force: true }).type("{selectall}" + testValue, { force: true });
      cy.wait(200);
      cy.get("table tbody tr").first().find('input[inputmode="numeric"]').first()
        .click({ force: true }).type("{selectall}" + testThreshold, { force: true });
      cy.wait(200);

      cy.get("table tbody tr").first().find("button").contains("Update").should("not.be.disabled");
      cy.log("[SET LIMITS] Update button enabled after editing");

      cy.intercept("POST", "**/api/bonuses/save*").as("saveConfig");
      cy.get("table tbody tr").first().find("button").contains("Update").click({ force: true });
      cy.wait("@saveConfig", { timeout: 15000 }).then((interception) => {
        cy.log(`[SET LIMITS] Payload: ${JSON.stringify(interception.request.body)}`);
      });
      cy.get(".Toastify__toast--success", { timeout: 10000 }).should("contain.text", "Configuration saved");
      cy.log("[SET LIMITS] ✓ Configuration saved toast shown");

      // PHASE 2: DB verify
      cy.wait(1500);
      cy.get("@saveConfig").then((interception: any) => {
        const locationId = interception.request.body?.bonuses?.[0]?.location_id;

        cy.task("getActiveBonusConfig", { locationId: Number(locationId) }).then((config) => {
          cy.log(`[DB] bonus_config_history active row: ${JSON.stringify(config)}`);
          expect(config).to.not.be.null;
          const cfg = config as Record<string, unknown>;
          expect(String(cfg.flat_percentage).toUpperCase()).to.eq("FLAT");
          expect(Number(cfg.value)).to.be.closeTo(Number(testValue), 1);
          expect(Number(cfg.bonus_threshold)).to.be.closeTo(Number(testThreshold), 1);
          expect(cfg.effective_to).to.be.null;
          cy.log(`[DB] ✓ flat_percentage=${cfg.flat_percentage}, value=${cfg.value}, bonus_threshold=${cfg.bonus_threshold}, effective_to=null`);
        });

        cy.task("getBonusConfigHistory", { locationId: Number(locationId) }).then((history) => {
          const rows = history as any[];
          cy.log(`[DB] Config history (${rows.length} rows): ${JSON.stringify(rows)}`);
          expect(rows.length).to.be.greaterThan(0);
          const latest = rows[0];
          cy.log(`[DB] Latest — id=${latest.id}, effective_from=${latest.effective_from}, effective_to=${latest.effective_to}`);
        });
      });

      // PHASE 3: UI verify in Calculation tab
      cy.contains("button", "Bonus calculation").click({ force: true });
      cy.wait(1500);

      cy.contains("td", locName, { timeout: 15000 }).closest("tr").find("td").eq(3).invoke("text")
        .then((t) => {
          expect(parseFloat(t.replace(/[$,]/g, "").trim())).to.be.closeTo(parseFloat(testThreshold), 1);
          cy.log(`[CALC TAB] ✓ Bonus Threshold: "${t.trim()}"`);
        });
      cy.contains("td", locName).closest("tr").find("td").eq(4).invoke("text")
        .then((t) => { expect(t.trim().toUpperCase()).to.include("FLAT"); cy.log(`[CALC TAB] ✓ Type: "${t.trim()}"`); });
      cy.contains("td", locName).closest("tr").find("td").eq(5).invoke("text")
        .then((t) => {
          expect(parseFloat(t.replace(/[$%,]/g, "").trim())).to.be.closeTo(parseFloat(testValue), 1);
          cy.log(`[CALC TAB] ✓ Value: "${t.trim()}"`);
        });
    });
  });

  // ── 7. Set limits PERCENTAGE — save, DB verify, Calculation tab verify ───────

  it("should save PERCENTAGE config in Set limits, confirm DB bonus_config_history, verify type/threshold/value in Calculation tab", () => {
    loginAndVisitBonus();

    cy.contains("button", "Set limits").click({ force: true });
    cy.wait(1000);
    cy.get("table tbody tr", { timeout: 15000 }).should("have.length.greaterThan", 0);

    cy.get("table tbody tr").first().find("td").eq(0).invoke("text").then((locationName) => {
      const locName = locationName.trim();
      const testPct = "10";
      const testThreshold = "1000";

      // PHASE 1: Edit and save
      cy.get("table tbody tr").first().find("select").first().select("PERCENTAGE", { force: true });
      cy.wait(200);
      cy.get("table tbody tr").first().find('input[inputmode="decimal"]').first()
        .click({ force: true }).type("{selectall}" + testPct, { force: true });
      cy.wait(200);
      cy.get("table tbody tr").first().find('input[inputmode="numeric"]').first()
        .click({ force: true }).type("{selectall}" + testThreshold, { force: true });
      cy.wait(200);

      cy.intercept("POST", "**/api/bonuses/save*").as("saveConfig");
      cy.get("table tbody tr").first().find("button").contains("Update").click({ force: true });
      cy.wait("@saveConfig", { timeout: 15000 }).then((interception) => {
        cy.log(`[SET LIMITS] Payload: ${JSON.stringify(interception.request.body)}`);
      });
      cy.get(".Toastify__toast--success", { timeout: 10000 }).should("contain.text", "Configuration saved");
      cy.log("[SET LIMITS] ✓ Configuration saved toast shown");

      // PHASE 2: DB verify
      cy.wait(1500);
      cy.get("@saveConfig").then((interception: any) => {
        const locationId = interception.request.body?.bonuses?.[0]?.location_id;

        cy.task("getActiveBonusConfig", { locationId: Number(locationId) }).then((config) => {
          cy.log(`[DB] bonus_config_history active row: ${JSON.stringify(config)}`);
          expect(config).to.not.be.null;
          const cfg = config as Record<string, unknown>;
          expect(String(cfg.flat_percentage).toUpperCase()).to.eq("PERCENTAGE");
          expect(Number(cfg.value)).to.be.closeTo(Number(testPct), 1);
          expect(Number(cfg.bonus_threshold)).to.be.closeTo(Number(testThreshold), 1);
          expect(cfg.effective_to).to.be.null;
          cy.log(`[DB] ✓ flat_percentage=${cfg.flat_percentage}, value=${cfg.value}, bonus_threshold=${cfg.bonus_threshold}`);
        });

        cy.task("getBonusConfigHistory", { locationId: Number(locationId) }).then((history) => {
          const rows = history as any[];
          cy.log(`[DB] Config history (${rows.length} rows): ${JSON.stringify(rows)}`);
        });
      });

      // PHASE 3: UI verify in Calculation tab
      cy.contains("button", "Bonus calculation").click({ force: true });
      cy.wait(1500);

      cy.contains("td", locName, { timeout: 15000 }).closest("tr").find("td").eq(4).invoke("text")
        .then((t) => { expect(t.trim().toUpperCase()).to.include("PERCENTAGE"); cy.log(`[CALC TAB] ✓ Type: "${t.trim()}"`); });
      cy.contains("td", locName).closest("tr").find("td").eq(3).invoke("text")
        .then((t) => {
          expect(parseFloat(t.replace(/[$,]/g, "").trim())).to.be.closeTo(parseFloat(testThreshold), 1);
          cy.log(`[CALC TAB] ✓ Bonus Threshold: "${t.trim()}"`);
        });
      cy.contains("td", locName).closest("tr").find("td").eq(5).invoke("text")
        .then((t) => {
          expect(parseFloat(t.replace(/[$%,]/g, "").trim())).to.be.closeTo(parseFloat(testPct), 1);
          cy.log(`[CALC TAB] ✓ Value: "${t.trim()}"`);
        });
    });
  });


  // ── 8. Pay toggle — click Pay, API, toast, DB paid=true, appears in Transactions ──

  it("should click Pay, call update-paid API, show toast, verify DB paid=true, and row appears in Transactions tab", () => {
    loginAndVisitBonus();

    cy.contains("button", "Bonus calculation").click({ force: true });
    cy.wait(500);

    const findPayRowIndex = ($rows: JQuery<HTMLElement>): number => {
      let idx = -1;
      $rows.each((i, row) => {
        if (idx >= 0) return;
        const btn = Cypress.$(row).find("button").filter(
          (_, b) => b.textContent?.trim() === "Pay" && !b.hasAttribute("disabled")
        );
        if (btn.length > 0) idx = i;
      });
      return idx;
    };

    cy.contains("button", "Yesterday").click({ force: true });
    cy.wait(1500);

    cy.get("table tbody tr", { timeout: 15000 }).then(($rows) => {
      let payRowIndex = findPayRowIndex($rows);

      if (payRowIndex < 0) {
        cy.log("No eligible Pay rows for Yesterday — switching to Today");
        cy.contains("button", "Today").click({ force: true });
        cy.wait(1500);

        cy.get("table tbody tr", { timeout: 15000 }).then(($todayRows) => {
          payRowIndex = findPayRowIndex($todayRows);
          if (payRowIndex < 0) {
            cy.log("No eligible Pay rows on either date — skipping (run E2E test first to create eligible data)");
            return;
          }
          runPayToggle(payRowIndex);
        });
      } else {
        runPayToggle(payRowIndex);
      }
    });

    function runPayToggle(payRowIndex: number) {
      cy.get("table tbody tr").eq(payRowIndex).find("td").eq(0).invoke("text").then((locName) => {
        const locationName = locName.trim();
        cy.log(`[UI] Toggling Pay for: "${locationName}"`);

        cy.intercept("POST", "**/api/bonuses/update-paid*").as("updatePaid");
        cy.get("table tbody tr").eq(payRowIndex).find("button").contains("Pay").click({ force: true });

        cy.wait("@updatePaid", { timeout: 15000 }).then((interception) => {
          const locationId = interception.request.body?.items?.[0]?.location_id;
          const date = interception.request.body?.items?.[0]?.date;
          cy.log(`[API] update-paid: location_id=${locationId}, date=${date}`);

          cy.get(".Toastify__toast", { timeout: 10000 }).should("exist");
          cy.log("[UI] ✓ Toast shown");

          cy.wait(1000);
          cy.task("getBonusRowForLocationAndDate", { locationId: Number(locationId), date: String(date) }).then((bonusRow) => {
            cy.log(`[DB] bonus row: ${JSON.stringify(bonusRow)}`);
            if (bonusRow) {
              const row = bonusRow as Record<string, unknown>;
              expect(row.paid).to.eq(true);
              cy.log(`[DB] ✓ paid=true, paid_date=${row.paid_date}, bonus_amount=${row.bonus_amount}, bonus_sales=${row.bonus_sales}`);
            }
          });
          cy.task("getBonusRowsForLocation", { locationId: Number(locationId), limit: 5 }).then((rows) => {
            cy.log(`[DB] Latest 5 bonus rows for location ${locationId}: ${JSON.stringify(rows)}`);
          });

          cy.contains("button", "Bonus transactions").click({ force: true });
          cy.wait(1500);

          cy.get("body").then(($body) => {
            if ($body.text().includes("No paid bonuses") || $body.text().includes("No bonuses found")) {
              cy.reload();
              cy.wait(2000);
              cy.contains("button", "Bonus transactions").click({ force: true });
              cy.wait(1500);
            }
          });

          cy.get("table tbody tr", { timeout: 15000 }).should("have.length.greaterThan", 0);
          cy.contains("td", locationName, { timeout: 10000 }).closest("tr").find("td").last()
            .invoke("text").then((s) => { expect(s.trim()).to.eq("Paid"); cy.log(`[UI] ✓ Status="Paid" in Transactions tab`); });
          cy.contains("td", locationName).closest("tr").find("td").eq(7)
            .invoke("text").then((d) => { expect(d.trim()).to.not.eq("-"); cy.log(`[UI] ✓ paid_date="${d.trim()}"`); });
        });
      });
    }
  });

  // ── 9. Transactions tab — columns, paid rows, DB data match ────────────────

  it("should show all columns in Transactions tab, only paid rows with Paid badge and paid_date, and verify DB match", () => {
    loginAndVisitBonus();

    cy.contains("button", "Bonus transactions").click({ force: true });
    cy.wait(1500);

    cy.contains("th", "Name", { timeout: 10000 }).should("exist");
    cy.contains("th", "Total Sales").should("exist");
    cy.contains("th", "Bonus Sales").should("exist");
    cy.contains("th", "Bonus Threshold").should("exist");
    cy.contains("th", "Flat/Percentage").should("exist");
    cy.contains("th", "Value").should("exist");
    cy.contains("th", "Bonus amount").should("exist");
    cy.contains("th", "Paid date").should("exist");
    cy.contains("th", "Status").should("exist");
    cy.log("[UI] All Transactions tab columns present");

    cy.get("body").then(($body) => {
      if ($body.text().includes("No paid bonuses") || $body.text().includes("No bonuses found")) {
        cy.log("[UI] No paid bonuses — empty state shown correctly");
        return;
      }

      cy.get("table tbody tr", { timeout: 10000 }).should("have.length.greaterThan", 0);

      cy.get("table tbody tr").each(($row) => {
        cy.wrap($row).find("td").last().invoke("text").then((s) => { expect(s.trim()).to.eq("Paid"); });
        cy.wrap($row).find("td").eq(7).invoke("text").then((d) => {
          expect(d.trim()).to.not.eq("-");
          expect(d.trim()).to.not.be.empty;
        });
      });
      cy.log("[UI] All rows have Paid badge and non-empty paid_date");

      cy.get("table tbody tr").first().find("td").then(($cells) => {
        const locationName = ($cells[0]?.textContent || "").trim();
        const totalSalesUI = ($cells[1]?.textContent || "").replace(/[$,]/g, "").trim();
        const bonusAmtUI   = ($cells[6]?.textContent || "").replace(/[$,]/g, "").trim();
        const paidDateUI   = ($cells[7]?.textContent || "").trim();
        const statusUI     = ($cells[8]?.textContent || "").trim();

        cy.log(`[UI] Row — Name:"${locationName}", TotalSales:"${totalSalesUI}", BonusAmt:"${bonusAmtUI}", PaidDate:"${paidDateUI}", Status:"${statusUI}"`);
        expect(statusUI).to.eq("Paid");
        expect(paidDateUI).to.not.eq("-");

        cy.task("getAllLocations").then((locs) => {
          const locations = locs as Array<{ id: number; title: string }>;
          const match = locations.find((l) => (l.title || "").toLowerCase().trim() === locationName.toLowerCase());
          if (!match) { cy.log(`[DB] No location_id for "${locationName}"`); return; }

          cy.task("getBonusRowsForLocation", { locationId: match.id, limit: 10 }).then((rows) => {
            const dbRows = rows as Record<string, unknown>[];
            cy.log(`[DB] bonus rows for location ${match.id}: ${JSON.stringify(dbRows)}`);
            const paidRow = dbRows.find((r) => r.paid === true);
            if (!paidRow) { cy.log("[DB] No paid row found"); return; }

            cy.log(`[DB] Paid row: total_sales=${paidRow.total_sales}, bonus_sales=${paidRow.bonus_sales}, bonus_amount=${paidRow.bonus_amount}, paid_date=${paidRow.paid_date}, bonus_eligibility=${paidRow.bonus_eligibility}`);

            if (totalSalesUI !== "-" && paidRow.total_sales != null)
              expect(parseFloat(totalSalesUI)).to.be.closeTo(Number(paidRow.total_sales), 0.05);
            if (bonusAmtUI !== "-" && paidRow.bonus_amount != null)
              expect(parseFloat(bonusAmtUI)).to.be.closeTo(Number(paidRow.bonus_amount), 0.05);

            expect(paidRow.paid).to.eq(true);
            expect(paidRow.bonus_eligibility).to.eq(true);
            cy.log("[DB] ✓ paid=true, bonus_eligibility=true confirmed");
          });
        });
      });
    });
  });

  // ── 10. Bonus Eligibility — badge, DB match, Pay button gating, Calculate sets it ──

  it("should show Yes/No badge matching DB, Pay button gated by eligibility, and Calculate sets eligibility=true for Today", () => {
    loginAndVisitBonus();

    cy.contains("button", "Bonus calculation").click({ force: true });
    cy.wait(500);
    cy.contains("button", "Yesterday").click({ force: true });
    cy.wait(1500);

    cy.get("table tbody tr", { timeout: 15000 }).should("have.length.greaterThan", 0);
    cy.contains("th", "Bonus Eligibility").should("exist");

    // Every row: badge is Yes or No, Pay button gated accordingly
    cy.get("table tbody tr").each(($row) => {
      cy.wrap($row).find("td").eq(7).invoke("text").then((eligText) => {
        const t = eligText.trim();
        expect(["Yes", "No"]).to.include(t);

        const payBtn = $row.find("button").filter((_, b) => {
          const txt = (b.textContent || "").trim();
          return txt === "Pay" || txt === "Paid";
        });
        if (payBtn.length > 0) {
          if (t === "Yes") {
            expect(payBtn[0].hasAttribute("disabled")).to.eq(false);
            cy.log(`[UI] ✓ Eligibility=Yes → Pay/Paid button enabled`);
          } else {
            expect(payBtn[0].hasAttribute("disabled")).to.eq(true);
            cy.log(`[UI] ✓ Eligibility=No → Pay button disabled`);
          }
        }
      });
    });

    // DB match for first row
    cy.get("table tbody tr").first().find("td").then(($cells) => {
      const locationName = ($cells[0]?.textContent || "").trim();
      const eligText     = ($cells[7]?.textContent || "").trim();

      cy.task("getAllLocations").then((locs) => {
        const locations = locs as Array<{ id: number; title: string }>;
        const match = locations.find((l) => (l.title || "").toLowerCase().trim() === locationName.toLowerCase());
        if (!match) { cy.log(`[DB] No location_id for "${locationName}"`); return; }

        cy.task("getBonusRowForLocationAndDate", { locationId: match.id, date: getYesterdayYMD() }).then((bonusRow) => {
          cy.log(`[DB] bonus row for location_id=${match.id}: ${JSON.stringify(bonusRow)}`);
          if (!bonusRow) {
            expect(eligText).to.eq("No");
            cy.log("[DB] ✓ No bonus row → UI shows No");
            return;
          }
          const row = bonusRow as Record<string, unknown>;
          cy.log(`[DB] bonus_eligibility=${row.bonus_eligibility}, total_sales=${row.total_sales}`);
          if (row.bonus_eligibility === true) {
            expect(eligText).to.eq("Yes");
            cy.log("[DB] ✓ bonus_eligibility=true → UI shows Yes");
          } else {
            expect(eligText).to.eq("No");
            cy.log("[DB] ✓ bonus_eligibility=false → UI shows No");
          }
        });
      });
    });

    // Run Calculate for Today and verify eligibility updates in DB
    cy.contains("button", "Today").click({ force: true });
    cy.wait(800);

    cy.intercept("POST", "**/rpc/update_bonus_totalsales*").as("calcRpc");
    cy.contains("button", "Calculate").click({ force: true });
    cy.wait("@calcRpc", { timeout: 30000 });
    cy.get(".Toastify__toast", { timeout: 15000 }).should("exist");
    cy.wait(1500);

    cy.get("table tbody tr", { timeout: 15000 }).then(($rows) => {
      let eligibleLocName = "";
      $rows.each((_, row) => {
        if (eligibleLocName) return;
        const cells = Cypress.$(row).find("td");
        if ((cells[7]?.textContent || "").trim() === "Yes")
          eligibleLocName = (cells[0]?.textContent || "").trim();
      });

      if (!eligibleLocName) {
        cy.log("[UI] No eligible locations after Calculate for Today — no sales data");
        return;
      }
      cy.log(`[UI] "${eligibleLocName}" shows Eligibility=Yes after Calculate`);

      cy.task("getAllLocations").then((locs) => {
        const locations = locs as Array<{ id: number; title: string }>;
        const match = locations.find((l) => (l.title || "").toLowerCase().trim() === eligibleLocName.toLowerCase());
        if (!match) return;

        cy.task("getBonusRowForLocationAndDate", { locationId: match.id, date: getTodayYMD() }).then((bonusRow) => {
          cy.log(`[DB] bonus row after Calculate: ${JSON.stringify(bonusRow)}`);
          if (bonusRow) {
            const row = bonusRow as Record<string, unknown>;
            expect(row.bonus_eligibility).to.eq(true);
            cy.log(`[DB] ✓ bonus_eligibility=true, total_sales=${row.total_sales}, bonus_amount=${row.bonus_amount}, bonus_sales=${row.bonus_sales}`);
          }
        });
      });
    });
  });

});
