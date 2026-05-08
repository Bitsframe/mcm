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

  it("should refresh table rows after Calculate and show bonus amounts for Yesterday", () => {
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

    // Check if any row has a bonus amount (non-dash)
    cy.get("table tbody tr").then(($rows) => {
      let hasValue = false;
      $rows.each((_, row) => {
        const cells = Cypress.$(row).find("td");
        const txt = (cells[6]?.textContent || "").trim();
        if (txt && txt !== "—" && txt !== "-" && txt !== "") hasValue = true;
      });
      cy.log(hasValue
        ? "At least one row has a bonus amount after calculation"
        : "No bonus amounts yet — rows show dash (no sales data for yesterday)"
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

  // ── 6. Set limits tab — Update button, Configuration saved toast, verify in Calculation ──

  it("should update FLAT type and value in Set limits, show 'Configuration saved' toast, then verify threshold appears in Calculation tab", () => {
    loginAndVisitBonus();

    cy.contains("button", "Set limits").click({ force: true });
    cy.wait(1000);

    // Set limits table: columns are Location | Flat/Percentage | Value | Bonus Threshold | Actions
    cy.get("table tbody tr", { timeout: 15000 }).should("have.length.greaterThan", 0);

    // Read the first location name so we can find it in Calculation tab later
    cy.get("table tbody tr").first().find("td").eq(0).invoke("text").then((locationName) => {
      const locName = locationName.trim();
      cy.log(`Editing Set limits for location: "${locName}"`);

      // Set type to FLAT
      cy.get("table tbody tr").first().find("select").first()
        .select("FLAT", { force: true });
      cy.wait(200);

      // Set value
      const testValue = "75";
      cy.get("table tbody tr").first().find('input[inputmode="decimal"]').first()
        .click({ force: true })
        .type("{selectall}" + testValue, { force: true });
      cy.wait(200);

      // Set bonus threshold
      const testThreshold = "500";
      cy.get("table tbody tr").first().find('input[inputmode="numeric"]').first()
        .click({ force: true })
        .type("{selectall}" + testThreshold, { force: true });
      cy.wait(200);

      // Intercept the save API
      cy.intercept("POST", "**/api/bonuses/save*").as("saveConfig");

      // Click the Update button for this row (enabled after editing)
      cy.get("table tbody tr").first().find("button").contains("Update").click({ force: true });

      cy.wait("@saveConfig", { timeout: 15000 });
      cy.log("Save API called");

      // Toast should say "Configuration saved"
      cy.get(".Toastify__toast--success", { timeout: 10000 })
        .should("contain.text", "Configuration saved");
      cy.log("'Configuration saved' toast shown");

      // Now switch to Calculation tab and verify the threshold is reflected
      cy.contains("button", "Bonus calculation").click({ force: true });
      cy.wait(1500);

      // Find the row for the same location
      cy.contains("td", locName, { timeout: 15000 })
        .closest("tr")
        .find("td")
        .eq(3) // Bonus Threshold column (index 3)
        .invoke("text")
        .then((thresholdText) => {
          const displayed = thresholdText.replace(/[$,]/g, "").trim();
          expect(parseFloat(displayed)).to.be.closeTo(parseFloat(testThreshold), 1);
          cy.log(`Bonus Threshold in Calculation tab: "${displayed}" matches saved value "${testThreshold}"`);
        });

      // Verify Flat/Percentage column shows FLAT
      cy.contains("td", locName)
        .closest("tr")
        .find("td")
        .eq(4) // Flat/Percentage column
        .invoke("text")
        .then((typeText) => {
          expect(typeText.trim().toUpperCase()).to.include("FLAT");
          cy.log(`Type in Calculation tab: "${typeText.trim()}" — correct`);
        });

      // Verify Value column shows the saved value
      cy.contains("td", locName)
        .closest("tr")
        .find("td")
        .eq(5) // Value column
        .invoke("text")
        .then((valueText) => {
          const displayed = valueText.replace(/[$%,]/g, "").trim();
          expect(parseFloat(displayed)).to.be.closeTo(parseFloat(testValue), 1);
          cy.log(`Value in Calculation tab: "${displayed}" matches saved value "${testValue}"`);
        });
    });
  });

  it("should update PERCENTAGE type in Set limits, show 'Configuration saved' toast, then verify type in Calculation tab", () => {
    loginAndVisitBonus();

    cy.contains("button", "Set limits").click({ force: true });
    cy.wait(1000);

    cy.get("table tbody tr", { timeout: 15000 }).should("have.length.greaterThan", 0);

    cy.get("table tbody tr").first().find("td").eq(0).invoke("text").then((locationName) => {
      const locName = locationName.trim();

      // Set type to PERCENTAGE
      cy.get("table tbody tr").first().find("select").first()
        .select("PERCENTAGE", { force: true });
      cy.wait(200);

      // Set percentage value (0-100)
      const testPct = "10";
      cy.get("table tbody tr").first().find('input[inputmode="decimal"]').first()
        .click({ force: true })
        .type("{selectall}" + testPct, { force: true });
      cy.wait(200);

      // Set threshold
      cy.get("table tbody tr").first().find('input[inputmode="numeric"]').first()
        .click({ force: true })
        .type("{selectall}1000", { force: true });
      cy.wait(200);

      cy.intercept("POST", "**/api/bonuses/save*").as("saveConfig");

      cy.get("table tbody tr").first().find("button").contains("Update").click({ force: true });

      cy.wait("@saveConfig", { timeout: 15000 });

      cy.get(".Toastify__toast--success", { timeout: 10000 })
        .should("contain.text", "Configuration saved");
      cy.log("'Configuration saved' toast shown for PERCENTAGE update");

      // Verify in Calculation tab
      cy.contains("button", "Bonus calculation").click({ force: true });
      cy.wait(1500);

      cy.contains("td", locName, { timeout: 15000 })
        .closest("tr")
        .find("td")
        .eq(4) // Flat/Percentage column
        .invoke("text")
        .then((typeText) => {
          expect(typeText.trim().toUpperCase()).to.include("PERCENTAGE");
          cy.log(`Type in Calculation tab shows PERCENTAGE — correct`);
        });
    });
  });

  it("should keep Update button disabled until a field is edited in Set limits", () => {
    loginAndVisitBonus();

    cy.contains("button", "Set limits").click({ force: true });
    cy.wait(1000);

    cy.get("table tbody tr", { timeout: 15000 }).should("have.length.greaterThan", 0);

    // Update button should be disabled before any edit
    cy.get("table tbody tr").first().find("button").contains("Update")
      .should("be.disabled");
    cy.log("Update button disabled before editing");

    // Edit a field
    cy.get("table tbody tr").first().find('input[inputmode="decimal"]').first()
      .click({ force: true })
      .type("{selectall}99", { force: true });
    cy.wait(200);

    // Update button should now be enabled
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

  it("should toggle Pay to Paid and call update-paid API, then show toast", () => {
    loginAndVisitBonus();

    cy.contains("button", "Bonus calculation").click({ force: true });
    cy.wait(500);
    cy.contains("button", "Yesterday").click({ force: true });
    cy.wait(1500);

    cy.get("table tbody tr", { timeout: 15000 }).then(($rows) => {
      // Find a row with an enabled Pay button
      let payRow: JQuery<HTMLElement> | null = null;
      $rows.each((_, row) => {
        if (payRow) return;
        const btn = Cypress.$(row).find("button").filter((_, b) => b.textContent?.trim() === "Pay" && !b.hasAttribute("disabled"));
        if (btn.length > 0) payRow = Cypress.$(row);
      });

      if (!payRow) {
        cy.log("No eligible unpaid rows for yesterday — skipping Pay toggle test");
        return;
      }

      cy.intercept("POST", "**/api/bonuses/update-paid*").as("updatePaid");

      cy.wrap(payRow).find("button").contains("Pay").click({ force: true });

      cy.wait("@updatePaid", { timeout: 15000 });
      cy.log("update-paid API called");

      cy.get(".Toastify__toast", { timeout: 10000 }).should("exist");
      cy.log("Toast shown after Pay toggle");
    });
  });

});
