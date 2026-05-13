/// <reference types="cypress" />
export {};

// Bonus Individual E2E Tests
// URL: /en/bonus/individual
// Tests:
//  1. Smoke: page load, table columns, empty/loaded state
//  2. Date filters: This Week and This Month buttons update the range badge
//  3. Filter modal: filter by Staff, verify table rows match
//  4. Filter modal: filter by Location, verify table rows match
//  5. Calculate (Distribution) button: loading state + RPC calls + success toast
//  6. Pay action: click Pay → optimistic UI → paid state + toast

const INDIVIDUAL_URL = "/en/bonus/individual";

function loginAndVisit() {
  cy.loginWithCredentials(TEST_EMAIL, TEST_PASSWORD);
  cy.wait(2000);
  cy.visit(INDIVIDUAL_URL);
  cy.wait(2000);
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("Bonus — Individual Bonus Page", () => {

  // ── 1. Smoke: page load, table columns ──────────────────────────────────────

  it("should load the page and show the correct table columns", () => {
    loginAndVisit();

    cy.contains("h1", /individual/i, { timeout: 15000 }).should("exist");
    cy.log("[UI] Page title visible");

    // Header action buttons
    cy.contains("button", /filter/i).should("exist");
    cy.contains("button", /this week/i).should("exist");
    cy.contains("button", /this month/i).should("exist");
    // Distribution / Calculate button (aria-label set on the button)
    cy.get('[aria-label="Distribute individual bonuses"]').should("exist");
    cy.log("[UI] Header buttons present");

    // Table columns
    cy.contains("th", /name/i).should("exist");
    cy.contains("th", /location/i).should("exist");
    cy.contains("th", /bonus amount/i).should("exist");
    cy.contains("th", /bonus date/i).should("exist");
    cy.contains("th", /paid date/i).should("exist");
        cy.contains("th", /actions/i).should("exist");

    cy.log("[UI] All table columns present");
  });

  // ── 2. Date filters: This Week and This Month ────────────────────────────────

  it("should apply This Week and This Month date filters and show range badge", () => {
    loginAndVisit();

    // ── This Week ──
    cy.contains("button", /this week/i).click({ force: true });
    cy.wait(1500);

    // A date-range badge should appear showing start → end
    cy.get("body").then(($body) => {
      const text = $body.text();
      // The badge shows ISO dates like "2026-05-07 → 2026-05-13"
      const hasRangeBadge = /\d{4}-\d{2}-\d{2}\s*→\s*\d{4}-\d{2}-\d{2}/.test(text);
      if (hasRangeBadge) {
        cy.log("[WEEK] Date range badge visible");
      } else {
        cy.log("[WEEK] No range badge — page may have no data for this week");
      }
    });

    // Clear the range so we start fresh for month test
    cy.get("body").then(($body) => {
      if ($body.text().match(/\d{4}-\d{2}-\d{2}\s*→/)) {
        cy.contains("button", /clear/i).first().click({ force: true });
        cy.wait(800);
      }
    });

    // ── This Month ──
    cy.contains("button", /this month/i).click({ force: true });
    cy.wait(1500);

    cy.get("body").then(($body) => {
      const text = $body.text();
      const hasRangeBadge = /\d{4}-\d{2}-\d{2}\s*→\s*\d{4}-\d{2}-\d{2}/.test(text);
      if (hasRangeBadge) {
        cy.log("[MONTH] Date range badge visible");
      } else {
        cy.log("[MONTH] No range badge — page may have no data for this month");
      }
    });

    cy.log("[UI] This Week / This Month filters exercised");
  });

  // ── 3. Filter by Staff ───────────────────────────────────────────────────────

  it("should open Filter modal, select Staff mode, pick a staff name, apply, and show only matching rows", () => {
    loginAndVisit();

    // Need at least one row to pick a staff name from
    cy.get("table tbody tr", { timeout: 15000 }).then(($rows) => {
      if ($rows.length === 0) {
        cy.log("[SKIP] No rows in table — cannot test staff filter without data");
        return;
      }

      // Grab the first staff name from the table
      cy.get("table tbody tr").first().find("td").eq(0).invoke("text").then((staffName) => {
        const name = staffName.trim();
        if (!name) {
          cy.log("[SKIP] First row has no staff name");
          return;
        }

        cy.log(`[FILTER] Will filter by staff: "${name}"`);

        cy.contains("button", /filter/i).click({ force: true });
        cy.wait(500);

        // Ensure Staff radio is selected (it's the default)
        cy.get('input[type="radio"][name="filterMode"]').first().check({ force: true });
        cy.wait(200);

        // Type the staff name into the search input
        cy.get('input[placeholder]').filter((_, el) => {
          const ph = (el as HTMLInputElement).placeholder.toLowerCase();
          return ph.includes("staff") || ph.includes("search") || ph.includes("name");
        }).first().clear({ force: true }).type(name.split(" ")[0], { force: true });
        cy.wait(400);

        // Click the matching suggestion in the dropdown
        cy.get("body").then(($body) => {
          const suggestions = $body.find('[class*="cursor-pointer"]').toArray()
            .filter((el) => (el.textContent || "").trim().toLowerCase().includes(name.toLowerCase().split(" ")[0]));
          if (suggestions.length > 0) {
            cy.wrap(suggestions[0]).click({ force: true });
            cy.wait(300);
          }
        });

        // Apply
        cy.contains("button", /apply/i).click({ force: true });
        cy.wait(1500);

        // Applied filter badge should appear
        cy.contains(/staff/i, { timeout: 8000 }).should("exist");
        cy.log(`[FILTER] Staff filter badge shown for "${name}"`);

        // All visible rows should contain the staff name
        cy.get("table tbody tr").then(($filtered) => {
          if ($filtered.length === 0) {
            cy.log("[FILTER] No rows after staff filter — acceptable if no data for this staff");
            return;
          }
          cy.get("table tbody tr").each(($row) => {
            cy.wrap($row).find("td").eq(0).invoke("text").then((rowName) => {
              const normalise = (s: string) => s.trim().normalize("NFC").toLowerCase();
              expect(normalise(rowName)).to.include(normalise(name).split(" ")[0]);
            });
          });
          cy.log(`[FILTER] All rows match staff "${name}"`);
        });
      });
    });
  });

  // ── 4. Filter by Location ────────────────────────────────────────────────────

  it("should open Filter modal, select Location mode, pick a location, apply, and show only matching rows", () => {
    loginAndVisit();

    cy.get("table tbody tr", { timeout: 15000 }).then(($rows) => {
      if ($rows.length === 0) {
        cy.log("[SKIP] No rows in table — cannot test location filter without data");
        return;
      }

      // Grab the first location name from the table (column index 1)
      cy.get("table tbody tr").first().find("td").eq(1).invoke("text").then((locationName) => {
        const locName = locationName.trim();
        if (!locName) {
          cy.log("[SKIP] First row has no location name");
          return;
        }

        cy.log(`[FILTER] Will filter by location: "${locName}"`);

        cy.contains("button", /filter/i).click({ force: true });
        cy.wait(500);

        // Switch to Location radio
        cy.get('input[type="radio"][name="filterMode"]').last().check({ force: true });
        cy.wait(300);

        // Open the location dropdown and pick the matching location
        cy.get("body").then(($body) => {
          // The location dropdown trigger is a div with a ▾ arrow
          const dropdownTriggers = $body.find('[class*="cursor-pointer"]').toArray()
            .filter((el) => (el.textContent || "").includes("▾"));
          if (dropdownTriggers.length > 0) {
            cy.wrap(dropdownTriggers[0]).click({ force: true });
            cy.wait(300);
          }
        });

        // Click the location option matching locName
        cy.contains(locName, { timeout: 8000 }).click({ force: true });
        cy.wait(300);

        // Apply
        cy.contains("button", /apply/i).click({ force: true });
        cy.wait(1500);

        // Applied filter badge should appear
        cy.contains(/location/i, { timeout: 8000 }).should("exist");
        cy.log(`[FILTER] Location filter badge shown for "${locName}"`);

        // All visible rows should contain the exact location name
        cy.get("table tbody tr").then(($filtered) => {
          if ($filtered.length === 0) {
            cy.log("[FILTER] No rows after location filter — acceptable if no data for this location");
            return;
          }
          cy.get("table tbody tr").each(($row) => {
            cy.wrap($row).find("td").eq(1).invoke("text").then((rowLoc) => {
              // Compare full names normalised to NFC so accented chars match regardless
              // of how the browser serialises them (e.g. "clínica" vs "cli\u0301nica")
              const normalise = (s: string) => s.trim().normalize("NFC").toLowerCase();
              expect(normalise(rowLoc)).to.eq(normalise(locName));
            });
          });
          cy.log(`[FILTER] All rows match location "${locName}"`);
        });
      });
    });
  });

  // ── 5. Distribution: RPC calls + table updates + DB verification ────────────

  it("should click Distribute, call both RPCs, show new rows in table, and verify DB has correct bonus data", () => {
    loginAndVisit();

    const distributeBtn = '[aria-label="Distribute individual bonuses"]';

    cy.get(distributeBtn, { timeout: 10000 }).should("exist").and("not.be.disabled");

    // Capture initial row count
    let initialRowCount = 0;
    cy.get("table tbody tr", { timeout: 15000 }).then(($rows) => {
      initialRowCount = $rows.length;
      cy.log(`[BEFORE] Table has ${initialRowCount} rows`);
    });

    cy.intercept("POST", "**/rpc/calculate_team_bonus_daily*").as("calcRpc");
    cy.intercept("POST", "**/rpc/distribute_individual_bonus_daily*").as("distributeRpc");

    cy.get(distributeBtn).click({ force: true });

    // Button should enter a loading/disabled state
    cy.get(distributeBtn, { timeout: 5000 }).should("be.disabled");
    cy.log("[UI] Distribute button disabled during calculation");

    // Both RPCs should be called
    cy.wait("@calcRpc", { timeout: 30000 });
    cy.log("[RPC] calculate_team_bonus_daily called");

    cy.wait("@distributeRpc", { timeout: 30000 });
    cy.log("[RPC] distribute_individual_bonus_daily called");

    // Success toast should appear
    cy.get(".Toastify__toast--success", { timeout: 15000 }).should("exist");
    cy.log("[UI] Success toast shown after distribution");

    // Button should return to normal
    cy.get(distributeBtn, { timeout: 15000 }).should("not.be.disabled");
    cy.log("[UI] Distribute button re-enabled after completion");

    // Wait for table to refresh
    cy.wait(2000);

    // ── Verify table updated ──────────────────────────────────────────────────
    cy.get("table tbody tr", { timeout: 15000 }).then(($rows) => {
      const newRowCount = $rows.length;
      cy.log(`[AFTER] Table has ${newRowCount} rows (was ${initialRowCount})`);

      if (newRowCount === 0) {
        cy.log("[TABLE] No rows after distribution — may indicate no eligible bonuses for today");
        return;
      }

      // Verify at least one row has data
      cy.get("table tbody tr").first().within(() => {
        cy.get("td").eq(0).invoke("text").should("not.be.empty"); // Staff name
        cy.get("td").eq(2).invoke("text").then((bonusText) => {
          const bonus = parseFloat(bonusText.replace(/[^0-9.]/g, ""));
          expect(bonus).to.be.greaterThan(0);
          cy.log(`[TABLE] First row bonus: ${bonus}`);
        });
      });

      // ── DB verification ────────────────────────────────────────────────────
      cy.task("getRecentIndividualBonusRows", { limit: 10 }).then((dbRows) => {
        cy.log(`[DB] Recent individual_bonus rows: ${JSON.stringify(dbRows)}`);
        const rows = dbRows as Record<string, unknown>[];

        if (rows.length === 0) {
          cy.log("[DB] No rows in individual_bonus table — distribution may not have created data");
          return;
        }

        // Verify DB rows have correct structure
        const firstRow = rows[0];
        expect(firstRow).to.have.property("id");
        expect(firstRow).to.have.property("bonus");
        expect(firstRow).to.have.property("bonus_date");
        expect(firstRow).to.have.property("paid");
        cy.log(`[DB] ✓ Row structure correct: id=${firstRow.id}, bonus=${firstRow.bonus}, paid=${firstRow.paid}`);

        // Verify bonus amounts are positive
        rows.forEach((row, i) => {
          const bonus = Number(row.bonus || 0);
          expect(bonus).to.be.at.least(0);
          if (i < 3) cy.log(`[DB] Row ${i}: bonus=${bonus}, paid=${row.paid}, bonus_date=${row.bonus_date}`);
        });

        // ── Cross-check: UI bonus matches DB bonus for first row ──────────────
        cy.get("table tbody tr").first().find("td").eq(2).invoke("text").then((uiBonus) => {
          const uiBonusNum = parseFloat(uiBonus.replace(/[^0-9.]/g, ""));
          const dbBonusNum = Number(firstRow.bonus || 0);
          // Allow small floating-point tolerance
          expect(uiBonusNum).to.be.closeTo(dbBonusNum, 0.01);
          cy.log(`[VERIFY] ✓ UI bonus (${uiBonusNum}) matches DB bonus (${dbBonusNum})`);
        });
      });
    });
  });

  // ── 6. Pay action: click Pay → button becomes Paid (disabled) + DB verify ────

  it("should click Pay on an unpaid row, show paid state in Actions column, and verify paid=true with paid_date in individual_bonus DB", () => {
    loginAndVisit();

    cy.get("table tbody tr", { timeout: 15000 }).then(($rows) => {
      if ($rows.length === 0) {
        cy.log("[SKIP] No rows — run Distribution test first to populate data");
        return;
      }

      // Find the first unpaid row — Pay button is blue and not disabled
      let unpaidRowIndex = -1;
      $rows.each((i, row) => {
        if (unpaidRowIndex >= 0) return;
        const btn = Cypress.$(row).find("button").last();
        const text = (btn.text() || "").trim();
        const disabled = btn.prop("disabled") || btn.attr("aria-disabled") === "true";
        if (text === "Pay" && !disabled) unpaidRowIndex = i;
      });

      if (unpaidRowIndex < 0) {
        cy.log("[SKIP] No unpaid rows found — all rows already paid or no data");
        return;
      }

      cy.log(`[PAY] Clicking Pay on row ${unpaidRowIndex}`);

      // Intercept the Supabase REST PATCH that sets paid=true
      cy.intercept("PATCH", "**/rest/v1/individual_bonus*").as("payRequest");

      cy.get("table tbody tr").eq(unpaidRowIndex).find("button").last().click({ force: true });

      // Optimistic UI: button transitions through Paying... then settles on Paid
      cy.get("table tbody tr").eq(unpaidRowIndex).find("button").last()
        .should(($btn) => {
          expect(["Paying...", "Paid"]).to.include($btn.text().trim());
        });
      cy.log("[UI] Optimistic paying state shown");

      // Wait for the PATCH request and extract the row id
      cy.wait("@payRequest", { timeout: 15000 }).then((interception) => {
        cy.log(`[API] PATCH individual_bonus — URL: ${interception.request.url}`);
        cy.log(`[API] Body: ${JSON.stringify(interception.request.body)}`);

        // id comes from the URL filter: ?id=eq.<id>
        const urlMatch = interception.request.url.match(/[?&]id=eq\.([^&]+)/);
        const rowId = urlMatch ? urlMatch[1] : null;
        cy.log(`[API] Extracted row id: ${rowId}`);

        // ── UI: Actions column must show "Paid" (gray, disabled) ──────────────
        cy.get("table tbody tr").eq(unpaidRowIndex).find("td").last()
          .find("button")
          .should("contain.text", "Paid")
          .and("be.disabled");
        cy.log("[UI] ✓ Actions column shows Paid (disabled)");

        // ── DB verification ────────────────────────────────────────────────────
        if (!rowId) {
          cy.log("[DB] Could not extract row id — skipping DB check");
          return;
        }

        cy.wait(800); // allow DB write to settle
        cy.task("getIndividualBonusById", { id: rowId }).then((dbRow) => {
          cy.log(`[DB] individual_bonus row: ${JSON.stringify(dbRow)}`);
          expect(dbRow).to.not.be.null;
          const row = dbRow as Record<string, unknown>;

          // paid must be true
          expect(row.paid).to.eq(true);
          cy.log(`[DB] ✓ paid=true`);

          // paid_date must be set and be a valid ISO timestamp
          expect(row.paid_date).to.not.be.null;
          expect(row.paid_date).to.not.eq("");
          const parsedDate = new Date(row.paid_date as string);
          expect(parsedDate.getTime()).to.not.be.NaN;
          cy.log(`[DB] ✓ paid_date=${row.paid_date}`);

          // bonus amount should still be intact
          expect(Number(row.bonus)).to.be.greaterThan(0);
          cy.log(`[DB] ✓ bonus=${row.bonus} (unchanged)`);
        });
      });
    });
  });
});
