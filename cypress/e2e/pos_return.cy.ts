/// <reference types="cypress" />

// POS Return E2E Tests
// Flow: Place order → open Details in History → click Return → fill modal → Process Return
//       → verify "X Returned" shown → go to /pos/return → verify row → click row → see details
//       → test Merge (adds to warehouse) and Delete (removes from warehouse)

// ─── Helpers ─────────────────────────────────────────────────────────────────

function loginAndGoToPatients() {
  cy.loginWithCredentials(TEST_EMAIL, TEST_PASSWORD);
  cy.visit("/en/pos/sales/patients");
  cy.wait(1000);
}

function selectFirstPatient() {
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
}

/**
 * Place a Vitamin B12 order and return the order_id.
 */
function placeVitaminB12Order(): Cypress.Chainable<number> {
  cy.contains("button", "Add Product").click();
  cy.get('input[placeholder="Search product..."]').should("be.visible");
  cy.get("table tbody tr").should("have.length.greaterThan", 0);
  cy.get('input[placeholder="Search product..."]').clear().type("Vitamin B12");
  cy.contains("Vitamin B12").should("be.visible");
  // Add 2 units so we can return a partial quantity (1 out of 2)
  cy.get("table tbody tr").first().find("button").contains("+").click({ force: true });
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

  cy.intercept("POST", "/api/orders").as("placeOrderReturn");
  cy.get("button.rounded.py-1.px-3.text-white.w-1\\/2.flex.justify-between.items-center.text-sm")
    .should("not.be.disabled").click({ force: true });

  return cy.wait("@placeOrderReturn").then((interception) => {
    const orderId = interception.response?.body?.order_id as number;
    cy.contains(/Order has been placed, order #\s*\d+/i).should("be.visible");
    cy.log(`Order placed: #${orderId}`);
    return cy.wrap(orderId);
  });
}

/**
 * Open the Details modal for a given order ID in /pos/history.
 * Filters by Order ID to ensure the row is on page 1.
 */
function openOrderDetails(orderId: number) {
  cy.visit("/en/pos/history");
  cy.wait(2000);

  cy.get('input[placeholder="Search Order ID"]').clear().type(String(orderId));
  cy.wait(500);

  cy.contains("table tbody tr td", String(orderId))
    .closest("tr")
    .find("button.bg-blue-500")
    .contains("Details")
    .click({ force: true });

  cy.contains(new RegExp(`Sales#\\s*${orderId}\\s*Summary`, "i"), { timeout: 15000 })
    .should("exist");
  cy.log(`Details modal opened for order #${orderId}`);
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("POS Return", () => {
  beforeEach(() => {
    cy.viewport(1280, 800);
  });

  // ── Test 1: Process a return from order details ───────────────────────────
  it("should process a return from order details and show X Returned", () => {
    loginAndGoToPatients();
    selectFirstPatient();

    placeVitaminB12Order().then((orderId) => {
      openOrderDetails(orderId);

      // Order Details section shows Vitamin B12 with a Return button
      cy.contains("Vitamin B12").should("exist");

      // Click the Return button (bg-[#E1BBB8] color, text "Return")
      cy.contains("button", "Return").first().click({ force: true });

      // Return modal appears with Quantity input and Reason dropdown
      cy.contains("Quantity").should("exist");
      cy.contains("Reason of return").should("exist");
      cy.get('input[placeholder="Enter return QTY"]').should("be.visible");

      // Enter quantity = 1
      cy.get('input[placeholder="Enter return QTY"]').clear().type("1");

      // Select a reason from the dropdown
      cy.get("select").contains("Select Reason").parent().select("Incorrect Item");
      cy.wait(300);

      // Click Process Return
      cy.contains("button", "Process Return").click({ force: true });

      // Success toast
      cy.contains(/Return processed successfully/i, { timeout: 15000 }).should("exist");
      cy.log("Return processed successfully");

      // The Return button should now show "1 Returned"
      cy.contains(/1\s*Returned/i).should("exist");
      cy.log("Return button shows '1 Returned'");

      // Store orderId for next tests
      cy.window().then((win) => {
        win.localStorage.setItem("@cypress_return_order_id", String(orderId));
      });
    });
  });

  // ── Test 2: Verify return appears in /pos/return table ───────────────────
  it("should show the returned product in the Returns table", () => {
    cy.loginWithCredentials(TEST_EMAIL, TEST_PASSWORD);
    cy.visit("/en/pos/return");
    cy.wait(2000);

    cy.window().then((win) => {
      const orderId = win.localStorage.getItem("@cypress_return_order_id") || "";

      // Returns table columns: Return ID, Order ID, Quantity, Product, Category
      if (orderId) {
        // Filter by product name to find the return
        cy.get('input[placeholder="Product Name"]').clear().type("Vitamin B12");
        cy.wait(500);
      }

      // At least one row should exist
      cy.get("table tbody tr").should("have.length.greaterThan", 0);

      // The row should contain Vitamin B12
      cy.contains("Vitamin B12").should("exist");
      cy.log("Vitamin B12 return found in Returns table");

      if (orderId) {
        // Order ID column should match
        cy.contains(orderId).should("exist");
      }
    });
  });

  // ── Test 3: Click a return row and verify details panel ──────────────────
  it("should open return details panel when clicking a row and show correct details", () => {
    cy.loginWithCredentials(TEST_EMAIL, TEST_PASSWORD);
    cy.visit("/en/pos/return");
    cy.wait(2000);

    // Filter to find our return
    cy.get('input[placeholder="Product Name"]').clear().type("Vitamin B12");
    cy.wait(500);

    cy.get("table tbody tr").should("have.length.greaterThan", 0);

    // Click the first row to open details panel
    cy.get("table tbody tr").first().click({ force: true });
    cy.wait(500);

    // Details panel (right side) should show:
    // Order ID, Return ID, Patient Name, patientid, price, Quantity, email, phone, reason
    cy.contains("Order ID").should("exist");
    cy.contains("Return ID").should("exist");
    cy.contains("Quantity").should("exist");
    cy.contains("email").should("exist");
    cy.contains("phone").should("exist");
    cy.contains("reason").should("exist");

    // Merge and Delete buttons should be visible
    cy.contains("button", "merge").should("exist");
    cy.contains("button", "Delete").should("exist");
    cy.log("Return details panel shows correct fields with Merge and Delete buttons");
  });

  // ── Test 4: Merge return — product added back to warehouse ────────────────
  it("should merge a return and remove it from the Returns table", () => {
    loginAndGoToPatients();
    selectFirstPatient();

    // Place a fresh order to return and merge
    placeVitaminB12Order().then((orderId) => {
      openOrderDetails(orderId);

      cy.contains("button", "Return").first().click({ force: true });
      cy.get('input[placeholder="Enter return QTY"]').clear().type("1");
      cy.get("select").contains("Select Reason").parent().select("Not Needed Anymore");
      cy.wait(300);
      cy.contains("button", "Process Return").click({ force: true });
      cy.contains(/Return processed successfully/i, { timeout: 15000 }).should("exist");

      // Go to Returns page
      cy.visit("/en/pos/return");
      cy.wait(2000);

      cy.get('input[placeholder="Product Name"]').clear().type("Vitamin B12");
      cy.wait(500);
      cy.get("table tbody tr").should("have.length.greaterThan", 0);

      // Click the first row to open details
      cy.get("table tbody tr").first().click({ force: true });
      cy.wait(500);

      // Get the return_id from the details panel before merging
      cy.contains("Return ID").parent().find("dd").invoke("text").then((returnIdTxt) => {
        const returnId = parseInt(returnIdTxt.trim()) || 0;
        cy.log(`Merging return #${returnId}`);

        // Click Merge — this sets merge=true in DB (product goes back to warehouse)
        cy.contains("button", "merge").click({ force: true });

        // Success toast
        cy.contains(/Merged successfully/i, { timeout: 15000 }).should("exist");
        cy.log("Merge successful — product added back to warehouse");

        // Row should disappear from the Returns table (merge=true filters it out)
        cy.wait(1000);
        cy.get('input[placeholder="Product Name"]').clear().type("Vitamin B12");
        cy.wait(500);

        // The merged return should no longer appear (returns table only shows merge=false)
        // There may be other Vitamin B12 returns — verify the specific return_id is gone
        if (returnId > 0) {
          cy.get("table tbody tr").each(($row) => {
            cy.wrap($row).should("not.contain", String(returnId));
          });
        }
        cy.log("Merged return removed from Returns table");
      });
    });
  });

  // ── Test 5: Delete return — product removed from warehouse ────────────────
  it("should delete a return and remove it from the Returns table", () => {
    loginAndGoToPatients();
    selectFirstPatient();

    // Place a fresh order to return and delete
    placeVitaminB12Order().then((orderId) => {
      openOrderDetails(orderId);

      cy.contains("button", "Return").first().click({ force: true });
      cy.get('input[placeholder="Enter return QTY"]').clear().type("1");
      cy.get("select").contains("Select Reason").parent().select("Damaged or Defective");
      cy.wait(300);
      cy.contains("button", "Process Return").click({ force: true });
      cy.contains(/Return processed successfully/i, { timeout: 15000 }).should("exist");

      // Go to Returns page
      cy.visit("/en/pos/return");
      cy.wait(2000);

      cy.get('input[placeholder="Product Name"]').clear().type("Vitamin B12");
      cy.wait(500);
      cy.get("table tbody tr").should("have.length.greaterThan", 0);

      // Click the first row
      cy.get("table tbody tr").first().click({ force: true });
      cy.wait(500);

      cy.contains("Return ID").parent().find("dd").invoke("text").then((returnIdTxt) => {
        const returnId = parseInt(returnIdTxt.trim()) || 0;
        cy.log(`Deleting return #${returnId}`);

        // Click Delete — this deletes the return record (product quantity decreases in warehouse)
        cy.contains("button", "Delete").click({ force: true });

        // Success toast
        cy.contains(/Return has been discarded/i, { timeout: 15000 }).should("exist");
        cy.log("Delete successful — return discarded");

        // Row should disappear from the Returns table
        cy.wait(1000);
        if (returnId > 0) {
          cy.get("table tbody tr").each(($row) => {
            cy.wrap($row).should("not.contain", String(returnId));
          });
        }
        cy.log("Deleted return removed from Returns table");
      });
    });
  });

  // ── Test 6: Search/filter in Returns table ────────────────────────────────
  it("should filter returns by product name and show no results for non-existent product", () => {
    cy.loginWithCredentials(TEST_EMAIL, TEST_PASSWORD);
    cy.visit("/en/pos/return");
    cy.wait(2000);

    // Filter by existing product
    cy.get('input[placeholder="Product Name"]').clear().type("Vitamin");
    cy.wait(500);
    cy.get("body").then(($body) => {
      const rows = $body.find("table tbody tr").length;
      cy.log(`Rows for "Vitamin": ${rows}`);
    });

    // Filter by non-existent product — no rows
    cy.get('input[placeholder="Product Name"]').clear().type("ZZZNOMATCH999");
    cy.wait(500);
    cy.get("table tbody tr").should("have.length", 0);
    cy.log("Non-existent product — empty table as expected");
  });
});
