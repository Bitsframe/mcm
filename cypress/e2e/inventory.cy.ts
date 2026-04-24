/// <reference types="cypress" />

// Inventory Management E2E Tests


function loginAndVisitInventory() {
  cy.loginWithCredentials(TEST_EMAIL, TEST_PASSWORD);
  cy.wait(3000);
  cy.visit("/en/inventory/manage", { timeout: 120000 });
  cy.wait(2000);
}

describe("Inventory Management", () => {

  it("should show archived records in Archive tab or 'No Product is available'", () => {
    loginAndVisitInventory();

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

  it("should archive an item, remove it from Active tab, and update DB archived=true", () => {
    loginAndVisitInventory();

    cy.contains("button", "Active").click({ force: true });
    cy.wait(1500);
    cy.get("table tbody tr").should("have.length.greaterThan", 0);

    cy.get("table tbody tr").first().find("td").eq(1).invoke("text").then((idTxt) => {
      const inventoryId = parseInt(idTxt.trim()) || 0;
      cy.log(`Will archive inventory_id: ${inventoryId}`);
      expect(inventoryId).to.be.greaterThan(0);

      cy.task("getInventoryRecord", { inventoryId }).then((before) => {
        const b = before as Record<string, unknown>;
        cy.log(`DB before archive: archived=${b.archived}`);
        expect(b.archived).to.eq(false);
      });

      cy.get("table tbody tr").first().find("button").click({ force: true });
      cy.wait(2000);

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

      cy.get("table tbody tr").then(($rows) => {
        const rowTexts = Array.from($rows).map((r) => r.textContent || "");
        const stillPresent = rowTexts.some((t) => t.includes(String(inventoryId)));
        expect(stillPresent).to.eq(false);
        cy.log(`inventory_id ${inventoryId} no longer in Active tab`);
      });

      cy.contains("button", "Archive").click({ force: true });
      cy.wait(1500);
      cy.get("table tbody tr").should("have.length.greaterThan", 0);
      cy.log("Archived item now visible in Archive tab");
    });
  });

  it("should unarchive an item, remove it from Archive tab, and update DB archived=false", () => {
    loginAndVisitInventory();

    // Go directly to Archive tab
    cy.contains("button", "Archive").click({ force: true });
    cy.wait(1500);

    // Must have archived items to test
    cy.get("table tbody tr").should("have.length.greaterThan", 0);

    // Read inventory_id from first row (td.eq(1) = ID column, td.eq(0) = empty spacer)
    cy.get("table tbody tr").first().find("td").eq(1).invoke("text").then((idTxt) => {
      const inventoryId = parseInt(idTxt.trim()) || 0;
      cy.log(`Will unarchive inventory_id: ${inventoryId}`);
      expect(inventoryId).to.be.greaterThan(0);

      // Verify it IS archived in DB before clicking
      cy.task("getInventoryRecord", { inventoryId }).then((before) => {
        const b = before as Record<string, unknown>;
        cy.log(`DB before unarchive: archived=${b.archived}, inventory_id=${b.inventory_id}`);
        // The Archive tab only shows items with archived=true — confirm DB matches
        expect(b.archived).to.eq(true);
      });

      // Click the Unarchive button (only button in the row)
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

      // Switch to Active tab — item should appear there now
      cy.contains("button", "Active").click({ force: true });
      cy.wait(1500);
      cy.get("table tbody tr").should("have.length.greaterThan", 0);
      cy.log("Unarchived item now visible in Active tab");
    });
  });

  it("should filter to show only rows with Units > 0 when Quantity Available Excluding is clicked", () => {
    loginAndVisitInventory();

    cy.contains("button", "Active").click({ force: true });
    cy.wait(1500);
    cy.get("table tbody tr").should("have.length.greaterThan", 0);

    cy.get("table tbody tr").then(($rowsBefore) => {
      cy.log(`Rows before filter: ${$rowsBefore.length}`);

      cy.contains("button", "Quantity Available Excluding").click({ force: true });
      cy.wait(800);
      cy.contains("button", "Quantity Available Excluding").should("have.class", "bg-blue-600");
      cy.log("Quantity Available Excluding filter applied");

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

      cy.contains("button", "Quantity Available Excluding").click({ force: true });
      cy.wait(500);
      cy.contains("button", "Quantity Available Excluding").should("not.have.class", "bg-blue-600");
      cy.log("Filter toggled off");
    });
  });

  it("should filter inventory by product name search", () => {
    loginAndVisitInventory();

    cy.contains("button", "Active").click({ force: true });
    cy.wait(1500);
    cy.get("table tbody tr").should("have.length.greaterThan", 0);

    cy.get("table tbody tr").first().find("td").eq(4).invoke("text").then(() => {
      const searchTerm = "Mamography";
      cy.log(`Searching for: "${searchTerm}"`);

      cy.get('input[placeholder="Search By Product"]').clear().type(searchTerm);
      cy.wait(500);

      cy.get("table tbody tr").each(($row) => {
        cy.wrap($row).find("td").eq(3).invoke("text").then((name) => {
          expect(name.toLowerCase()).to.include(searchTerm.toLowerCase());
        });
      });
      cy.log(`Search for "${searchTerm}" shows matching rows`);

      cy.get('input[placeholder="Search By Product"]').clear().type("ZZZNOMATCH999XYZ");
      cy.wait(500);
      cy.contains("No Product is available").should("exist");
      cy.log("Non-existent search shows 'No Product is available'");

      cy.get('input[placeholder="Search By Product"]').clear();
    });
  });

  it("should archive an item from Active tab and verify it appears in Archive tab", () => {
    loginAndVisitInventory();

    cy.contains("button", "Active").click({ force: true });
    cy.wait(1500);
    cy.get("table tbody tr").should("have.length.greaterThan", 0);

    cy.get("table tbody tr").first().find("td").eq(4).invoke("text").then((productName) => {
      const name = productName.trim();
      cy.log(`Archiving product: "${name}"`);

      cy.get("table tbody tr").first().find("button").click({ force: true });
      cy.wait(2000);

      cy.contains("button", "Archive").click({ force: true });
      cy.wait(1500);

      cy.contains(name).should("exist");
      cy.log(`"${name}" found in Archive tab after archiving`);

      cy.contains(name).closest("tr").find("button").click({ force: true });
      cy.wait(2000);
      cy.log(`"${name}" restored to Active tab`);
    });
  });
});

// ─── Returns → Inventory Impact ───────────────────────────────────────────────

describe("Inventory — Returns Merge and Discard Impact", () => {

  it("should increase inventory quantity when a return is merged", () => {
    cy.loginWithCredentials(TEST_EMAIL, TEST_PASSWORD);
    cy.visit("/en/pos/return");
    cy.wait(2000);

    // Take first row directly — no search filter
    cy.get("table tbody tr").then(($rows) => {
      if ($rows.length === 0 || $rows.text().includes("No data found")) {
        cy.log("No returns found — test passes (nothing to merge)");
        return;
      }

      // Read product name from first row (column 3 = Product)
      cy.get("table tbody tr").first().find("td").eq(4).invoke("text").then((productName) => {
        const pName = productName.trim();
        cy.log(`First return product: "${pName}"`);

        // Get inventory_id from DB using product name
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

          cy.task("getInventoryByProductName", { productName: pName, locationId }).then((invRecord) => {
            if (!invRecord) {
              cy.log(`No inventory found for "${pName}" at location ${locationId} � test passes gracefully`);
              return;
            }
            const inv = invRecord as Record<string, unknown>;
            const inventoryId = inv.inventory_id as number;
            cy.log(`inventory_id from DB: ${inventoryId}, current qty: ${inv.quantity}`);

            cy.task("getInventoryQuantity", { inventoryId }).then((qtyBefore) => {
              cy.log(`DB Inventory qty BEFORE merge: ${qtyBefore} (inventory_id: ${inventoryId})`);

              // Log from UI inventory table
              cy.visit("/en/inventory/manage");
              cy.wait(2000);
              cy.contains("button", "Active").click({ force: true });
              cy.wait(1500);
              cy.get('input[placeholder="Search By Product"]').clear().type(pName.split(" ")[0]);
              cy.wait(500);
              cy.get("table tbody tr").first().find("td").eq(5).invoke("text").then((uiQtyBefore) => {
                cy.log(`UI Inventory quantity BEFORE merge: ${uiQtyBefore.trim()}`);
              });

              // Go back to returns — click first row, open details, click merge
              cy.visit("/en/pos/return");
              cy.wait(2000);
              cy.get("table tbody tr").should("have.length.greaterThan", 0);
              cy.get("table tbody tr").first().click({ force: true });
              cy.wait(500);

              cy.contains("button", "merge").should("exist");
              cy.contains("button", "merge").scrollIntoView().click({ force: true });
              cy.wait(3000);

              cy.task("getInventoryQuantity", { inventoryId }).then((qtyAfter) => {
                cy.log(`DB Inventory qty AFTER merge: ${qtyAfter} (inventory_id: ${inventoryId})`);
                expect(qtyAfter as number).to.be.greaterThan(qtyBefore as number);
                cy.log(`DB Inventory increased: ${qtyBefore} → ${qtyAfter}`);

              cy.visit("/en/inventory/manage");
              cy.wait(2000);                
              cy.contains("button", "Active").click({ force: true });
                cy.wait(1500);
                cy.get('input[placeholder="Search By Product"]').clear().type(pName.split(" ")[0]);
                cy.wait(500);
                cy.get("table tbody tr").first().find("td").eq(5).invoke("text").then((uiQtyAfter) => {
                  cy.log(`UI Inventory quantity AFTER merge: ${uiQtyAfter.trim()}`);
                });
              });
            });
          });
        });
      });
    });
  });

  it("should NOT change inventory quantity when a return is discarded", () => {
    cy.loginWithCredentials(TEST_EMAIL, TEST_PASSWORD);
    cy.visit("/en/pos/return");
    cy.wait(2000);

    // Take first row directly — no search filter
    cy.get("table tbody tr").then(($rows) => {
      if ($rows.length === 0 || $rows.text().includes("No data found")) {
        cy.log("No returns found — test passes (nothing to discard)");
        return;
      }

      cy.get("table tbody tr").first().find("td").eq(4).invoke("text").then((productName) => {
        const pName = productName.trim();
        cy.log(`First return product: "${pName}"`);

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

          cy.task("getInventoryByProductName", { productName: pName, locationId }).then((invRecord) => {
            if (!invRecord) {
              cy.log(`No inventory found for "${pName}" at location ${locationId} � test passes gracefully`);
              return;
            }
            const inv = invRecord as Record<string, unknown>;
            const inventoryId = inv.inventory_id as number;
            cy.log(`inventory_id from DB: ${inventoryId}, current qty: ${inv.quantity}`);

            cy.task("getInventoryQuantity", { inventoryId }).then((qtyBefore) => {
              cy.log(`DB Inventory qty BEFORE discard: ${qtyBefore} (inventory_id: ${inventoryId})`);

              cy.visit("/en/inventory/manage");
              cy.wait(2000);
              cy.contains("button", "Active").click({ force: true });
              cy.wait(1500);
              cy.get('input[placeholder="Search By Product"]').clear().type(pName.split(" ")[0]);
              cy.wait(500);
              cy.get("table tbody tr").first().find("td").eq(5).invoke("text").then((uiQtyBefore) => {
                cy.log(`UI Inventory quantity BEFORE discard: ${uiQtyBefore.trim()}`);
              });

              // Go back to returns — click first row, open details, click Delete
              cy.visit("/en/pos/return");
              cy.wait(2000);
              cy.get("table tbody tr").should("have.length.greaterThan", 0);
              cy.get("table tbody tr").first().click({ force: true });
              cy.wait(500);

              cy.contains("button", "Delete").should("exist");
              cy.contains("button", "Delete").scrollIntoView().click({ force: true });
              cy.wait(2000);

              cy.task("getInventoryQuantity", { inventoryId }).then((qtyAfter) => {
                cy.log(`DB Inventory qty AFTER discard: ${qtyAfter} (inventory_id: ${inventoryId})`);
                expect(qtyAfter).to.eq(qtyBefore);
                cy.log(`Confirmed: discard did NOT change inventory (${qtyBefore} → ${qtyAfter})`);

                cy.visit("/en/inventory/manage");
                cy.wait(2000);
                cy.contains("button", "Active").click({ force: true });
                cy.wait(1500);
                cy.get('input[placeholder="Search By Product"]').clear().type(pName.split(" ")[0]);
                cy.wait(500);
                cy.get("table tbody tr").first().find("td").eq(5).invoke("text").then((uiQtyAfter) => {
                  cy.log(`UI Inventory quantity AFTER discard: ${uiQtyAfter.trim()}`);
                });
              });
            });
          });
        });
      });
    });
  });
});


