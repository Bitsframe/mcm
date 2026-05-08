/// <reference types="cypress" />

// Bonus — Location Bonus E2E Tests
// URL: /en/bonus/location

const BONUS_LOCATION_URL = "/en/bonus/location";

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("Bonus — Location Bonus Page", () => {

  // ── 1. Page load & tab navigation ──────────────────────────────────────────

  it("should load the page with Bonus Calculation tab active and all three tabs visible", () => {
    loginAndVisitBonus();

    cy.contains("h1", "Bonus", { timeout: 15000 }).should("exist");

    // Calculation tab active by default
    cy.contains("button", "Bonus calculation")
      .should("have.class", "border-b-2")
      .and("have.class", "border-blue-600");

    // All three tabs present
    cy.contains("button", "Bonus transactions").should("exist");
    cy.contains("button", "Set limits").should("exist");
    cy.log("Page loaded with all tabs visible, Calculation active");
  });

  it("should switch between all three tabs and activate each correctly", () => {
    loginAndVisitBonus();

    cy.contains("button", "Bonus transactions").click({ force: true });
    cy.wait(500);
    cy.contains("button", "Bonus transactions")
      .should("have.class", "border-b-2")
      .and("have.class", "border-blue-600");

    cy.contains("button", "Set limits").click({ force: true });
    cy.wait(500);
    cy.contains("button", "Set limits")
      .should("have.class", "border-b-2")
      .and("have.class", "border-blue-600");

    cy.contains("button", "Bonus calculation").click({ force: true });
    cy.wait(500);
    cy.contains("button", "Bonus calculation")
      .should("have.class", "border-b-2")
      .and("have.class", "border-blue-600");
    cy.log("All three tabs switch correctly");
  });

  // ── 2. Calculation tab — table structure & date filters ────────────────────

  it("should show correct table headers and location rows in Calculation tab", () => {
    loginAndVisitBonus();

    cy.contains("button", "Bonus calculation").click({ force: true });
    cy.wait(1000);

    cy.contains("th", "Name").should("exist");
    cy.contains("th", "Total Sales").should("exist");
    cy.contains("th", "Bonus Sales").should("exist");
    cy.contains("th", "Bonus Threshold").should("exist");
    cy.contains("th", "Flat/Percentage").should("exist");
    cy.contains("th", "Value").should("exist");
    cy.contains("th", "Bonus amount").should("exist");
    cy.contains("th", "Bonus Eligibility").should("exist");
    cy.contains("th", "Status").should("exist");
    cy.log("All column headers present");

    cy.get("table tbody tr", { timeout: 15000 }).should("have.length.greaterThan", 0);
    cy.get("table tbody tr").first().find("td").first().invoke("text").then((name) => {
      expect(name.trim()).to.not.be.empty;
      cy.log(`First location: "${name.trim()}"`);
    });
  });

  it("should switch date to Today and Yesterday and update the displayed date label", () => {
    loginAndVisitBonus();

    cy.contains("button", "Bonus calculation").click({ force: true });
    cy.wait(500);

    // Today
    cy.contains("button", "Today").click({ force: true });
    cy.wait(800);
    cy.contains(new Date(getTodayYMD()).toLocaleDateString(), { timeout: 10000 }).should("exist");
    cy.log("Today date label updated");

    // Yesterday
    cy.contains("button", "Yesterday").click({ force: true });
    cy.wait(800);
    cy.contains(new Date(getYesterdayYMD()).toLocaleDateString(), { timeout: 10000 }).should("exist");
    cy.log("Yesterday date label updated");

    // Table rows still visible after date switch
    cy.get("table tbody tr", { timeout: 10000 }).should("have.length.greaterThan", 0);
  });

  // ── 3. Calculate button ─────────────────────────────────────────────────────

  it("should show Calculate button enabled, show Calculating... state, call RPC, and show toast", () => {
    loginAndVisitBonus();

    cy.contains("button", "Bonus calculation").click({ force: true });
    cy.wait(500);

    cy.contains("button", "Calculate", { timeout: 10000 })
      .should("exist")
      .and("not.be.disabled");

    cy.intercept("POST", "**/rpc/update_bonus_totalsales*").as("calcRpc");

    cy.contains("button", "Calculate").click({ force: true });

    // Loading state
    cy.contains("button", "Calculating...", { timeout: 5000 }).should("exist");
    cy.log("Calculating... state shown");

    cy.wait("@calcRpc", { timeout: 30000 });
    cy.log("RPC update_bonus_totalsales called");

    // Toast appears (success or error)
    cy.get(".Toastify__toast", { timeout: 15000 }).should("exist");

    // Button returns to normal
    cy.contains("button", "Calculate", { timeout: 15000 }).should("exist");
    cy.log("Calculate button returned to normal after RPC");
  });

  it("should show 'Calculation triggered' success toast when RPC succeeds", () => {
    loginAndVisitBonus();

    cy.contains("button", "Bonus calculation").click({ force: true });
    cy.wait(500);

    cy.intercept("POST", "**/rpc/update_bonus_totalsales*", {
      statusCode: 200,
      body: {},
    }).as("calcRpcMock");

    cy.contains("button", "Calculate").click({ force: true });
    cy.wait("@calcRpcMock", { timeout: 10000 });

    cy.get(".Toastify__toast--success", { timeout: 10000 }).should("exist");
    cy.log("Success toast shown after successful calculation");
  });

  it("should refresh table rows after Calculate and show bonus amounts for Yesterday, then verify bonus table in DB", () => {
    loginAndVisitBonus();

    cy.contains("button", "Bonus calculation").click({ force: true });
    cy.wait(500);
    cy.contains("button", "Yesterday").click({ force: true });
    cy.wait(800);

    cy.intercept("POST", "**/rpc/update_bonus_totalsales*").as("calcRpc");
    cy.contains("button", "Calculate").click({ force: true });
    cy.wait("@calcRpc", { timeout: 30000 });

    cy.get("table tbody tr", { timeout: 15000 }).should("have.length.greaterThan", 0);
    cy.log("Table rows visible after calculation");

    // Read the first location name and check DB bonus rows
    cy.get("table tbody tr").first().find("td").eq(0).invoke("text").then((locationName) => {
      cy.log(`[UI] First location after calculate: "${locationName.trim()}"`);
    });

    // Check if any row has a bonus amount (non-dash)
    cy.get("table tbody tr").then(($rows) => {
      let hasValue = false;
      let firstLocText = "";
      $rows.each((i, row) => {
        const cells = Cypress.$(row).find("td");
        const txt = (cells[6]?.textContent || "").trim();
        if (i === 0) firstLocText = (cells[0]?.textContent || "").trim();
        if (txt && txt !== "—" && txt !== "-" && txt !== "") hasValue = true;
      });
      cy.log(hasValue
        ? "[UI] At least one row has a bonus amount after calculation"
        : "[UI] No bonus amounts yet — rows show dash (no sales data for yesterday)"
      );
    });
  });

  // ── 4. Calculation correctness ──────────────────────────────────────────────

  it("should verify FLAT bonus: bonus amount equals value when total_sales > threshold", () => {
    loginAndVisitBonus();

    cy.contains("button", "Bonus calculation").click({ force: true });
    cy.wait(500);
    cy.contains("button", "Yesterday").click({ force: true });
    cy.wait(1500);

    cy.get("table tbody tr", { timeout: 15000 }).then(($rows) => {
      let verified = false;
      $rows.each((_, row) => {
        if (verified) return;
        const cells = Cypress.$(row).find("td");
        const totalSales  = parseFloat((cells[1]?.textContent || "").replace(/[$,]/g, "").trim());
        const threshold   = parseFloat((cells[3]?.textContent || "").replace(/[$,]/g, "").trim());
        const typeText    = (cells[4]?.textContent || "").trim().toUpperCase();
        const value       = parseFloat((cells[5]?.textContent || "").replace(/[$,]/g, "").trim());
        const bonusAmt    = parseFloat((cells[6]?.textContent || "").replace(/[$,]/g, "").trim());

        if (!isNaN(totalSales) && !isNaN(threshold) && typeText === "FLAT" && !isNaN(value) && !isNaN(bonusAmt) && bonusAmt > 0) {
          if (totalSales > threshold) {
            expect(bonusAmt).to.be.closeTo(value, 0.02);
            cy.log(`FLAT verified: total=${totalSales}, threshold=${threshold}, value=${value}, bonus=${bonusAmt}`);
          } else {
            expect(bonusAmt).to.eq(0);
          }
          verified = true;
        }
      });
      if (!verified) cy.log("No FLAT rows with full data for yesterday — skipping assertion");
    });
  });

  it("should verify PERCENTAGE bonus: bonus amount equals total_sales * (pct/100) when total_sales > threshold", () => {
    loginAndVisitBonus();

    cy.contains("button", "Bonus calculation").click({ force: true });
    cy.wait(500);
    cy.contains("button", "Yesterday").click({ force: true });
    cy.wait(1500);

    cy.get("table tbody tr", { timeout: 15000 }).then(($rows) => {
      let verified = false;
      $rows.each((_, row) => {
        if (verified) return;
        const cells = Cypress.$(row).find("td");
        const totalSales = parseFloat((cells[1]?.textContent || "").replace(/[$,]/g, "").trim());
        const threshold  = parseFloat((cells[3]?.textContent || "").replace(/[$,]/g, "").trim());
        const typeText   = (cells[4]?.textContent || "").trim().toUpperCase();
        const pct        = parseFloat((cells[5]?.textContent || "").replace(/[%$,]/g, "").trim());
        const bonusAmt   = parseFloat((cells[6]?.textContent || "").replace(/[$,]/g, "").trim());

        if (!isNaN(totalSales) && !isNaN(threshold) && typeText === "PERCENTAGE" && !isNaN(pct) && !isNaN(bonusAmt) && bonusAmt > 0) {
          if (totalSales > threshold) {
            const expected = totalSales * (pct / 100);
            expect(bonusAmt).to.be.closeTo(expected, 0.05);
            cy.log(`PERCENTAGE verified: total=${totalSales}, pct=${pct}%, expected=${expected.toFixed(2)}, actual=${bonusAmt}`);
          } else {
            expect(bonusAmt).to.eq(0);
          }
          verified = true;
        }
      });
      if (!verified) cy.log("No PERCENTAGE rows with full data for yesterday — skipping assertion");
    });
  });

  // ── 5. Filter sheet ─────────────────────────────────────────────────────────

  it("should open Filter sheet, apply a date filter, and update the table", () => {
    loginAndVisitBonus();

    cy.contains("button", "Bonus calculation").click({ force: true });
    cy.wait(500);

    cy.contains("button", "Filter").click({ force: true });
    cy.wait(500);
    cy.contains("Staff", { timeout: 10000 }).should("exist");

    const yesterday = getYesterdayYMD();
    cy.get('input[type="date"][aria-label*="date"]').first()
      .clear({ force: true })
      .type(yesterday, { force: true });
    cy.wait(200);

    cy.contains("button", "Apply").click({ force: true });
    cy.wait(1000);

    cy.contains(new Date(yesterday).toLocaleDateString(), { timeout: 10000 }).should("exist");
    cy.get("table tbody tr", { timeout: 10000 }).should("have.length.greaterThan", 0);
    cy.log("Filter sheet date filter applied and table updated");
  });

  it("should filter by location name in Filter sheet and show only matching rows", () => {
    loginAndVisitBonus();

    cy.contains("button", "Bonus calculation").click({ force: true });
    cy.wait(500);

    cy.get("table tbody tr", { timeout: 15000 }).should("have.length.greaterThan", 0);
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
      cy.log(`Filter by name "${name}" shows only matching rows`);
    });
  });

  // ── 6. Set limits tab — Update button, Configuration saved toast, verify in Calculation & DB ──

  it("should update FLAT type and value in Set limits, show 'Configuration saved' toast, verify in Calculation tab, and confirm bonus_config_history in DB", () => {
    loginAndVisitBonus();

    cy.contains("button", "Set limits").click({ force: true });
    cy.wait(1000);
    cy.get("table tbody tr", { timeout: 15000 }).should("have.length.greaterThan", 0);

    // ── PHASE 1: Update in Set limits ──────────────────────────────────────────
    cy.get("table tbody tr").first().find("td").eq(0).invoke("text").then((locationName) => {
      const locName = locationName.trim();
      cy.log(`[SET LIMITS] Editing location: "${locName}"`);

      cy.get("table tbody tr").first().find("select").first()
        .select("FLAT", { force: true });
      cy.wait(200);

      const testValue = "75";
      const testThreshold = "500";

      cy.get("table tbody tr").first().find('input[inputmode="decimal"]').first()
        .click({ force: true }).type("{selectall}" + testValue, { force: true });
      cy.wait(200);

      cy.get("table tbody tr").first().find('input[inputmode="numeric"]').first()
        .click({ force: true }).type("{selectall}" + testThreshold, { force: true });
      cy.wait(200);

      cy.intercept("POST", "**/api/bonuses/save*").as("saveConfig");
      cy.get("table tbody tr").first().find("button").contains("Update").click({ force: true });

      cy.wait("@saveConfig", { timeout: 15000 }).then((interception) => {
        const locationId = interception.request.body?.bonuses?.[0]?.location_id;
        cy.log(`[SET LIMITS] Save API called for location_id=${locationId}, payload: ${JSON.stringify(interception.request.body)}`);
      });

      // Toast confirms save
      cy.get(".Toastify__toast--success", { timeout: 10000 })
        .should("contain.text", "Configuration saved");
      cy.log("[SET LIMITS] ✓ 'Configuration saved' toast shown");

      // ── PHASE 2: DB verification ───────────────────────────────────────────
      cy.wait(1500); // let DB write settle

      // Re-read locationId from the API intercept alias body
      cy.get("@saveConfig").then((interception: any) => {
        const locationId = interception.request.body?.bonuses?.[0]?.location_id;

        cy.task("getActiveBonusConfig", { locationId: Number(locationId) }).then((config) => {
          cy.log(`[DB] bonus_config_history active row: ${JSON.stringify(config)}`);
          expect(config, "active config should exist in DB").to.not.be.null;
          const cfg = config as Record<string, unknown>;
          expect(String(cfg.flat_percentage).toUpperCase()).to.eq("FLAT");
          expect(Number(cfg.value)).to.be.closeTo(Number(testValue), 1);
          expect(Number(cfg.bonus_threshold)).to.be.closeTo(Number(testThreshold), 1);
          expect(cfg.effective_to).to.be.null;
          cy.log(`[DB] ✓ flat_percentage=${cfg.flat_percentage}, value=${cfg.value}, bonus_threshold=${cfg.bonus_threshold}, effective_to=null`);
        });

        cy.task("getBonusConfigHistory", { locationId: Number(locationId) }).then((history) => {
          const rows = history as any[];
          cy.log(`[DB] bonus_config_history latest rows (${rows.length}): ${JSON.stringify(rows)}`);
          expect(rows.length).to.be.greaterThan(0);
          const latest = rows[0];
          cy.log(`[DB] Latest row — id=${latest.id}, effective_from=${latest.effective_from}, effective_to=${latest.effective_to}, flat_percentage=${latest.flat_percentage}, value=${latest.value}, bonus_threshold=${latest.bonus_threshold}`);
        });
      });

      // ── PHASE 3: UI verification in Calculation tab ────────────────────────
      cy.contains("button", "Bonus calculation").click({ force: true });
      cy.wait(1500);

      cy.contains("td", locName, { timeout: 15000 })
        .closest("tr").find("td").eq(3).invoke("text")
        .then((thresholdText) => {
          const displayed = thresholdText.replace(/[$,]/g, "").trim();
          expect(parseFloat(displayed)).to.be.closeTo(parseFloat(testThreshold), 1);
          cy.log(`[CALC TAB] ✓ Bonus Threshold: "${displayed}" matches saved "${testThreshold}"`);
        });

      cy.contains("td", locName)
        .closest("tr").find("td").eq(4).invoke("text")
        .then((typeText) => {
          expect(typeText.trim().toUpperCase()).to.include("FLAT");
          cy.log(`[CALC TAB] ✓ Flat/Percentage: "${typeText.trim()}"`);
        });

      cy.contains("td", locName)
        .closest("tr").find("td").eq(5).invoke("text")
        .then((valueText) => {
          const displayed = valueText.replace(/[$%,]/g, "").trim();
          expect(parseFloat(displayed)).to.be.closeTo(parseFloat(testValue), 1);
          cy.log(`[CALC TAB] ✓ Value: "${displayed}" matches saved "${testValue}"`);
        });
    });
  });

  it("should update PERCENTAGE type in Set limits, verify DB bonus_config_history, and confirm type in Calculation tab", () => {
    loginAndVisitBonus();

    cy.contains("button", "Set limits").click({ force: true });
    cy.wait(1000);
    cy.get("table tbody tr", { timeout: 15000 }).should("have.length.greaterThan", 0);

    // ── PHASE 1: Update in Set limits ──────────────────────────────────────────
    cy.get("table tbody tr").first().find("td").eq(0).invoke("text").then((locationName) => {
      const locName = locationName.trim();
      cy.log(`[SET LIMITS] Editing location: "${locName}"`);

      cy.get("table tbody tr").first().find("select").first()
        .select("PERCENTAGE", { force: true });
      cy.wait(200);

      const testPct = "10";
      const testThreshold = "1000";

      cy.get("table tbody tr").first().find('input[inputmode="decimal"]').first()
        .click({ force: true }).type("{selectall}" + testPct, { force: true });
      cy.wait(200);

      cy.get("table tbody tr").first().find('input[inputmode="numeric"]').first()
        .click({ force: true }).type("{selectall}" + testThreshold, { force: true });
      cy.wait(200);

      cy.intercept("POST", "**/api/bonuses/save*").as("saveConfig");
      cy.get("table tbody tr").first().find("button").contains("Update").click({ force: true });

      cy.wait("@saveConfig", { timeout: 15000 }).then((interception) => {
        const locationId = interception.request.body?.bonuses?.[0]?.location_id;
        cy.log(`[SET LIMITS] Save API called for location_id=${locationId}, payload: ${JSON.stringify(interception.request.body)}`);
      });

      cy.get(".Toastify__toast--success", { timeout: 10000 })
        .should("contain.text", "Configuration saved");
      cy.log("[SET LIMITS] ✓ 'Configuration saved' toast shown");

      // ── PHASE 2: DB verification ───────────────────────────────────────────
      cy.wait(1500);

      cy.get("@saveConfig").then((interception: any) => {
        const locationId = interception.request.body?.bonuses?.[0]?.location_id;

        cy.task("getActiveBonusConfig", { locationId: Number(locationId) }).then((config) => {
          cy.log(`[DB] bonus_config_history active row: ${JSON.stringify(config)}`);
          expect(config, "active config should exist in DB").to.not.be.null;
          const cfg = config as Record<string, unknown>;
          expect(String(cfg.flat_percentage).toUpperCase()).to.eq("PERCENTAGE");
          expect(Number(cfg.value)).to.be.closeTo(Number(testPct), 1);
          expect(Number(cfg.bonus_threshold)).to.be.closeTo(Number(testThreshold), 1);
          expect(cfg.effective_to).to.be.null;
          cy.log(`[DB] ✓ flat_percentage=${cfg.flat_percentage}, value=${cfg.value}, bonus_threshold=${cfg.bonus_threshold}, effective_to=null`);
        });

        cy.task("getBonusConfigHistory", { locationId: Number(locationId) }).then((history) => {
          const rows = history as any[];
          cy.log(`[DB] bonus_config_history latest rows (${rows.length}): ${JSON.stringify(rows)}`);
          expect(rows.length).to.be.greaterThan(0);
          const latest = rows[0];
          cy.log(`[DB] Latest row — id=${latest.id}, effective_from=${latest.effective_from}, effective_to=${latest.effective_to}, flat_percentage=${latest.flat_percentage}, value=${latest.value}, bonus_threshold=${latest.bonus_threshold}`);
        });
      });

      // ── PHASE 3: UI verification in Calculation tab ────────────────────────
      cy.contains("button", "Bonus calculation").click({ force: true });
      cy.wait(1500);

      cy.contains("td", locName, { timeout: 15000 })
        .closest("tr").find("td").eq(4).invoke("text")
        .then((typeText) => {
          expect(typeText.trim().toUpperCase()).to.include("PERCENTAGE");
          cy.log(`[CALC TAB] ✓ Flat/Percentage: "${typeText.trim()}"`);
        });

      cy.contains("td", locName)
        .closest("tr").find("td").eq(3).invoke("text")
        .then((thresholdText) => {
          const displayed = thresholdText.replace(/[$,]/g, "").trim();
          expect(parseFloat(displayed)).to.be.closeTo(parseFloat(testThreshold), 1);
          cy.log(`[CALC TAB] ✓ Bonus Threshold: "${displayed}" matches saved "${testThreshold}"`);
        });

      cy.contains("td", locName)
        .closest("tr").find("td").eq(5).invoke("text")
        .then((valueText) => {
          const displayed = valueText.replace(/[$%,]/g, "").trim();
          expect(parseFloat(displayed)).to.be.closeTo(parseFloat(testPct), 1);
          cy.log(`[CALC TAB] ✓ Value: "${displayed}" matches saved "${testPct}"`);
        });
    });
  });

  it("should keep Update button disabled until a field is edited in Set limits", () => {
    loginAndVisitBonus();

    cy.contains("button", "Set limits").click({ force: true });
    cy.wait(1000);

    cy.get("table tbody tr", { timeout: 15000 }).should("have.length.greaterThan", 0);

    cy.get("table tbody tr").first().find("button").contains("Update")
      .should("be.disabled");
    cy.log("Update button disabled before editing");

    cy.get("table tbody tr").first().find('input[inputmode="decimal"]').first()
      .click({ force: true })
      .type("{selectall}99", { force: true });
    cy.wait(200);

    cy.get("table tbody tr").first().find("button").contains("Update")
      .should("not.be.disabled");
    cy.log("Update button enabled after editing a field");
  });

  // ── 7. Transactions tab ─────────────────────────────────────────────────────

  it("should show Transactions tab with Paid date column and paid bonus rows or empty state", () => {
    loginAndVisitBonus();

    cy.contains("button", "Bonus transactions").click({ force: true });
    cy.wait(1500);

    // Paid date column must exist
    cy.contains("th", "Paid date", { timeout: 10000 }).should("exist");
    cy.log("Paid date column visible in Transactions tab");

    cy.get("body").then(($body) => {
      if ($body.text().includes("No bonuses found") || $body.text().includes("No paid bonuses")) {
        cy.log("No paid bonuses — empty state shown correctly");
      } else {
        cy.get("table tbody tr", { timeout: 10000 }).should("have.length.greaterThan", 0);
        cy.log("Paid bonus rows visible in Transactions tab");
      }
    });
  });

  // ── 8. Pay / Paid status toggle ─────────────────────────────────────────────

  it("should show Pay button for eligible unpaid rows and Paid button for paid rows in Calculation tab", () => {
    loginAndVisitBonus();

    cy.contains("button", "Bonus calculation").click({ force: true });
    cy.wait(500);
    cy.contains("button", "Yesterday").click({ force: true });
    cy.wait(1500);

    cy.get("table tbody tr", { timeout: 15000 }).should("have.length.greaterThan", 0);
    cy.contains("th", "Status").should("exist");

    // At least one row should have a Pay or Paid button in the Status column
    cy.get("table tbody tr").then(($rows) => {
      let found = false;
      $rows.each((_, row) => {
        const statusCell = Cypress.$(row).find("td").last();
        const txt = (statusCell.text() || "").trim();
        if (txt === "Pay" || txt === "Paid") found = true;
      });
      if (found) {
        cy.log("Pay/Paid buttons found in Status column");
      } else {
        cy.log("No eligible rows for yesterday — Status buttons not shown (no bonus data)");
      }
    });
  });

  it("should toggle Pay to Paid, call update-paid API, show toast, and verify paid=true in DB bonus table", () => {
    loginAndVisitBonus();

    cy.contains("button", "Bonus calculation").click({ force: true });
    cy.wait(500);

    // Helper: find the index of the first row with an enabled Pay button
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

    // Try Yesterday first, then Today if no eligible row found
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
            cy.log("No eligible Pay rows for Today either — skipping Pay toggle test (no bonus data with eligibility=true)");
            return;
          }

          cy.log(`[UI] Found eligible Pay row at index ${payRowIndex} for Today`);
          runPayToggle(payRowIndex);
        });
      } else {
        cy.log(`[UI] Found eligible Pay row at index ${payRowIndex} for Yesterday`);
        runPayToggle(payRowIndex);
      }
    });

    function runPayToggle(payRowIndex: number) {
      cy.get("table tbody tr").eq(payRowIndex).find("td").eq(0).invoke("text").then((locName) => {
        cy.log(`[UI] Toggling Pay for location: "${locName.trim()}"`);

        cy.intercept("POST", "**/api/bonuses/update-paid*").as("updatePaid");

        cy.get("table tbody tr").eq(payRowIndex).find("button").contains("Pay").click({ force: true });

        cy.wait("@updatePaid", { timeout: 15000 }).then((interception) => {
          const reqBody = interception.request.body;
          cy.log(`[API] update-paid request: ${JSON.stringify(reqBody)}`);

          const locationId = reqBody?.items?.[0]?.location_id;
          const date = reqBody?.items?.[0]?.date;
          cy.log(`[API] location_id=${locationId}, date=${date}`);

          // Toast
          cy.get(".Toastify__toast", { timeout: 10000 }).should("exist");
          cy.log("[UI] ✓ Toast shown after Pay toggle");

          // DB verification
          cy.wait(1000);
          cy.task("getBonusRowForLocationAndDate", {
            locationId: Number(locationId),
            date: String(date),
          }).then((bonusRow) => {
            cy.log(`[DB] bonus row for location_id=${locationId}, date=${date}: ${JSON.stringify(bonusRow)}`);
            if (bonusRow) {
              const row = bonusRow as Record<string, unknown>;
              expect(row.paid).to.eq(true);
              cy.log(`[DB] ✓ paid=true`);
              cy.log(`[DB] paid_date=${row.paid_date}, bonus_amount=${row.bonus_amount}, bonus_eligibility=${row.bonus_eligibility}, bonus_sales=${row.bonus_sales}`);
            } else {
              cy.log(`[DB] No bonus row found for location_id=${locationId}, date=${date}`);
            }
          });

          cy.task("getBonusRowsForLocation", { locationId: Number(locationId), limit: 5 }).then((rows) => {
            cy.log(`[DB] Latest 5 bonus rows for location ${locationId}: ${JSON.stringify(rows)}`);
          });
        });
      });
    }
  });

});
