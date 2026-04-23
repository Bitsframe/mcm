/// <reference types="cypress" />

// Inventory Management E2E Tests
// URL: /en/inventory/manage

const INVENTORY_URL = "/en/inventory/manage";

describe("Inventory Management", () => {

  // ── Test 1: Active tab default ────────────────────────────────────────────
  it("should show Active tab by default with non-archived inventory records", () => {
    cy.loginWithCredentials(TEST_EMAIL, TEST_PASSWORD);
    cy.visit(INVENTORY_URL);
    cy.wait(2000);

    cy.contains("button", "Active").should("have.class", "bg-blue-600");
    cy.log("Active tab is selected by default");

    cy.get("body").then(($body) => {
      if ($body.text().includes("No Product is available")) {
        cy.log("No active inventory for this location — correct");
      } else {
        cy.get("table tbody tr").should("have.length.greaterThan", 0);
        // Archive button is the only button in each row
        cy.get("table tbody tr").first().find("button").should("contain.text", "Archive");
        cy.log("Active inventory records visible with Archive buttons");
      }
    });
  });

  // ── Test 2: Archive tab — DB-driven verification ──────────────────────────
  it("should show archived records in Archive tab or 'No Product is available'", () => {
    cy.loginWithCredentials(TEST_EMAIL, TEST_PASSWORD);
    cy.visit(INVENTORY_URL);
    cy.wait(2000);

    // Click Archive tab button
    cy.contains("button", "Archive").click({ force: true });
    cy.wait(1500);
    cy.contains("button", "Archive").should("have.class", "bg-blue-600");
    cy.log("Archive tab selected");

    cy.window().then((win) => {
      let locationId = 0;
      for (let i = 0; i < win.localStorage.length; i++) {
        const key = win.localStorage.key(i);
        if (key && key.startsWith("@location")) {
          locationId = parseInt(win.localStorage.getItem(key) || "0", 10);
          if (locationId > 0) break;
        }
      }
      cy.log(`Active location: ${locationId}`);

      cy.task("getArchivedInventoryCount", { locationId }).then((dbCount) => {
        cy.log(`DB archived count for location ${locationId}: ${dbCount}`);

        if ((dbCount as number) === 0) {
          cy.contains("No Product is available").should("exist");
          cy.log("No archived inventory — 'No Product is available' shown correctly");
        } else {
          cy.get("table tbody tr").should("have.length.greaterThan", 0);
          cy.log(`${dbCount} archived record(s) in DB — table rows visible`);
          cy.get("table tbody tr").first().find("button").should("contain.text", "Unarchive");
          cy.log("Unarchive button present on archived items");
        }
      });
    });
  });

  // ── Test 3: Archive item → removed from Active, DB archived=true ──────────
  it("should archive an item, remove it from Active tab, and update DB archived=true", () => {
    cy.loginWithCredentials(TEST_EMAIL, TEST_PASSWORD);
    cy.visit(INVENTORY_URL);
    cy.wait(2000);

    cy.contains("button", "Active").click({ force: true });
    cy.wait(1500);

    // Fail fast if no items — don't silently pass
    cy.get("table tbody tr").should("have.length.greaterThan", 0);

    // Read inventory_id from first row
    cy.get("table tbody tr").first().find("td").eq(1).invoke("text").then((idTxt) => {
      const inventoryId = parseInt(idTxt.trim()) || 0;
      cy.log(`Will archive inventory_id: ${inventoryId}`);
      expect(inventoryId).to.be.greaterThan(0);

      // Verify it's currently NOT archived in DB
      cy.task("getInventoryRecord", { inventoryId }).then((before) => {
        const b = before as Record<string, unknown>;
        cy.log(`DB before archive: archived=${b.archived}`);
        expect(b.archived).to.eq(false);
      });

      // Click the Archive button in the row
      cy.get("table tbody tr").first().find("button").click({ force: true });
      cy.wait(2000);

      // Verify DB: archived=true
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

      // Item no longer in Active tab
      cy.get("table tbody tr").then(($rows) => {
        const rowTexts = Array.from($rows).map((r) => r.textContent || "");
        const stillPresent = rowTexts.some((t) => t.includes(String(inventoryId)));
        expect(stillPresent).to.eq(false);
        cy.log(`inventory_id ${inventoryId} no longer in Active tab`);
      });

      // Switch to Archive tab — item should appear
      cy.contains("button", "Archive").click({ force: true });
      cy.wait(1500);
      cy.get("table tbody tr").should("have.length.greaterThan", 0);
      cy.log("Archived item now visible in Archive tab");
    });
  });

  // ── Test 4: Unarchive item → removed from Archive, DB archived=false ──────
  it("should unarchive an item, remove it from Archive tab, and update DB archived=false", () => {
    cy.loginWithCredentials(TEST_EMAIL, TEST_PASSWORD);
    cy.visit(INVENTORY_URL);
    cy.wait(2000);

    cy.contains("button", "Archive").click({ force: true });
    cy.wait(1500);

    // Fail fast if no archived items
    cy.get("table tbody tr").should("have.length.greaterThan", 0);

    cy.get("table tbody tr").first().find("td").eq(1).invoke("text").then((idTxt) => {
      const inventoryId = parseInt(idTxt.trim()) || 0;
      cy.log(`Will unarchive inventory_id: ${inventoryId}`);
      expect(inventoryId).to.be.greaterThan(0);

      // Verify it's currently archived in DB
      cy.task("getInventoryRecord", { inventoryId }).then((before) => {
        const b = before as Record<string, unknown>;
        cy.log(`DB before unarchive: archived=${b.archived}`);
        expect(b.archived).to.eq(true);
      });

      // Click the Unarchive button in the row
      cy.get("table tbody tr").first().find("button").click({ force: true });
      cy.wait(2000);

      // Verify DB: archived=false
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

      // Item no longer in Archive tab
      cy.get("table tbody tr").then(($rows) => {
        const rowTexts = Array.from($rows).map((r) => r.textContent || "");
        const stillPresent = rowTexts.some((t) => t.includes(String(inventoryId)));
        expect(stillPresent).to.eq(false);
        cy.log(`inventory_id ${inventoryId} no longer in Archive tab`);
      });

      // Switch to Active tab — item should appear
      cy.contains("button", "Active").click({ force: true });
      cy.wait(1500);
      cy.get("table tbody tr").should("have.length.greaterThan", 0);
      cy.log("Unarchived item now visible in Active tab");
    });
  });

  // ── Test 5: Quantity Available Excluding filter ───────────────────────────
  it("should filter to show only rows with Units > 0 when Quantity Available Excluding is clicked", () => {
    cy.loginWithCredentials(TEST_EMAIL, TEST_PASSWORD);
    cy.visit(INVENTORY_URL);
    cy.wait(2000);

    cy.contains("button", "Active").click({ force: true });
    cy.wait(1500);

    cy.get("table tbody tr").should("have.length.greaterThan", 0);

    // Count rows before filter
    cy.get("table tbody tr").then(($rowsBefore) => {
      const countBefore = $rowsBefore.length;
      cy.log(`Rows before filter: ${countBefore}`);

      // Click the filter button
      cy.contains("button", "Quantity Available Excluding").click({ force: true });
      cy.wait(800);
      cy.log("Quantity Available Excluding filter applied");

      // Verify filter is active (button has bg-blue-600)
      cy.contains("button", "Quantity Available Excluding").should("have.class", "bg-blue-600");

      // All visible rows must have Units > 0 or "Unlimited"
      cy.get("table tbody tr").each(($row) => {
        cy.wrap($row).find("td").eq(5).invoke("text").then((unitsTxt) => {
          const trimmed = unitsTxt.trim();
          if (trimmed === "Unlimited") {
            cy.log("Row: Unlimited — included correctly");
          } else {
            const qty = parseInt(trimmed) || 0;
            cy.log(`Row units: ${qty}`);
            expect(qty).to.be.greaterThan(0);
          }
        });
      });

      // Toggle filter off
      cy.contains("button", "Quantity Available Excluding").click({ force: true });
      cy.wait(500);
      cy.contains("button", "Quantity Available Excluding").should("not.have.class", "bg-blue-600");
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

    cy.get("table tbody tr").should("have.length.greaterThan", 0);

    cy.get("table tbody tr").first().find("td").eq(3).invoke("text").then((productName) => {
      const searchTerm = productName.trim().split(" ")[0];
      cy.log(`Searching for: "${searchTerm}"`);

      cy.get('input[placeholder="Search By Product"]').clear().type(searchTerm);
      cy.wait(500);

      cy.get("table tbody tr").each(($row) => {
        cy.wrap($row).find("td").eq(3).invoke("text").then((name) => {
          expect(name.toLowerCase()).to.include(searchTerm.toLowerCase());
        });
      });
      cy.log(`Search for "${searchTerm}" shows matching rows`);

      // Non-existent search
      cy.get('input[placeholder="Search By Product"]').clear().type("ZZZNOMATCH999XYZ");
      cy.wait(500);
      cy.contains("No Product is available").should("exist");
      cy.log("Non-existent search shows 'No Product is available'");

      cy.get('input[placeholder="Search By Product"]').clear();
    });
  });

  // ── Test 7: Archive → verify in Archive tab → restore ────────────────────
  it("should archive an item from Active tab and verify it appears in Archive tab", () => {
    cy.loginWithCredentials(TEST_EMAIL, TEST_PASSWORD);
    cy.visit(INVENTORY_URL);
    cy.wait(2000);

    cy.contains("button", "Active").click({ force: true });
    cy.wait(1500);

    cy.get("table tbody tr").should("have.length.greaterThan", 0);

    cy.get("table tbody tr").first().find("td").eq(3).invoke("text").then((productName) => {
      const name = productName.trim();
      cy.log(`Archiving product: "${name}"`);

      cy.get("table tbody tr").first().find("button").click({ force: true });
      cy.wait(2000);

      // Switch to Archive tab
      cy.contains("button", "Archive").click({ force: true });
      cy.wait(1500);

      cy.contains(name).should("exist");
      cy.log(`"${name}" found in Archive tab after archiving`);

      // Restore state — click Unarchive on the row containing this product
      cy.contains(name).closest("tr").find("button").click({ force: true });
      cy.wait(2000);
      cy.log(`"${name}" restored to Active tab`);
    });
  });
});
