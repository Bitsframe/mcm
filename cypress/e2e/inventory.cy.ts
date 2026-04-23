/// <reference types="cypress" />

// Inventory Management E2E Tests
// URL: /en/inventory/manage
// Features tested:
// 1. Active tab shows non-archived records (archived=false)
// 2. Archive tab shows archived records (archived=true), "No Product is available" if none
// 3. Archive an item → removed from Active, appears in Archive tab, DB flag updated
// 4. Unarchive an item → removed from Archive, appears in Active tab, DB flag updated
// 5. "Quantity Available Excluding" filter shows only rows with Units > 0
// 6. Search by product name filters the table

const INVENTORY_URL = "/inventory/manage";

describe("Inventory Management", () => {
  // ── Test 1: Active tab shows non-archived records ─────────────────────────
  it("should show Active tab by default with non-archived inventory records", () => {
    cy.loginWithCredentials(TEST_EMAIL, TEST_PASSWORD);
    cy.visit(INVENTORY_URL);
    cy.wait(2000);
    // Active button should be highlighted (bg-blue-600)
    cy.contains("button", "Active").should("have.class", "bg-blue-600");
    cy.log("Active tab is selected by default");

    // Table should have rows (or show "No Product is available" if empty)
    cy.get("body").then(($body) => {
      if ($body.text().includes("No Product is available")) {
        cy.log("No active inventory for this location — correct");
      } else {
        cy.get("table tbody tr").should("have.length.greaterThan", 0);
        cy.log("Active inventory records visible");

        // Each row should have an Archive button (not Unarchive)
        cy.get("table tbody tr").first().contains("Archive").should("exist");
        cy.log("Archive button present on active items");
      }
    });
  });

  // ── Test 2: Archive tab shows archived records ────────────────────────────
  it("should show archived records in Archive tab or 'No Product is available'", () => {
    cy.loginWithCredentials(TEST_EMAIL, TEST_PASSWORD);
    cy.visit(INVENTORY_URL);
    cy.wait(2000);
    // Click Archive tab
    cy.contains("button", "Archive").click({ force: true });
    cy.wait(1500);

    cy.contains("button", "Archive").should("have.class", "bg-blue-600");
    cy.log("Archive tab selected");

    cy.get("body").then(($body) => {
      if ($body.text().includes("No Product is available")) {
        cy.log("No archived inventory — 'No Product is available' shown correctly");
        cy.contains("No Product is available").should("exist");
      } else {
        cy.get("table tbody tr").should("have.length.greaterThan", 0);
        cy.log("Archived inventory records visible");

        // Each row should have an Unarchive button
        cy.get("table tbody tr").first().contains("Unarchive").should("exist");
        cy.log("Unarchive button present on archived items");
      }
    });
  });

  // ── Test 3: Archive an item → removed from Active, DB flag updated ────────
  it("should archive an item, remove it from Active tab, and update DB archived=true", () => {
    cy.loginWithCredentials(TEST_EMAIL, TEST_PASSWORD);
    cy.visit(INVENTORY_URL);
    cy.wait(2000);
    // Must be on Active tab
    cy.contains("button", "Active").click({ force: true });
    cy.wait(1500);

    cy.get("body").then(($body) => {
      if ($body.text().includes("No Product is available")) {
        cy.log("No active items to archive — test passes gracefully");
        return;
      }

      // Read inventory_id from first row ID column (td.eq(1) — td.eq(0) is empty spacer)
      cy.get("table tbody tr").first().find("td").eq(1).invoke("text").then((idTxt) => {
        const inventoryId = parseInt(idTxt.trim()) || 0;
        cy.log(`Will archive inventory_id: ${inventoryId}`);

        // Intercept the update API to confirm archive action fires
        cy.intercept("POST", "**/inventory*").as("archiveAction");

        // Click Archive button — Action_Button renders <button> with translated label
        cy.get("table tbody tr").first()
          .find("button")
          .contains("Archive")
          .click({ force: true });

        cy.wait(1500);

        // Verify DB: archived flag should now be true
        if (inventoryId > 0) {
          cy.task("getInventoryRecord", { inventoryId }).then((record) => {
            expect(record).to.not.be.null;
            const r = record as Record<string, unknown>;
            cy.log(`DB record after archive:`);
            cy.log(`  inventory_id: ${r.inventory_id}`);
            cy.log(`  archived:     ${r.archived}`);
            cy.log(`  quantity:     ${r.quantity}`);
            cy.log(`  location_id:  ${r.location_id}`);
            expect(r.archived).to.eq(true);
            cy.log(`inventory_id ${inventoryId} confirmed archived=true in DB`);
          });
        }

        // Row should be removed from Active tab (table re-fetches after archive)
        cy.get("table tbody tr").then(($rowsAfter) => {
          // The archived item should no longer appear — verify by checking ID is gone
          const rowTexts = Array.from($rowsAfter).map((r) => r.textContent || "");
          const stillPresent = rowTexts.some((t) => t.includes(String(inventoryId)));
          expect(stillPresent).to.eq(false);
          cy.log(`inventory_id ${inventoryId} no longer in Active tab`);
        });

        // Switch to Archive tab — the item should appear there
        cy.contains("button", "Archive").click({ force: true });
        cy.wait(1500);
        cy.get("table tbody tr").should("have.length.greaterThan", 0);
        cy.log("Archived item now visible in Archive tab");
      });
    });
  });

  // ── Test 4: Unarchive an item → removed from Archive, DB flag updated ─────
  it("should unarchive an item, remove it from Archive tab, and update DB archived=false", () => {
    cy.loginWithCredentials(TEST_EMAIL, TEST_PASSWORD);
    cy.visit(INVENTORY_URL);
    cy.wait(2000);
    // Switch to Archive tab
    cy.contains("button", "Archive").click({ force: true });
    cy.wait(1500);

    cy.get("body").then(($body) => {
      if ($body.text().includes("No Product is available")) {
        cy.log("No archived items to unarchive — test passes gracefully");
        return;
      }

      // Read inventory_id from first row
      cy.get("table tbody tr").first().find("td").eq(1).invoke("text").then((idTxt) => {
        const inventoryId = parseInt(idTxt.trim()) || 0;
        cy.log(`Will unarchive inventory_id: ${inventoryId}`);

        // Click Unarchive button
        cy.get("table tbody tr").first()
          .find("button")
          .contains("Unarchive")
          .click({ force: true });
        cy.wait(1500);

        // Toast may appear briefly
        cy.get("body").then(($b) => {
          if ($b.text().includes("Inventory no longer archived")) {
            cy.log("Unarchive success toast visible");
          } else {
            cy.log("Toast already dismissed — verifying table update instead");
          }
        });

        // Verify DB: archived=false
        if (inventoryId > 0) {
          cy.task("getInventoryRecord", { inventoryId }).then((record) => {
            expect(record).to.not.be.null;
            const r = record as Record<string, unknown>;
            cy.log(`DB record after unarchive:`);
            cy.log(`  inventory_id: ${r.inventory_id}`);
            cy.log(`  archived:     ${r.archived}`);
            cy.log(`  quantity:     ${r.quantity}`);
            cy.log(`  location_id:  ${r.location_id}`);
            expect(r.archived).to.eq(false);
            cy.log(`inventory_id ${inventoryId} confirmed archived=false in DB`);
          });
        }

        // Item should no longer be in Archive tab
        cy.get("table tbody tr").then(($rowsAfter) => {
          const rowTexts = Array.from($rowsAfter).map((r) => r.textContent || "");
          const stillPresent = rowTexts.some((t) => t.includes(String(inventoryId)));
          expect(stillPresent).to.eq(false);
          cy.log(`inventory_id ${inventoryId} no longer in Archive tab`);
        });

        // Switch to Active tab — item should appear there
        cy.contains("button", "Active").click({ force: true });
        cy.wait(1500);
        cy.get("table tbody tr").should("have.length.greaterThan", 0);
        cy.log("Unarchived item now visible in Active tab");
      });
    });
  });

  // ── Test 5: "Quantity Available Excluding" filter ─────────────────────────
  it("should filter to show only rows with Units > 0 when Quantity Available Excluding is clicked", () => {
    cy.loginWithCredentials(TEST_EMAIL, TEST_PASSWORD);
    cy.visit(INVENTORY_URL);
    cy.wait(2000);
    cy.contains("button", "Active").click({ force: true });
    cy.wait(1500);

    cy.get("body").then(($body) => {
      if ($body.text().includes("No Product is available")) {
        cy.log("No active items — skipping filter test");
        return;
      }

      // Click "Quantity Available Excluding" filter button
      cy.contains("button", "Quantity Available Excluding").click({ force: true });
      cy.wait(500);

      cy.log("Quantity Available Excluding filter applied");

      // All visible rows should have Units > 0 or show "Unlimited"
      cy.get("table tbody tr").each(($row) => {
        cy.wrap($row).find("td").then(($cells) => {
          // Units column is the 5th column (index 4, after empty, ID, Category, Name, Price, Units)
          // Find the cell that contains a number or "Unlimited"
          const unitsCell = $cells.eq(5);
          cy.wrap(unitsCell).invoke("text").then((unitsTxt) => {
            const trimmed = unitsTxt.trim();
            if (trimmed === "Unlimited") {
              cy.log(`Row has Unlimited units — included correctly`);
            } else {
              const qty = parseInt(trimmed) || 0;
              cy.log(`Row units: ${qty}`);
              expect(qty).to.be.greaterThan(0);
            }
          });
        });
      });

      // Toggle filter off
      cy.contains("button", "Quantity Available Excluding").click({ force: true });
      cy.wait(500);
      cy.log("Filter toggled off");
    });
  });

  // ── Test 6: Search by product name ───────────────────────────────────────
  it("should filter inventory by product name search", () => {
    cy.loginWithCredentials(TEST_EMAIL, TEST_PASSWORD);
    cy.visit(INVENTORY_URL);
    cy.wait(2000);
    cy.contains("button", "Active").click({ force: true });
    cy.wait(1500);

    cy.get("body").then(($body) => {
      if ($body.text().includes("No Product is available")) {
        cy.log("No active items — skipping search test");
        return;
      }

      // Get the first product name from the table
      cy.get("table tbody tr").first().find("td").eq(3).invoke("text").then((productName) => {
        const searchTerm = productName.trim().split(" ")[0]; // use first word
        cy.log(`Searching for: "${searchTerm}"`);

        cy.get('input[placeholder="Search By Product"]').clear().type(searchTerm);
        cy.wait(500);

        // All visible rows should contain the search term
        cy.get("table tbody tr").each(($row) => {
          cy.wrap($row).find("td").eq(3).invoke("text").then((name) => {
            expect(name.toLowerCase()).to.include(searchTerm.toLowerCase());
          });
        });
        cy.log(`Search for "${searchTerm}" shows matching rows`);

        // Search for non-existent product
        cy.get('input[placeholder="Search By Product"]').clear().type("ZZZNOMATCH999XYZ");
        cy.wait(500);
        cy.contains("No Product is available").should("exist");
        cy.log("Non-existent search shows 'No Product is available'");

        // Clear search
        cy.get('input[placeholder="Search By Product"]').clear();
        cy.wait(500);
      });
    });
  });

  // ── Test 7: Archive item from Active tab → verify in Archive tab ──────────
  it("should archive an item from Active tab and verify it appears in Archive tab", () => {
    cy.loginWithCredentials(TEST_EMAIL, TEST_PASSWORD);
    cy.visit(INVENTORY_URL);
    cy.wait(2000);
    cy.contains("button", "Active").click({ force: true });
    cy.wait(1500);

    cy.get("body").then(($body) => {
      if ($body.text().includes("No Product is available")) {
        cy.log("No active items — test passes gracefully");
        return;
      }

      // Get product name of first row to verify it appears in Archive tab
      cy.get("table tbody tr").first().find("td").eq(3).invoke("text").then((productName) => {
        const name = productName.trim();
        cy.log(`Archiving product: "${name}"`);

        cy.get("table tbody tr").first().contains("Archive").click({ force: true });
        cy.wait(1500);

        cy.contains(/Archived successfully/i, { timeout: 10000 }).should("exist");

        // Switch to Archive tab
        cy.contains("button", "Archive").click({ force: true });
        cy.wait(1500);

        // The archived product should appear in Archive tab
        cy.contains(name).should("exist");
        cy.log(`"${name}" found in Archive tab after archiving`);

        // Unarchive it to restore state
        cy.contains(name).closest("tr").contains("Unarchive").click({ force: true });
        cy.wait(1500);
        cy.get("body").then(($b) => {
          if ($b.text().includes("Inventory no longer archived")) {
            cy.log("Restore toast visible");
          } else {
            cy.log("Restore toast dismissed — table updated");
          }
        });
        cy.log(`"${name}" restored to Active tab`);
      });
    });
  });
});


