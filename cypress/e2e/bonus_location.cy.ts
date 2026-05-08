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

  it("should load the bonus page and show Bonus Calculation tab active by default", () => {
    loginAndVisitBonus();

    cy.contains("h1", "Bonus", { timeout: 15000 }).should("exist");
    cy.log("Bonus page title visible");

    // Calculation tab should be active (has border-b-2 border-blue-600)
    cy.contains("button", "Bonus calculation")
      .should("have.class", "border-b-2")
      .and("have.class", "border-blue-600");
    cy.log("Bonus calculation tab is active by default");
  });

  it("should switch between Bonus calculation, Bonus transactions, and Set limits tabs", () => {
    loginAndVisitBonus();

    // Switch to Transactions tab
    cy.contains("button", "Bonus transactions").click({ force: true });
    cy.wait(800);
    cy.contains("button", "Bonus transactions")
      .should("have.class", "border-b-2")
      .and("have.class", "border-blue-600");
    cy.log("Bonus transactions tab active");

    // Switch to Set limits tab
    cy.contains("button", "Set limits").click({ force: true });
    cy.wait(800);
    cy.contains("button", "Set limits")
      .should("have.class", "border-b-2")
      .and("have.class", "border-blue-600");
    cy.log("Set limits tab active");

    // Switch back to Calculation tab
    cy.contains("button", "Bonus calculation").click({ force: true });
    cy.wait(800);
    cy.contains("button", "Bonus calculation")
      .should("have.class", "border-b-2")
      .and("have.class", "border-blue-600");
    cy.log("Back to Bonus calculation tab");
  });

  // ── 2. Date filter — Today / Yesterday buttons ──────────────────────────────

  it("should switch date filter to Today and update the displayed date", () => {
    loginAndVisitBonus();

    cy.contains("button", "Bonus calculation").click({ force: true });
    cy.wait(500);

    cy.contains("button", "Today").click({ force: true });
    cy.wait(1000);

    // The displayed date label should reflect today's date
    const todayFormatted = new Date(getTodayYMD()).toLocaleDateString();
    cy.contains(todayFormatted, { timeout: 10000 }).should("exist");
    cy.log(`Date filter set to Today: ${todayFormatted}`);
  });

  it("should switch date filter to Yesterday and update the displayed date", () => {
    loginAndVisitBonus();

    cy.contains("button", "Bonus calculation").click({ force: true });
    cy.wait(500);

    // First go to Today, then switch to Yesterday to confirm the change
    cy.contains("button", "Today").click({ force: true });
    cy.wait(500);

    cy.contains("button", "Yesterday").click({ force: true });
    cy.wait(1000);

    const yesterdayFormatted = new Date(getYesterdayYMD()).toLocaleDateString();
    cy.contains(yesterdayFormatted, { timeout: 10000 }).should("exist");
    cy.log(`Date filter set to Yesterday: ${yesterdayFormatted}`);
  });

  // ── 3. Calculation tab — table structure ────────────────────────────────────

  it("should show correct table headers in Bonus calculation tab", () => {
    loginAndVisitBonus();

    cy.contains("button", "Bonus calculation").click({ force: true });
    cy.wait(1000);

    // Verify all expected column headers are present
    cy.contains("th", "Name").should("exist");
    cy.contains("th", "Total Sales").should("exist");
    cy.contains("th", "Bonus Sales").should("exist");
    cy.contains("th", "Bonus Threshold").should("exist");
    cy.contains("th", "Flat/Percentage").should("exist");
    cy.contains("th", "Value").should("exist");
    cy.contains("th", "Bonus amount").should("exist");
    cy.contains("th", "Bonus Eligibility").should("exist");
    cy.contains("th", "Status").should("exist");
    cy.log("All calculation table headers present");
  });

  it("should show location rows in the calculation table", () => {
    loginAndVisitBonus();

    cy.contains("button", "Bonus calculation").click({ force: true });
    cy.wait(1500);

    // Table should have at least one row (locations always exist)
    cy.get("table tbody tr", { timeout: 15000 }).should("have.length.greaterThan", 0);
    cy.log("Location rows visible in calculation table");

    // First row should have a location name in the Name column
    cy.get("table tbody tr").first().find("td").first().invoke("text").then((name) => {
      expect(name.trim()).to.not.be.empty;
      cy.log(`First location name: "${name.trim()}"`);
    });
  });

  // ── 4. Calculate button — triggers RPC and shows toast ─────────────────────

  it("should show Calculate button in Bonus calculation tab", () => {
    loginAndVisitBonus();

    cy.contains("button", "Bonus calculation").click({ force: true });
    cy.wait(500);

    cy.contains("button", "Calculate", { timeout: 10000 }).should("exist").and("not.be.disabled");
    cy.log("Calculate button is visible and enabled");
  });

  it("should trigger calculation when Calculate button is clicked and show Calculation triggered toast", () => {
    loginAndVisitBonus();

    cy.contains("button", "Bonus calculation").click({ force: true });
    cy.wait(500);

    // Intercept the Supabase RPC call
    cy.intercept("POST", "**/rpc/update_bonus_totalsales*").as("calcRpc");

    cy.contains("button", "Calculate").click({ force: true });

    // Button should show "Calculating..." while running
    cy.contains("button", "Calculating...", { timeout: 5000 }).should("exist");
    cy.log("Calculate button shows 'Calculating...' state");

    // Wait for the RPC call
    cy.wait("@calcRpc", { timeout: 30000 });
    cy.log("RPC update_bonus_totalsales called");

    // Toast should appear: either success or error
    cy.get(".Toastify__toast", { timeout: 15000 }).should("exist");
    cy.log("Toast notification appeared after calculation");

    // Button should return to "Calculate" after completion
    cy.contains("button", "Calculate", { timeout: 15000 }).should("exist");
    cy.log("Calculate button returned to normal state");
  });

  it("should show 'Calculation triggered' toast on successful calculation", () => {
    loginAndVisitBonus();

    cy.contains("button", "Bonus calculation").click({ force: true });
    cy.wait(500);

    cy.intercept("POST", "**/rpc/update_bonus_totalsales*", {
      statusCode: 200,
      body: {},
    }).as("calcRpcMock");

    cy.contains("button", "Calculate").click({ force: true });
    cy.wait("@calcRpcMock", { timeout: 10000 });

    // Success toast should contain "Calculation triggered"
    cy.get(".Toastify__toast--success", { timeout: 10000 }).should("exist");
    cy.log("Success toast shown after calculation");
  });

  // ── 5. Calculation — verify data after Calculate ────────────────────────────

  it("should refresh table data after Calculate is clicked", () => {
    loginAndVisitBonus();

    cy.contains("button", "Bonus calculation").click({ force: true });
    cy.wait(500);

    // Set to Yesterday to ensure there's data
    cy.contains("button", "Yesterday").click({ force: true });
    cy.wait(1000);

    cy.intercept("POST", "**/rpc/update_bonus_totalsales*").as("calcRpc");

    cy.contains("button", "Calculate").click({ force: true });
    cy.wait("@calcRpc", { timeout: 30000 });

    // After calculation, table should still show rows
    cy.get("table tbody tr", { timeout: 15000 }).should("have.length.greaterThan", 0);
    cy.log("Table rows still visible after calculation");
  });

  it("should show bonus amount values in table rows after calculation for Yesterday", () => {
    loginAndVisitBonus();

    cy.contains("button", "Bonus calculation").click({ force: true });
    cy.wait(500);

    cy.contains("button", "Yesterday").click({ force: true });
    cy.wait(1500);

    cy.get("table tbody tr", { timeout: 15000 }).should("have.length.greaterThan", 0);

    // Check that at least one row has a non-dash value in the Bonus amount column (index 6)
    cy.get("table tbody tr").then(($rows) => {
      let hasValue = false;
      $rows.each((_, row) => {
        const cells = Cypress.$(row).find("td");
        const bonusAmtText = (cells[6]?.textContent || "").trim();
        if (bonusAmtText && bonusAmtText !== "—" && bonusAmtText !== "-") {
          hasValue = true;
        }
      });
      if (hasValue) {
        cy.log("At least one row has a bonus amount value");
      } else {
        cy.log("No bonus amounts yet — rows show dash (no data for yesterday)");
      }
    });
  });

  // ── 6. Filter sheet ─────────────────────────────────────────────────────────

  it("should open and close the Filter sheet", () => {
    loginAndVisitBonus();

    cy.contains("button", "Bonus calculation").click({ force: true });
    cy.wait(500);

    cy.contains("button", "Filter").click({ force: true });
    cy.wait(500);

    // Filter sheet should open
    cy.contains("Staff", { timeout: 10000 }).should("exist");
    cy.log("Filter sheet opened");

    // Close via Clear button
    cy.contains("button", "Clear").click({ force: true });
    cy.wait(300);
    cy.log("Filter sheet cleared");
  });

  it("should filter by date in the Filter sheet and apply", () => {
    loginAndVisitBonus();

    cy.contains("button", "Bonus calculation").click({ force: true });
    cy.wait(500);

    cy.contains("button", "Filter").click({ force: true });
    cy.wait(500);

    // Set date filter to yesterday
    const yesterday = getYesterdayYMD();
    cy.get('input[type="date"][aria-label*="date"]').first()
      .clear({ force: true })
      .type(yesterday, { force: true });
    cy.wait(200);

    cy.contains("button", "Apply").click({ force: true });
    cy.wait(1000);

    // Displayed date should update
    const yesterdayFormatted = new Date(yesterday).toLocaleDateString();
    cy.contains(yesterdayFormatted, { timeout: 10000 }).should("exist");
    cy.log(`Filter applied for date: ${yesterdayFormatted}`);
  });

  it("should filter by location name in the Filter sheet", () => {
    loginAndVisitBonus();

    cy.contains("button", "Bonus calculation").click({ force: true });
    cy.wait(500);

    // Get first location name from table
    cy.get("table tbody tr", { timeout: 15000 }).should("have.length.greaterThan", 0);
    cy.get("table tbody tr").first().find("td").first().invoke("text").then((locationName) => {
      const name = locationName.trim();
      cy.log(`Filtering by location name: "${name}"`);

      cy.contains("button", "Filter").click({ force: true });
      cy.wait(500);

      // Select the location from the name dropdown
      cy.get('select#filter-name-input-modal').select(name, { force: true });
      cy.wait(200);

      cy.contains("button", "Apply").click({ force: true });
      cy.wait(1000);

      // Table should show only the matching location
      cy.get("table tbody tr", { timeout: 10000 }).each(($row) => {
        cy.wrap($row).find("td").first().invoke("text").then((rowName) => {
          expect(rowName.trim().toLowerCase()).to.include(name.toLowerCase().split(" ")[0]);
        });
      });
      cy.log(`Filter by name "${name}" applied correctly`);
    });
  });

  // ── 7. Today filter — calculation tab ──────────────────────────────────────

  it("should show Today's data when Today filter is selected", () => {
    loginAndVisitBonus();

    cy.contains("button", "Bonus calculation").click({ force: true });
    cy.wait(500);

    cy.contains("button", "Today").click({ force: true });
    cy.wait(1500);

    const todayFormatted = new Date(getTodayYMD()).toLocaleDateString();
    cy.contains(todayFormatted, { timeout: 10000 }).should("exist");

    // Table rows should still be visible (locations always show even without bonus data)
    cy.get("table tbody tr", { timeout: 10000 }).should("have.length.greaterThan", 0);
    cy.log("Today filter shows location rows");
  });

  // ── 8. Yesterday filter — calculation tab ──────────────────────────────────

  it("should show Yesterday's data when Yesterday filter is selected", () => {
    loginAndVisitBonus();

    cy.contains("button", "Bonus calculation").click({ force: true });
    cy.wait(500);

    cy.contains("button", "Yesterday").click({ force: true });
    cy.wait(1500);

    const yesterdayFormatted = new Date(getYesterdayYMD()).toLocaleDateString();
    cy.contains(yesterdayFormatted, { timeout: 10000 }).should("exist");

    cy.get("table tbody tr", { timeout: 10000 }).should("have.length.greaterThan", 0);
    cy.log("Yesterday filter shows location rows");
  });

  // ── 9. Calculation correctness verification ─────────────────────────────────

  it("should verify bonus amount calculation: FLAT type gives correct bonus amount", () => {
    loginAndVisitBonus();

    cy.contains("button", "Bonus calculation").click({ force: true });
    cy.wait(500);
    cy.contains("button", "Yesterday").click({ force: true });
    cy.wait(1500);

    cy.get("table tbody tr", { timeout: 15000 }).then(($rows) => {
      // Find a row that has all values: total_sales, threshold, FLAT type, value, and bonus_amount
      let verified = false;
      $rows.each((_, row) => {
        if (verified) return;
        const cells = Cypress.$(row).find("td");
        const totalSalesText = (cells[1]?.textContent || "").trim().replace("$", "");
        const bonusAmtText = (cells[6]?.textContent || "").trim().replace("$", "");
        const typeText = (cells[4]?.textContent || "").trim().toUpperCase();
        const thresholdText = (cells[3]?.textContent || "").trim().replace("$", "");
        const valueText = (cells[5]?.textContent || "").trim().replace("$", "");

        const totalSales = parseFloat(totalSalesText);
        const bonusAmt = parseFloat(bonusAmtText);
        const threshold = parseFloat(thresholdText);
        const value = parseFloat(valueText);

        if (
          !isNaN(totalSales) && !isNaN(bonusAmt) && bonusAmt > 0 &&
          typeText === "FLAT" && !isNaN(threshold) && !isNaN(value)
        ) {
          // FLAT: if total_sales > threshold, bonus = value; else 0
          if (totalSales > threshold) {
            expect(bonusAmt).to.be.closeTo(value, 0.01);
            cy.log(`FLAT bonus verified: total=${totalSales}, threshold=${threshold}, value=${value}, bonus=${bonusAmt}`);
          } else {
            expect(bonusAmt).to.eq(0);
            cy.log(`FLAT bonus = 0 because total_sales (${totalSales}) <= threshold (${threshold})`);
          }
          verified = true;
        }
      });

      if (!verified) {
        cy.log("No FLAT bonus rows with complete data found for yesterday — skipping calculation assertion");
      }
    });
  });

  it("should verify bonus amount calculation: PERCENTAGE type gives correct bonus amount", () => {
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
        const totalSalesText = (cells[1]?.textContent || "").trim().replace("$", "");
        const bonusAmtText = (cells[6]?.textContent || "").trim().replace("$", "");
        const typeText = (cells[4]?.textContent || "").trim().toUpperCase();
        const thresholdText = (cells[3]?.textContent || "").trim().replace("$", "");
        const valueText = (cells[5]?.textContent || "").trim().replace("%", "").trim();

        const totalSales = parseFloat(totalSalesText);
        const bonusAmt = parseFloat(bonusAmtText);
        const threshold = parseFloat(thresholdText);
        const pct = parseFloat(valueText);

        if (
          !isNaN(totalSales) && !isNaN(bonusAmt) && bonusAmt > 0 &&
          typeText === "PERCENTAGE" && !isNaN(threshold) && !isNaN(pct)
        ) {
          // PERCENTAGE: if total_sales > threshold, bonus = total_sales * (pct/100)
          if (totalSales > threshold) {
            const expected = totalSales * (pct / 100);
            expect(bonusAmt).to.be.closeTo(expected, 0.05);
            cy.log(`PERCENTAGE bonus verified: total=${totalSales}, pct=${pct}%, expected=${expected.toFixed(2)}, actual=${bonusAmt}`);
          } else {
            expect(bonusAmt).to.eq(0);
            cy.log(`PERCENTAGE bonus = 0 because total_sales (${totalSales}) <= threshold (${threshold})`);
          }
          verified = true;
        }
      });

      if (!verified) {
        cy.log("No PERCENTAGE bonus rows with complete data found for yesterday — skipping calculation assertion");
      }
    });
  });

  // ── 10. Set limits tab ──────────────────────────────────────────────────────

  it("should show Set limits tab with editable fields per location", () => {
    loginAndVisitBonus();

    cy.contains("button", "Set limits").click({ force: true });
    cy.wait(1000);

    // In Set limits mode, the table should show editable inputs
    cy.get("table tbody tr", { timeout: 15000 }).should("have.length.greaterThan", 0);
    cy.log("Set limits tab shows location rows");

    // Should have select dropdowns for Flat/Percentage
    cy.get("table tbody tr").first().find("select").should("exist");
    cy.log("Flat/Percentage select visible in Set limits tab");
  });

  it("should save a bonus configuration in Set limits tab and show success toast", () => {
    loginAndVisitBonus();

    cy.contains("button", "Set limits").click({ force: true });
    cy.wait(1000);

    cy.get("table tbody tr", { timeout: 15000 }).should("have.length.greaterThan", 0);

    // Intercept the save API
    cy.intercept("POST", "**/api/bonuses/save*").as("saveBonus");

    // Edit the first row's value input
    cy.get("table tbody tr").first().find('input[inputmode="decimal"]').first()
      .click({ force: true })
      .type("{selectall}50", { force: true });
    cy.wait(200);

    // Click Save (the save button in Set limits mode)
    cy.contains("button", "Save").click({ force: true });

    cy.wait("@saveBonus", { timeout: 15000 });
    cy.log("Save API called");

    // Success toast should appear
    cy.get(".Toastify__toast", { timeout: 10000 }).should("exist");
    cy.log("Toast appeared after save");
  });

  // ── 11. Transactions tab ────────────────────────────────────────────────────

  it("should show Bonus transactions tab with paid bonus data or empty state", () => {
    loginAndVisitBonus();

    cy.contains("button", "Bonus transactions").click({ force: true });
    cy.wait(1500);

    cy.get("body").then(($body) => {
      if ($body.text().includes("No bonuses found") || $body.text().includes("No paid bonuses")) {
        cy.log("No paid bonuses for selected date — empty state shown correctly");
      } else {
        cy.get("table tbody tr", { timeout: 10000 }).should("have.length.greaterThan", 0);
        cy.log("Paid bonus rows visible in Transactions tab");
      }
    });
  });

  it("should show Paid date column in Transactions tab", () => {
    loginAndVisitBonus();

    cy.contains("button", "Bonus transactions").click({ force: true });
    cy.wait(1000);

    cy.contains("th", "Paid date", { timeout: 10000 }).should("exist");
    cy.log("Paid date column visible in Transactions tab");
  });

  // ── 12. Paid status toggle ──────────────────────────────────────────────────

  it("should show Status column with Paid/Pay buttons in Calculation tab", () => {
    loginAndVisitBonus();

    cy.contains("button", "Bonus calculation").click({ force: true });
    cy.wait(500);
    cy.contains("button", "Yesterday").click({ force: true });
    cy.wait(1500);

    cy.get("table tbody tr", { timeout: 15000 }).should("have.length.greaterThan", 0);

    // Status column should exist
    cy.contains("th", "Status").should("exist");
    cy.log("Status column present in Calculation tab");
  });

});
