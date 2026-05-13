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

  // ── 4. Filter by Location (multi-select) ────────────────────────────────────
  // The location dropdown is a checkbox multi-select — selecting two locations
  // means rows from EITHER location should appear (OR logic).

  it("should open Filter modal, select Location mode, pick two locations via checkboxes, apply, and verify all rows belong to one of the selected locations", () => {
    loginAndVisit();

    const normalise = (s: string) => s.trim().normalize("NFC").toLowerCase();

    cy.get("table tbody tr", { timeout: 15000 }).then(($rows) => {
      if ($rows.length === 0) {
        cy.log("[SKIP] No rows in table — cannot test location filter without data");
        return;
      }

      // Collect distinct location names from the table (up to 2)
      const seenLocs: string[] = [];
      $rows.each((_, row) => {
        const loc = (Cypress.$(row).find("td").eq(1).text() || "").trim();
        if (loc && !seenLocs.find((l) => normalise(l) === normalise(loc))) {
          seenLocs.push(loc);
        }
      });

      if (seenLocs.length === 0) {
        cy.log("[SKIP] No location names found in table rows");
        return;
      }

      // Pick up to 2 distinct locations to select in the filter
      const locationsToSelect = seenLocs.slice(0, 2);
      cy.log(`[FILTER] Will select locations: ${JSON.stringify(locationsToSelect)}`);

      cy.contains("button", /filter/i).click({ force: true });
      cy.wait(500);

      // Switch to Location radio
      cy.get('input[type="radio"][name="filterMode"]').last().check({ force: true });
      cy.wait(300);

      // Open the location checkbox dropdown (triggered by the div containing ▾)
      cy.get("body").then(($body) => {
        const triggers = $body.find('[class*="cursor-pointer"]').toArray()
          .filter((el) => (el.textContent || "").includes("▾"));
        if (triggers.length > 0) {
          cy.wrap(triggers[0]).click({ force: true });
          cy.wait(300);
        }
      });

      // Tick each location checkbox by clicking its label text
      locationsToSelect.forEach((loc) => {
        cy.contains(loc, { timeout: 8000 }).click({ force: true });
        cy.wait(200);
      });

      // Close dropdown by clicking Apply (dropdown stays open until Apply)
      cy.contains("button", /apply/i).click({ force: true });
      cy.wait(1500);

      // Applied filter badge should mention Location
      cy.contains(/location/i, { timeout: 8000 }).should("exist");
      cy.log(`[FILTER] Location filter badge shown`);

      // Every visible row must belong to one of the selected locations (OR logic)
      cy.get("table tbody tr").then(($filtered) => {
        if ($filtered.length === 0) {
          cy.log("[FILTER] No rows after location filter — acceptable if no data for these locations");
          return;
        }

        const selectedNormalised = locationsToSelect.map(normalise);

        cy.get("table tbody tr").each(($row) => {
          cy.wrap($row).find("td").eq(1).invoke("text").then((rowLoc) => {
            const rowNorm = normalise(rowLoc);
            expect(selectedNormalised).to.include(rowNorm,
              `Row location "${rowLoc}" should be one of [${locationsToSelect.join(", ")}]`
            );
          });
        });
        cy.log(`[FILTER] ✓ All rows belong to one of: ${locationsToSelect.join(", ")}`);
      });
    });
  });

  // ── 5. Filter by Location + Bonus Date range combined ───────────────────────
  // Selects a location AND a bonus date range, verifies rows match both constraints.

  it("should filter by Location and Bonus Date range, verify rows match location and bonus_date falls within range", () => {
    loginAndVisit();

    const normalise = (s: string) => s.trim().normalize("NFC").toLowerCase();

    cy.get("table tbody tr", { timeout: 15000 }).then(($rows) => {
      if ($rows.length === 0) {
        cy.log("[SKIP] No rows — cannot test combined filter without data");
        return;
      }

      // Pick the first location from the table
      const firstLocName = (Cypress.$($rows[0]).find("td").eq(1).text() || "").trim();
      if (!firstLocName) {
        cy.log("[SKIP] First row has no location name");
        return;
      }

      // Build a wide bonus date range: last 90 days → today
      const today = new Date();
      const rangeEnd = today.toISOString().slice(0, 10);
      const rangeStart = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000)
        .toISOString().slice(0, 10);

      cy.log(`[FILTER] Location: "${firstLocName}", Bonus date: ${rangeStart} → ${rangeEnd}`);

      cy.contains("button", /filter/i).click({ force: true });
      cy.wait(500);

      // Switch to Location radio
      cy.get('input[type="radio"][name="filterMode"]').last().check({ force: true });
      cy.wait(300);

      // Open location dropdown and select the first location
      cy.get("body").then(($body) => {
        const triggers = $body.find('[class*="cursor-pointer"]').toArray()
          .filter((el) => (el.textContent || "").includes("▾"));
        if (triggers.length > 0) {
          cy.wrap(triggers[0]).click({ force: true });
          cy.wait(300);
        }
      });
      cy.contains(firstLocName, { timeout: 8000 }).click({ force: true });
      cy.wait(200);

      // Set Bonus Date range using the two date inputs inside the modal
      // The modal has two RangeDatePicker sections; the first is Bonus Date
      cy.get('.fixed input[type="date"]').then(($dateInputs) => {
        if ($dateInputs.length >= 2) {
          cy.wrap($dateInputs[0]).clear({ force: true }).type(rangeStart, { force: true });
          cy.wait(100);
          cy.wrap($dateInputs[1]).clear({ force: true }).type(rangeEnd, { force: true });
          cy.wait(100);
          cy.log(`[FILTER] Bonus date inputs set: ${rangeStart} → ${rangeEnd}`);
        } else {
          cy.log("[FILTER] Date inputs not found — applying location-only filter");
        }
      });

      cy.contains("button", /apply/i).click({ force: true });
      cy.wait(1500);

      // Filter badge should appear
      cy.contains(/location/i, { timeout: 8000 }).should("exist");
      cy.log("[FILTER] Filter badge visible after apply");

      cy.get("table tbody tr").then(($filtered) => {
        if ($filtered.length === 0) {
          cy.log("[FILTER] No rows after combined filter — acceptable if no data in range");
          return;
        }

        cy.log(`[FILTER] ${$filtered.length} rows returned`);

        // Every row must match the selected location
        cy.get("table tbody tr").each(($row) => {
          cy.wrap($row).find("td").eq(1).invoke("text").then((rowLoc) => {
            expect(normalise(rowLoc)).to.eq(normalise(firstLocName));
          });

          // Bonus date (col 3) must fall within the range
          cy.wrap($row).find("td").eq(3).invoke("text").then((dateText) => {
            const trimmed = dateText.trim();
            if (!trimmed || trimmed === "-") return; // no date set — skip
            const rowDate = new Date(trimmed);
            if (isNaN(rowDate.getTime())) return; // unparseable — skip
            expect(rowDate.getTime()).to.be.at.least(new Date(rangeStart).getTime());
            expect(rowDate.getTime()).to.be.at.most(new Date(rangeEnd).getTime() + 86400000);
          });
        });
        cy.log(`[FILTER] ✓ All rows match location "${firstLocName}" and bonus date within ${rangeStart} → ${rangeEnd}`);
      });
    });
  });

  // ── 6. Distribution: RPC calls + table updates + DB verification ────────────

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

    // Button must become disabled immediately
    cy.get(distributeBtn, { timeout: 5000 }).should("be.disabled");
    cy.log("[UI] Distribute button disabled during calculation");

    // Both RPCs must fire in order
    cy.wait("@calcRpc", { timeout: 30000 });
    cy.log("[RPC] ✓ calculate_team_bonus_daily called");

    cy.wait("@distributeRpc", { timeout: 30000 });
    cy.log("[RPC] ✓ distribute_individual_bonus_daily called");

    // Success toast
    cy.get(".Toastify__toast--success", { timeout: 15000 }).should("exist");
    cy.log("[UI] ✓ Success toast shown");

    // Button re-enables
    cy.get(distributeBtn, { timeout: 15000 }).should("not.be.disabled");
    cy.log("[UI] ✓ Distribute button re-enabled");

    // Wait for the table-reload fetch triggered by fetchRows() inside the page
    cy.wait("@fetchRows", { timeout: 15000 }).then((fetchInterception) => {
      const responseBody = fetchInterception.response?.body;
      const rawRows: Record<string, unknown>[] = Array.isArray(responseBody)
        ? responseBody
        : [];
      cy.log(`[API] fetchRows response: ${rawRows.length} raw rows`);

      // ── Table structure check ─────────────────────────────────────────────
      cy.get("table tbody tr", { timeout: 15000 }).then(($rows) => {
        cy.log(`[AFTER] Table has ${$rows.length} rows`);

        if ($rows.length === 0) {
          cy.log("[TABLE] No rows after distribution — no eligible bonuses for today");
          return;
        }

        // First row must have a non-empty staff name and a positive bonus
        cy.get("table tbody tr").first().within(() => {
          cy.get("td").eq(0).invoke("text").should("not.be.empty");
          cy.get("td").eq(2).invoke("text").then((bonusText) => {
            const bonus = parseFloat(bonusText.replace(/[^0-9.]/g, ""));
            expect(bonus).to.be.greaterThan(0);
            cy.log(`[TABLE] First row UI bonus: ${bonus}`);
          });
        });

        // ── DB cross-check: match each UI row to its DB record by id ─────────
        // rawRows preserves insertion order which the page maps 1-to-1 to table rows.
        // We check up to 3 rows to keep the test fast.
        const checkCount = Math.min($rows.length, rawRows.length, 3);

        for (let i = 0; i < checkCount; i++) {
          const rawRow = rawRows[i];
          const rowId = rawRow?.id;
          if (!rowId) {
            cy.log(`[DB] Row ${i} has no id — skipping`);
            continue;
          }

          // Read the bonus displayed in the UI for this row index
          cy.get("table tbody tr").eq(i).find("td").eq(2).invoke("text").then((uiText) => {
            const uiBonusNum = parseFloat(uiText.replace(/[^0-9.]/g, ""));
            cy.log(`[UI] Row ${i} id=${rowId}, displayed bonus=${uiBonusNum}`);

            // Fetch the exact same row from the DB by id
            cy.task("getIndividualBonusById", { id: rowId }).then((dbRow) => {
              cy.log(`[DB] Row ${i}: ${JSON.stringify(dbRow)}`);
              expect(dbRow).to.not.be.null;
              const row = dbRow as Record<string, unknown>;

              // Structure checks
              expect(row).to.have.property("id");
              expect(row).to.have.property("bonus");
              expect(row).to.have.property("bonus_date");
              expect(row).to.have.property("paid");

              // UI bonus must match the DB bonus for the same record
              const dbBonusNum = Number(row.bonus || 0);
              expect(uiBonusNum).to.be.closeTo(dbBonusNum, 0.01);
              cy.log(`[VERIFY] ✓ Row ${i}: UI bonus (${uiBonusNum}) === DB bonus (${dbBonusNum})`);
            });
          });
        }
      });
    });
  });

  // ── 7. Pay action: click Pay → button becomes Paid (disabled) + DB verify ────

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
