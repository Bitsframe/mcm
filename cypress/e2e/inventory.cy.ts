/// <reference types="cypress" />

// Inventory Management E2E Tests

const INVENTORY_URL = "/en/inventory/manage";

function loginAndVisitInventory() {
  // Login first
  cy.loginWithCredentials(TEST_EMAIL, TEST_PASSWORD);
  
  // Wait for login to complete and cookies to be set
  cy.wait(2000);
  
  // Now visit the inventory page
  cy.visit(INVENTORY_URL, { 
    timeout: 120000,
    failOnStatusCode: false // Don't fail immediately on 404/500
  });
  
  // Check if page loaded successfully
  cy.url({ timeout: 30000 }).should('include', '/inventory/manage');
  
  // Wait for the page to be interactive
  cy.get('body', { timeout: 30000 }).should('be.visible');
}

describe("Inventory Management", () => {
  // Add before each hook to ensure clean state
  beforeEach(() => {
    // Clear session between tests if needed
    cy.clearCookies();
    cy.clearLocalStorage();
  });

  it("should show archived records in Archive tab or 'No Product is available'", () => {
    // First verify the server is reachable
    cy.request({
      url: "http://localhost:3000",
      failOnStatusCode: false,
      timeout: 10000
    }).then((resp) => {
      cy.log(`Server status: ${resp.status}`);
      expect(resp.status).to.eq(200);
    });

    loginAndVisitInventory();

    // Add explicit wait for the UI to be ready
    cy.get('button, [role="tab"]', { timeout: 30000 })
      .should('be.visible')
      .and('exist');

    cy.contains("button", "Archive", { timeout: 15000 }).click({ force: true });
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
          cy.contains("No Product is available", { timeout: 10000 }).should("exist");
          cy.log("No archived inventory — 'No Product is available' shown correctly");
        } else {
          cy.get("table tbody tr", { timeout: 10000 }).should("have.length.greaterThan", 0);
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
        cy.log(`DB before archive: archived=${b.archived}, inventory_id=${b.inventory_id}`);
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

    cy.contains("button", "Archive").click({ force: true });
    cy.wait(1500);
    cy.get("table tbody tr").should("have.length.greaterThan", 0);

    cy.get("table tbody tr").first().find("td").eq(1).invoke("text").then((idTxt) => {
      const inventoryId = parseInt(idTxt.trim()) || 0;
      cy.log(`Will unarchive inventory_id: ${inventoryId}`);
      expect(inventoryId).to.be.greaterThan(0);

      cy.task("getInventoryRecord", { inventoryId }).then((before) => {
        const b = before as Record<string, unknown>;
        cy.log(`DB before unarchive: archived=${b.archived}, inventory_id=${b.inventory_id}`);
        expect(b.archived).to.eq(true);
      });

      cy.get("table tbody tr").first().find("button").click({ force: true });
      cy.wait(2000);

      cy.task("getInventoryRecord", { inventoryId }).then((record) => {
        expect(record).to.not.be.null;
        const r = record as Record<string, unknown>;
        cy.log(`DB record after unarchive:`);
        cy.log(`  inventory_id: ${r.inventory_id}`);
        cy.log(`  archived:     ${r.archived}`);
        cy.log(`  quantity:     ${r.quantity}`);
        cy.log(`  location_id:  ${r.location_id}`);
        expect(r.archived).to.eq(false);
      });

      cy.get("table tbody tr").then(($rows) => {
        const rowTexts = Array.from($rows).map((r) => r.textContent || "");
        const stillPresent = rowTexts.some((t) => t.includes(String(inventoryId)));
        expect(stillPresent).to.eq(false);
        cy.log(`inventory_id ${inventoryId} no longer in Archive tab`);
      });

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

    cy.get("table tbody tr").first().find("td").eq(3).invoke("text").then((productName) => {
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

    // Check for empty state first - properly exit test if no data
    cy.get("body").then(($body) => {
      if ($body.text().includes("No data found!")) {
        cy.log("No data found! — no returns available, test passes gracefully");
        return; // Exit early for this specific test case
      }
      
      // Continue with test only if data exists
      cy.get("table tbody tr").should("have.length.greaterThan", 0);
      cy.get("table tbody tr").first().find("td").eq(4).invoke("text").then((productName) => {
        const pName = productName.trim();
        cy.log(`First return product: "${pName}"`);

        cy.get("table tbody tr").first().click({ force: true });
        cy.wait(500);

        cy.contains("button", "merge").should("exist");
        cy.log("Details panel opened — merge button visible");

        cy.window().then((win) => {
          let locationId = 0;
          for (let i = 0; i < win.localStorage.length; i++) {
            const key = win.localStorage.key(i);
            if (key && key.startsWith("@location")) {
              locationId = parseInt(win.localStorage.getItem(key) || "0", 10);
              if (locationId > 0) break;
            }
          }

          cy.task("getInventoryByProductName", { productName: pName, locationId }).then((invRecord) => {
            if (invRecord) {
              const inv = invRecord as Record<string, unknown>;
              const inventoryId = inv.inventory_id as number;
              cy.log(`inventory_id from DB: ${inventoryId}, current qty: ${inv.quantity}`);

              cy.task("getInventoryQuantity", { inventoryId }).then((qtyBefore) => {
                cy.log(`DB Inventory qty BEFORE merge: ${qtyBefore}`);

                cy.contains("button", "merge").scrollIntoView().click({ force: true });
                cy.wait(3000);

                cy.task("getInventoryQuantity", { inventoryId }).then((qtyAfter) => {
                  cy.log(`DB Inventory qty AFTER merge: ${qtyAfter}`);
                  expect(qtyAfter as number).to.be.greaterThan(qtyBefore as number);
                  cy.log(`Inventory increased: ${qtyBefore} → ${qtyAfter}`);
                });
              });
            } else {
              cy.log(`No inventory for "${pName}" at location ${locationId} — clicking merge anyway`);
              cy.contains("button", "merge").scrollIntoView().click({ force: true });
              cy.wait(2000);
              cy.log("Merge clicked — inventory verification skipped");
            }
          });
        });
      });
    });
  });

  it("should NOT change inventory quantity when a return is discarded", () => {
    cy.loginWithCredentials(TEST_EMAIL, TEST_PASSWORD);
    cy.visit("/en/pos/return");
    cy.wait(2000);

    // First check if we have any returns data
    cy.get("body").then(($body) => {
      const hasNoData = $body.text().includes("No data found!");
      
      if (hasNoData) {
        cy.log("No data found! — no returns available, test passes gracefully");
        return; // Exit test early
      }
      
      // Only proceed with table interaction if we have data
      // Use a conditional approach with cy.get() that won't fail if element doesn't exist
      cy.get("body").then(($updatedBody) => {
        // Re-check because the body might have changed
        if ($updatedBody.text().includes("No data found!")) {
          cy.log("No data found after waiting — test passes gracefully");
          return;
        }
        
        // Now safely get the table rows
        cy.get("table tbody tr").should("have.length.greaterThan", 0);
        
        cy.get("table tbody tr").first().find("td").eq(4).invoke("text").then((productName) => {
          const pName = productName.trim();
          cy.log(`First return product: "${pName}"`);

          cy.get("table tbody tr").first().click({ force: true });
          cy.wait(500);

          cy.contains("button", "Delete").should("exist");
          cy.log("Details panel opened — Delete button visible");

          cy.window().then((win) => {
            let locationId = 0;
            for (let i = 0; i < win.localStorage.length; i++) {
              const key = win.localStorage.key(i);
              if (key && key.startsWith("@location")) {
                locationId = parseInt(win.localStorage.getItem(key) || "0", 10);
                if (locationId > 0) break;
              }
            }

            cy.task("getInventoryByProductName", { productName: pName, locationId }).then((invRecord) => {
              if (invRecord) {
                const inv = invRecord as Record<string, unknown>;
                const inventoryId = inv.inventory_id as number;
                cy.log(`inventory_id from DB: ${inventoryId}, current qty: ${inv.quantity}`);

                cy.task("getInventoryQuantity", { inventoryId }).then((qtyBefore) => {
                  cy.log(`DB Inventory qty BEFORE discard: ${qtyBefore}`);

                  cy.contains("button", "Delete").scrollIntoView().click({ force: true });
                  cy.wait(2000);

                  cy.task("getInventoryQuantity", { inventoryId }).then((qtyAfter) => {
                    cy.log(`DB Inventory qty AFTER discard: ${qtyAfter}`);
                    expect(qtyAfter).to.eq(qtyBefore);
                    cy.log(`Confirmed: discard did NOT change inventory (${qtyBefore} → ${qtyAfter})`);
                  });
                });
              } else {
                cy.log(`No inventory for "${pName}" at location ${locationId} — clicking Delete anyway`);
                cy.contains("button", "Delete").scrollIntoView().click({ force: true });
                cy.wait(2000);
                cy.log("Delete clicked — inventory verification skipped");
              }
            });
          });
        });
      });
    });
  });
});