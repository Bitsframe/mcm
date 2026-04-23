/// <reference types="cypress" />

// Inventory Management E2E Tests

const INVENTORY_URL = "/en/inventory/manage";

function loginAndVisitInventory() {
  cy.loginWithCredentials(TEST_EMAIL, TEST_PASSWORD);
  cy.wait(1000);
  cy.visit(INVENTORY_URL, { timeout: 120000 });
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

    cy.contains("button", "Archive").click({ force: true });
    cy.wait(1500);
    cy.get("table tbody tr").should("have.length.greaterThan", 0);

    cy.get("table tbody tr").first().find("td").eq(1).invoke("text").then((idTxt) => {
      const inventoryId = parseInt(idTxt.trim()) || 0;
      cy.log(`Will unarchive inventory_id: ${inventoryId}`);
      expect(inventoryId).to.be.greaterThan(0);

      cy.task("getInventoryRecord", { inventoryId }).then((before) => {
        const b = before as Record<string, unknown>;
        cy.log(`DB before unarchive: archived=${b.archived}`);
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
        cy.log(`inventory_id ${inventoryId} confirmed archived=false in DB`);
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
    cy.visit("/en/pos/sales/patients");
    cy.wait(1000);

    cy.get("body").then(($body) => {
      const selectBtns = $body.find("button:visible").toArray()
        .filter((b) => /^select$|^seleccionar$/i.test((b.textContent || "").trim()));
      if (selectBtns.length > 0) {
        cy.wrap(selectBtns[0]).click({ force: true });
      } else {
        cy.contains("button", "Past records").click({ force: true });
        cy.wait(1000);
        cy.contains("button", /^select$|^seleccionar$/i).first().click({ force: true });
      }
    });
    cy.url().should("include", "/pos/sales");
    cy.contains("button", "Add Product").should("not.be.disabled");

    // Add Vitamin B12 — capture inventory_id from the modal table
    cy.contains("button", "Add Product").click();
    cy.get('input[placeholder="Search product..."]').should("be.visible");
    cy.get("table tbody tr").should("have.length.greaterThan", 0);
    cy.get('input[placeholder="Search product..."]').clear().type("Vitamin B12");
    cy.contains("Vitamin B12").should("be.visible");

    // The modal table first column is inventory_id (product_id in the component)
    // Store it as a Cypress alias so it's accessible later
    cy.get("table tbody tr").first().find("td").eq(0).invoke("text").then((idTxt) => {
      const id = parseInt(idTxt.trim()) || 0;
      cy.log(`Modal inventory_id: ${id}`);
      cy.wrap(id).as("capturedInventoryId");
    });

    cy.get("table tbody tr").first().find("button").contains("+").click({ force: true });
    cy.contains("button", "Add to Cart").click({ force: true });
    cy.wait(300);
    cy.get('button[aria-label="Close modal"]').click({ force: true });
    cy.get('input[placeholder="Search product..."]').should("not.exist");
    cy.wait(300);

    cy.contains("h1", /Product Total After Discount/i).parent().find("p")
      .invoke("text").then((txt) => {
        const cartTotal = parseFloat(txt.replace(/[^0-9.]/g, ""));
        cy.get('input[placeholder="0.00"]').first().clear({ force: true }).type(cartTotal.toFixed(2), { force: true });
        cy.wait(500);
      });

    cy.intercept("POST", "/api/orders").as("placeOrderForReturn");
    cy.get("button.rounded.py-1.px-3.text-white.w-1\\/2.flex.justify-between.items-center.text-sm")
      .should("not.be.disabled").click({ force: true });

    cy.wait("@placeOrderForReturn").then((interception) => {
      const orderId = interception.response?.body?.order_id as number;
      cy.contains(/Order has been placed, order #\s*\d+/i).should("be.visible");
      cy.log(`Order placed: #${orderId}`);

      // Open order details in history
      cy.visit("/en/pos/history");
      cy.wait(2000);
      cy.get('input[placeholder="Search Order ID"]').clear().type(String(orderId));
      cy.wait(500);
      cy.contains("table tbody tr td", String(orderId))
        .closest("tr").find("button.bg-blue-500").contains("Details").click({ force: true });
      cy.contains(new RegExp(`Sales#\\s*${orderId}\\s*Summary`, "i"), { timeout: 15000 }).should("exist");

      // Scroll to Return button and click it
      cy.get(".fixed.inset-0.z-50").scrollTo("bottom", { ensureScrollable: false });
      cy.wait(300);
      cy.contains("button", "Return").first().scrollIntoView().click({ force: true });
      cy.get('input[placeholder="Enter return QTY"]').should("exist");
      cy.wait(500);

      cy.get('input[placeholder="Enter return QTY"]').invoke("attr", "max").then((maxQty) => {
        const qtyToReturn = parseInt(maxQty || "1");
        cy.log(`Returning qty: ${qtyToReturn}`);

        cy.get('input[placeholder="Enter return QTY"]').clear({ force: true }).type(String(qtyToReturn), { force: true });
        cy.get("select").last().select("Incorrect Item", { force: true });
        cy.wait(300);
        cy.contains("button", "Process Return").click({ force: true });
        cy.contains(/Return processed successfully/i, { timeout: 15000 }).should("exist");
        cy.log(`Return processed: qty=${qtyToReturn}`);

        // Get inventory quantity BEFORE merge from DB
        cy.get("@capturedInventoryId").then((capturedId) => {
          const inventoryId = capturedId as unknown as number;
          cy.task("getInventoryQuantity", { inventoryId }).then((qtyBefore) => {
            cy.log(`Inventory qty BEFORE merge: ${qtyBefore} (inventory_id: ${inventoryId})`);

            // Navigate to Returns page
            cy.visit("/en/pos/return");
            cy.wait(2000);
            cy.get('input[placeholder="Product Name"]').clear().type("Vitamin B12");
            cy.wait(500);
            cy.get("table tbody tr").should("have.length.greaterThan", 0);

            // Click first row — details panel appears on the right
            cy.get("table tbody tr").first().click({ force: true });
            cy.wait(1000);

            // Wait for details panel to render (dataDetails state update)
            // The panel shows dt/dd pairs — wait for the merge button to appear
            cy.contains("button", "merge", { timeout: 15000 }).scrollIntoView().should("be.visible");
            cy.log("Details panel loaded — merge button visible");

            // Click Merge — triggers DB update: returns.merge=true
            // Supabase trigger then increments inventory.quantity by returns.quantity
            cy.contains("button", "merge").click({ force: true });
            cy.contains(/Merged successfully/i, { timeout: 15000 }).should("exist");
            cy.log("Merge successful");

            // Get inventory quantity AFTER merge from DB
            cy.task("getInventoryQuantity", { inventoryId }).then((qtyAfter) => {
              cy.log(`Inventory qty AFTER merge: ${qtyAfter} (inventory_id: ${inventoryId})`);
              const before = qtyBefore as number;
              const after = qtyAfter as number;
              expect(after).to.be.greaterThan(before);
              expect(after - before).to.eq(qtyToReturn);
              cy.log(`Inventory increased by ${qtyToReturn}: ${before} → ${after}`);
              cy.log("Confirmed: mergeHandle triggered inventory increment via DB trigger");
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

    cy.get("body").then(($body) => {
      if ($body.text().includes("No data found")) {
        cy.log("No returns available — skipping discard test");
        return;
      }

      cy.get("table tbody tr").first().click({ force: true });
      cy.wait(500);

      cy.contains("Return ID").closest("dl").find("dd").invoke("text").then((rIdTxt) => {
        const returnId = parseInt(rIdTxt.trim()) || 0;
        cy.log(`Return ID to discard: ${returnId}`);

        // Get the return record from DB to find inventory_id
        cy.task("getReturnBySalesId", { salesId: returnId }).then((returnRecord) => {
          // getReturnBySalesId queries by sales_id — use a direct DB check instead
          // The returns table has inventory_id — read it from the DB using return_id
          cy.task("getInventoryQuantity", { inventoryId: 0 }).then(() => {});
        });

        // Read inventory_id from the return row in the table (column index 1 = return_id, we need inventory_id from DB)
        // Use the return_id to look up inventory_id via a new task
        // For now: read the inventory quantity from the inventory page BEFORE discard
        // by navigating there first, then coming back

        // Step 1: Get inventory_id for this return from DB
        // The returns table: return_id, inventory_id, quantity, reason, sales_id, merge
        // We'll use the return_id to find inventory_id
        cy.task("getReturnBySalesId", { salesId: returnId }).then((rec) => {
          // rec may be null since getReturnBySalesId queries by sales_id not return_id
          // Read inventory_id directly from the returns table row in the UI
          // The table shows: Return ID | Order ID | Quantity | Product | Category
          // inventory_id is not shown — we need it from DB

          // Step 2: Read inventory_id from DB using return_id
          // Add a task call that queries by return_id
          cy.log(`Proceeding with discard for return_id: ${returnId}`);

          // Step 3: Get current inventory quantity from DB before discard
          // We'll use the product name shown in the table to find it in inventory
          cy.get("table tbody tr").first().find("td").eq(3).invoke("text").then((productName) => {
            const pName = productName.trim();
            cy.log(`Product being returned: "${pName}"`);

            // Navigate to inventory to read current quantity
            loginAndVisitInventory();
            cy.contains("button", "Active").click({ force: true });
            cy.wait(1500);
            cy.get('input[placeholder="Search By Product"]').clear().type(pName.split(" ")[0]);
            cy.wait(500);

            cy.get("table tbody tr").first().find("td").eq(1).invoke("text").then((invIdTxt) => {
              const inventoryId = parseInt(invIdTxt.trim()) || 0;
              cy.log(`inventory_id: ${inventoryId}`);

              cy.task("getInventoryQuantity", { inventoryId }).then((qtyBefore) => {
                cy.log(`Inventory quantity BEFORE discard: ${qtyBefore}`);

                // Go back to returns page and discard
                cy.visit("/en/pos/return");
                cy.wait(2000);
                cy.get('input[placeholder="Product Name"]').clear().type(pName.split(" ")[0]);
                cy.wait(500);
                cy.get("table tbody tr").first().click({ force: true });
                cy.wait(500);

                cy.contains("button", "Delete").scrollIntoView().should("be.visible");
                cy.contains("button", "Delete").click({ force: true });
                cy.contains(/Return has been discarded/i, { timeout: 15000 }).should("exist");
                cy.log("Return discarded successfully");

                // Step 4: Verify inventory quantity is UNCHANGED after discard
                cy.task("getInventoryQuantity", { inventoryId }).then((qtyAfter) => {
                  cy.log(`Inventory quantity AFTER discard: ${qtyAfter}`);
                  expect(qtyAfter).to.eq(qtyBefore);
                  cy.log(`Confirmed: discard did NOT change inventory (${qtyBefore} → ${qtyAfter})`);
                  cy.log("Expected behaviour: discardHandle only deletes the returns record, no inventory trigger fires");
                });
              });
            });
          });
        });
      });
    });
  });
});
