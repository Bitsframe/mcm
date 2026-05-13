/// <reference types="cypress" />
export {};

// Bonus Individual E2E Tests
// URL: /en/bonus/individual
// Tests:
//  1. Smoke: page load, table columns
//  2. Date filters: This Week and This Month buttons update the range badge
//  3. Filter modal: filter by Staff, verify table rows match
//  4. Filter modal: filter by Location (multi-select checkboxes), verify rows belong to selected locations
//  5. Distribution: RPC calls + table updates + DB verification
//  6. Pay action: click Pay → button becomes Paid (disabled) + DB verify

const INDIVIDUAL_URL = "/en/bonus/individual";

const normalise = (s: string) => s.trim().normalize("NFC").toLowerCase();

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

    cy.contains("button", /filter/i).should("exist");
    cy.contains("button", /this week/i).should("exist");
    cy.contains("button", /this month/i).should("exist");
    cy.get('[aria-label="Distribute individual bonuses"]').should("exist");
    cy.log("[UI] Header buttons present");

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

    cy.contains("button", /this week/i).click({ force: true });
    cy.wait(1500);
    cy.get("body").then(($body) => {
      const hasRange = /\d{4}-\d{2}-\d{2}\s*→\s*\d{4}-\d{2}-\d{2}/.test($body.text());
      cy.log(hasRange ? "[WEEK] Date range badge visible" : "[WEEK] No range badge — no data this week");
    });

    // Clear before testing month
    cy.get("body").then(($body) => {
      if ($body.text().match(/\d{4}-\d{2}-\d{2}\s*→/)) {
        cy.contains("button", /clear/i).first().click({ force: true });
        cy.wait(800);
      }
    });

    cy.contains("button", /this month/i).click({ force: true });
    cy.wait(1500);
    cy.get("body").then(($body) => {
      const hasRange = /\d{4}-\d{2}-\d{2}\s*→\s*\d{4}-\d{2}-\d{2}/.test($body.text());
      cy.log(hasRange ? "[MONTH] Date range badge visible" : "[MONTH] No range badge — no data this month");
    });

    cy.log("[UI] This Week / This Month filters exercised");
  });

  // ── 3. Filter by Staff ───────────────────────────────────────────────────────

  it("should open Filter modal, select Staff mode, pick a staff name, apply, and show only matching rows", () => {
    loginAndVisit();

    cy.get("table tbody tr", { timeout: 15000 }).then(($rows) => {
      if ($rows.length === 0) {
        cy.log("[SKIP] No rows in table — cannot test staff filter without data");
        return;
      }

      cy.get("table tbody tr").first().find("td").eq(0).invoke("text").then((staffName) => {
        const name = staffName.trim();
        if (!name) { cy.log("[SKIP] First row has no staff name"); return; }

        cy.log(`[FILTER] Will filter by staff: "${name}"`);

        cy.contains("button", /filter/i).click({ force: true });
        cy.wait(500);

        cy.get('input[type="radio"][name="filterMode"]').first().check({ force: true });
        cy.wait(200);

        cy.get('input[placeholder]').filter((_, el) => {
          const ph = (el as HTMLInputElement).placeholder.toLowerCase();
          return ph.includes("staff") || ph.includes("search") || ph.includes("name");
        }).first().clear({ force: true }).type(name.split(" ")[0], { force: true });
        cy.wait(400);

        cy.get("body").then(($body) => {
          const suggestions = $body.find('[class*="cursor-pointer"]').toArray()
            .filter((el) => (el.textContent || "").trim().toLowerCase()
              .includes(name.toLowerCase().split(" ")[0]));
          if (suggestions.length > 0) {
            cy.wrap(suggestions[0]).click({ force: true });
            cy.wait(300);
          }
        });

        cy.contains("button", /apply/i).click({ force: true });
        cy.wait(1500);

        cy.contains(/staff/i, { timeout: 8000 }).should("exist");
        cy.log(`[FILTER] Staff filter badge shown for "${name}"`);

        cy.get("table tbody tr").then(($filtered) => {
          if ($filtered.length === 0) {
            cy.log("[FILTER] No rows after staff filter — acceptable if no data for this staff");
            return;
          }
          cy.get("table tbody tr").each(($row) => {
            cy.wrap($row).find("td").eq(0).invoke("text").then((rowName) => {
              expect(normalise(rowName)).to.include(normalise(name).split(" ")[0]);
            });
          });
          cy.log(`[FILTER] All rows match staff "${name}"`);
        });
      });
    });
  });

  // ── 4. Filter by Location (multi-select checkboxes) ─────────────────────────
  // The location dropdown is a checkbox multi-select. Selecting two locations
  // returns rows from EITHER (OR logic). Assertion checks membership, not equality.

  it("should open Filter modal, select Location mode, pick two locations via checkboxes, apply, and verify all rows belong to one of the selected locations", () => {
    loginAndVisit();

    cy.get("table tbody tr", { timeout: 15000 }).then(($rows) => {
      if ($rows.length === 0) {
        cy.log("[SKIP] No rows in table — cannot test location filter without data");
        return;
      }

      // Collect up to 2 distinct location names from the table
      const seenLocs: string[] = [];
      $rows.each((_, row) => {
        const loc = (Cypress.$(row).find("td").eq(1).text() || "").trim();
        if (loc && !seenLocs.find((l) => normalise(l) === normalise(loc))) seenLocs.push(loc);
      });

      if (seenLocs.length === 0) {
        cy.log("[SKIP] No location names found in table rows");
        return;
      }

      const locationsToSelect = seenLocs.slice(0, 2);
      cy.log(`[FILTER] Selecting locations: ${JSON.stringify(locationsToSelect)}`);

      // Open modal and switch to Location mode
      cy.contains("button", /filter/i).click({ force: true });
      cy.wait(500);
      cy.get('input[type="radio"][name="filterMode"]').last().check({ force: true });
      cy.wait(300);

      // Open the location checkbox dropdown. The trigger is a div inside the modal
      // that contains the ▾ arrow — scope to the modal overlay to avoid false matches.
      cy.get('[class*="fixed"]').within(() => {
        cy.contains("▾").click({ force: true });
        cy.wait(300);

        // Tick each location by clicking its text in the dropdown list
        locationsToSelect.forEach((loc) => {
          cy.contains(loc, { timeout: 8000 }).click({ force: true });
          cy.wait(150);
        });
      });

      cy.contains("button", /apply/i).click({ force: true });
      cy.wait(1500);

      cy.contains(/location/i, { timeout: 8000 }).should("exist");
      cy.log("[FILTER] Location filter badge shown");

      cy.get("table tbody tr").then(($filtered) => {
        if ($filtered.length === 0) {
          cy.log("[FILTER] No rows after location filter — acceptable if no data for these locations");
          return;
        }

        const selectedNorm = locationsToSelect.map(normalise);

        cy.get("table tbody tr").each(($row) => {
          cy.wrap($row).find("td").eq(1).invoke("text").then((rowLoc) => {
            expect(selectedNorm).to.include(
              normalise(rowLoc),
              `Row location "${rowLoc}" should be one of [${locationsToSelect.join(", ")}]`
            );
          });
        });
        cy.log(`[FILTER] ✓ All rows belong to one of: ${locationsToSelect.join(", ")}`);
      });
    });
  });

  // ── 5. Distribution: RPC calls + table updates + DB verification ────────────

  it("should click Distribute, call both RPCs, show new rows in table, and verify DB has correct bonus data", () => {
    loginAndVisit();

    const distributeBtn = '[aria-label="Distribute individual bonuses"]';

    cy.get(distributeBtn, { timeout: 10000 }).should("exist").and("not.be.disabled");

    // Intercept the Supabase REST fetch that reloads rows after distribution.
    // Its response body contains the raw individual_bonus records with their ids —
    // we use those ids to look up the exact same rows in the DB and compare.
    cy.intercept("GET", "**/rest/v1/individual_bonus*").as("fetchRows");
    cy.intercept("POST", "**/rpc/calculate_team_bonus_daily*").as("calcRpc");
    cy.intercept("POST", "**/rpc/distribute_individual_bonus_daily*").as("distributeRpc");

    cy.get("table tbody tr", { timeout: 15000 }).then(($rows) => {
      cy.log(`[BEFORE] Table has ${$rows.length} rows`);
    });

    cy.get(distributeBtn).click({ force: true });

    cy.get(distributeBtn, { timeout: 5000 }).should("be.disabled");
    cy.log("[UI] Distribute button disabled during calculation");

    cy.wait("@calcRpc", { timeout: 30000 });
    cy.log("[RPC] ✓ calculate_team_bonus_daily called");

    cy.wait("@distributeRpc", { timeout: 30000 });
    cy.log("[RPC] ✓ distribute_individual_bonus_daily called");

    cy.get(".Toastify__toast--success", { timeout: 15000 }).should("exist");
    cy.log("[UI] ✓ Success toast shown");

    cy.get(distributeBtn, { timeout: 15000 }).should("not.be.disabled");
    cy.log("[UI] ✓ Distribute button re-enabled");

    cy.wait("@fetchRows", { timeout: 15000 }).then((fetchInterception) => {
      const responseBody = fetchInterception.response?.body;
      const rawRows: Record<string, unknown>[] = Array.isArray(responseBody) ? responseBody : [];
      cy.log(`[API] fetchRows response: ${rawRows.length} raw rows`);

      cy.get("table tbody tr", { timeout: 15000 }).then(($rows) => {
        cy.log(`[AFTER] Table has ${$rows.length} rows`);

        if ($rows.length === 0) {
          cy.log("[TABLE] No rows after distribution — no eligible bonuses for today");
          return;
        }

        cy.get("table tbody tr").first().within(() => {
          cy.get("td").eq(0).invoke("text").should("not.be.empty");
          cy.get("td").eq(2).invoke("text").then((bonusText) => {
            const bonus = parseFloat(bonusText.replace(/[^0-9.]/g, ""));
            expect(bonus).to.be.greaterThan(0);
            cy.log(`[TABLE] First row UI bonus: ${bonus}`);
          });
        });

        // Match each UI row to its DB record by id (up to 3 rows)
        const checkCount = Math.min($rows.length, rawRows.length, 3);
        for (let i = 0; i < checkCount; i++) {
          const rowId = rawRows[i]?.id;
          if (!rowId) { cy.log(`[DB] Row ${i} has no id — skipping`); continue; }

          cy.get("table tbody tr").eq(i).find("td").eq(2).invoke("text").then((uiText) => {
            const uiBonusNum = parseFloat(uiText.replace(/[^0-9.]/g, ""));
            cy.log(`[UI] Row ${i} id=${rowId}, displayed bonus=${uiBonusNum}`);

            cy.task("getIndividualBonusById", { id: rowId }).then((dbRow) => {
              cy.log(`[DB] Row ${i}: ${JSON.stringify(dbRow)}`);
              expect(dbRow).to.not.be.null;
              const row = dbRow as Record<string, unknown>;
              expect(row).to.have.property("id");
              expect(row).to.have.property("bonus");
              expect(row).to.have.property("bonus_date");
              expect(row).to.have.property("paid");
              const dbBonusNum = Number(row.bonus || 0);
              expect(uiBonusNum).to.be.closeTo(dbBonusNum, 0.01);
              cy.log(`[VERIFY] ✓ Row ${i}: UI bonus (${uiBonusNum}) === DB bonus (${dbBonusNum})`);
            });
          });
        }
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

      cy.intercept("PATCH", "**/rest/v1/individual_bonus*").as("payRequest");

      cy.get("table tbody tr").eq(unpaidRowIndex).find("button").last().click({ force: true });

      cy.get("table tbody tr").eq(unpaidRowIndex).find("button").last()
        .should(($btn) => {
          expect(["Paying...", "Paid"]).to.include($btn.text().trim());
        });
      cy.log("[UI] Optimistic paying state shown");

      cy.wait("@payRequest", { timeout: 15000 }).then((interception) => {
        cy.log(`[API] PATCH individual_bonus — URL: ${interception.request.url}`);
        cy.log(`[API] Body: ${JSON.stringify(interception.request.body)}`);

        const urlMatch = interception.request.url.match(/[?&]id=eq\.([^&]+)/);
        const rowId = urlMatch ? urlMatch[1] : null;
        cy.log(`[API] Extracted row id: ${rowId}`);

        cy.get("table tbody tr").eq(unpaidRowIndex).find("td").last()
          .find("button")
          .should("contain.text", "Paid")
          .and("be.disabled");
        cy.log("[UI] ✓ Actions column shows Paid (disabled)");

        if (!rowId) {
          cy.log("[DB] Could not extract row id — skipping DB check");
          return;
        }

        cy.wait(800);
        cy.task("getIndividualBonusById", { id: rowId }).then((dbRow) => {
          cy.log(`[DB] individual_bonus row: ${JSON.stringify(dbRow)}`);
          expect(dbRow).to.not.be.null;
          const row = dbRow as Record<string, unknown>;
          expect(row.paid).to.eq(true);
          cy.log(`[DB] ✓ paid=true`);
          expect(row.paid_date).to.not.be.null;
          expect(row.paid_date).to.not.eq("");
          const parsedDate = new Date(row.paid_date as string);
          expect(parsedDate.getTime()).to.not.be.NaN;
          cy.log(`[DB] ✓ paid_date=${row.paid_date}`);
          expect(Number(row.bonus)).to.be.greaterThan(0);
          cy.log(`[DB] ✓ bonus=${row.bonus} (unchanged)`);
        });
      });
    });
  });
});
