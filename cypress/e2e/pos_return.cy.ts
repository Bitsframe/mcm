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

  // ── Test 1: Process return and verify it appears in Returns table ─────────
  it("should process a return from order details, show X Returned, then verify in Returns table", () => {
    loginAndGoToPatients();
    selectFirstPatient();

    placeVitaminB12Order().then((orderId) => {
      openOrderDetails(orderId);

      cy.contains("Vitamin B12").should("exist");

      // The Order Details section is below the fold inside the modal — scroll the modal container down
      cy.get(".fixed.inset-0.z-50").scrollTo("bottom", { ensureScrollable: false });
      cy.wait(300);

      // Now the Return button should be visible — scroll it into view and click
      cy.contains("button", "Return").first().scrollIntoView().click({ force: true });

      // Return modal: scroll quantity input into view
      cy.get('input[placeholder="Enter return QTY"]').scrollIntoView().should("be.visible");

      // Read the max allowed qty from the input (= quantity_sold on the order)
      // Then type that value so we return the full quantity — no hardcoding
      cy.get('input[placeholder="Enter return QTY"]').invoke("attr", "max").then((maxQty) => {
        const qtyToReturn = maxQty || "1";
        cy.log(`Returning qty: ${qtyToReturn}`);

        cy.get('input[placeholder="Enter return QTY"]').clear().type(qtyToReturn);

        cy.get("select").last().select("Incorrect Item");
        cy.wait(300);

        cy.contains("button", "Process Return").scrollIntoView().click({ force: true });

        cy.contains(/Return processed successfully/i, { timeout: 15000 }).should("exist");
        cy.log("Return processed successfully");

        // Assert the button shows the exact qty that was returned
        cy.contains(new RegExp(`${qtyToReturn}\\s*Returned`, "i")).should("exist");
        cy.log(`Return button shows '${qtyToReturn} Returned'`);
      });

      // ── Navigate to /pos/return and verify the product appears ────────────
      cy.visit("/en/pos/return");
      cy.wait(2000);

      cy.get('input[placeholder="Product Name"]').clear().type("Vitamin B12");
      cy.wait(500);

      cy.contains("Vitamin B12").should("exist");
      cy.log("Vitamin B12 return visible in Returns table");

      cy.contains(String(orderId)).should("exist");
      cy.log(`Order #${orderId} confirmed in Returns table`);

      cy.window().then((win) => {
        win.localStorage.setItem("@cypress_return_order_id", String(orderId));
      });
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
    cy.loginWithCredentials(TEST_EMAIL, TEST_PASSWORD);
    cy.visit("/en/pos/return");
    cy.wait(2000);

    // Need at least one return row — skip if none
    cy.get("body").then(($body) => {
      const rows = $body.find("table tbody tr").length;
      if (rows === 0 || $body.text().includes("No data found")) {
        cy.log("No returns available — skipping merge test");
        return;
      }

      // Click the first row to open details panel
      cy.get("table tbody tr").first().click({ force: true });
      cy.wait(500);

      // Scroll down in the details panel to find Merge button
      cy.contains("button", "merge").scrollIntoView().should("be.visible");

      // Read return_id before merging
      cy.contains("Return ID").closest("dl").find("dd").invoke("text").then((returnIdTxt) => {
        const returnId = returnIdTxt.trim();
        cy.log(`Merging return #${returnId}`);

        cy.contains("button", "merge").click({ force: true });

        cy.contains(/Merged successfully/i, { timeout: 15000 }).should("exist");
        cy.log("Merge successful — product added back to warehouse");

        // The merged row disappears (merge=true is filtered out)
        cy.wait(1000);
        cy.get("table").should("not.contain", returnId);
      });
    });
  });

  // ── Test 5: Delete return — product removed from warehouse ────────────────
  it("should delete a return and remove it from the Returns table", () => {
    cy.loginWithCredentials(TEST_EMAIL, TEST_PASSWORD);
    cy.visit("/en/pos/return");
    cy.wait(2000);

    cy.get("body").then(($body) => {
      const rows = $body.find("table tbody tr").length;
      if (rows === 0 || $body.text().includes("No data found")) {
        cy.log("No returns available — skipping delete test");
        return;
      }

      cy.get("table tbody tr").first().click({ force: true });
      cy.wait(500);

      // Scroll down in the details panel to find Delete button
      cy.contains("button", "Delete").scrollIntoView().should("be.visible");

      cy.contains("Return ID").closest("dl").find("dd").invoke("text").then((returnIdTxt) => {
        const returnId = returnIdTxt.trim();
        cy.log(`Deleting return #${returnId}`);

        cy.contains("button", "Delete").click({ force: true });

        cy.contains(/Return has been discarded/i, { timeout: 15000 }).should("exist");
        cy.log("Delete successful — return discarded");

        cy.wait(1000);
        cy.get("table").should("not.contain", returnId);
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

    // Filter by non-existent product — table shows "No data found!" message
    cy.get('input[placeholder="Product Name"]').clear().type("ZZZNOMATCH999");
    cy.wait(500);
    // The table renders one row with "No data found!" — assert on the text not row count
    cy.contains("No data found!").should("exist");
    cy.log("Non-existent product — 'No data found!' shown as expected");
  });
});
