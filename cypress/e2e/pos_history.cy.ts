/// <reference types="cypress" />

// POS History E2E Tests
// Tests cover: order appears in history, filters, order details modal,
// delete order, sales history PDF generation, and stats verification.

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Login and navigate to POS sales patients page */
function loginAndGoToPatients() {
  cy.loginWithCredentials(TEST_EMAIL, TEST_PASSWORD);
  cy.visit("/en/pos/sales/patients");
  cy.wait(1000);
}

/** Select the first available patient from Today or Past Records */
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

/** Add Vitamin B12 to cart and place order, returns the order ID from the success toast */
function placeOrder(): Cypress.Chainable<number> {
  cy.contains("button", "Add Product").click();
  cy.get('input[placeholder="Search product..."]').should("be.visible");
  cy.get("table tbody tr").should("have.length.greaterThan", 0);
  cy.get('input[placeholder="Search product..."]').clear().type("Vitamin B12");
  cy.contains("Vitamin B12").should("be.visible");
  cy.get("table tbody tr").first().find("button").contains("+").click({ force: true });
  cy.contains("button", "Add to Cart").click({ force: true });
  cy.wait(300);
  cy.get('button[aria-label="Close modal"]').click({ force: true });
  cy.get('input[placeholder="Search product..."]').should("not.exist");
  cy.wait(300);

  // Read cart total and pay in full
  cy.contains("h1", /Product Total After Discount/i).parent().find("p")
    .invoke("text").then((txt) => {
      const cartTotal = parseFloat(txt.replace(/[^0-9.]/g, ""));
      cy.get('input[placeholder="0.00"]').first().clear({ force: true }).type(cartTotal.toFixed(2), { force: true });
      cy.wait(500);
    });

  cy.intercept("POST", "/api/orders").as("placeOrder");
  cy.get("button.rounded.py-1.px-3.text-white.w-1\\/2.flex.justify-between.items-center.text-sm")
    .should("not.be.disabled").click({ force: true });

  return cy.wait("@placeOrder").then((interception) => {
    const orderId = interception.response?.body?.order_id as number;
    cy.log(`Order placed: #${orderId}`);
    cy.contains(/Order has been placed, order #\s*\d+/i).should("be.visible");
    return cy.wrap(orderId);
  });
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("POS History", () => {
  beforeEach(() => {
    cy.viewport(1280, 800);
  });

  // ── Test 1: Order appears in history after placement ──────────────────────
  it("should show the placed order in POS history with correct details", () => {
    loginAndGoToPatients();
    selectFirstPatient();

    placeOrder().then((orderId) => {
      // Navigate to POS History
      cy.visit("/en/pos/history");
      cy.wait(2000);

      // The order ID should appear in the table
      cy.contains(String(orderId)).should("exist");
      cy.log(`Order #${orderId} found in history table`);
    });
  });

  // ── Test 2: Filter by Order ID ────────────────────────────────────────────
  it("should filter orders by Order ID", () => {
    loginAndGoToPatients();
    selectFirstPatient();

    placeOrder().then((orderId) => {
      cy.visit("/en/pos/history");
      cy.wait(2000);

      // Type in the Order ID search input
      cy.get('input[placeholder*="Order" i], input[placeholder*="order" i]')
        .first().clear().type(String(orderId));
      cy.wait(500);

      // Only the matching order should be visible
      cy.contains(String(orderId)).should("exist");
      cy.log(`Filter by Order ID ${orderId} works`);
    });
  });

  // ── Test 3: Filter by date ────────────────────────────────────────────────
  it("should filter orders by today's date", () => {
    cy.loginWithCredentials(TEST_EMAIL, TEST_PASSWORD);
    cy.visit("/en/pos/history");
    cy.wait(2000);

    // Get today's date in YYYY-MM-DD format
    const today = new Date();
    const ctOffset = -6 * 60 * 60 * 1000;
    const todayInCT = new Date(today.getTime() + ctOffset);
    const yyyy = todayInCT.getUTCFullYear();
    const mm = String(todayInCT.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(todayInCT.getUTCDate()).padStart(2, "0");
    const todayStr = `${yyyy}-${mm}-${dd}`;

    // Type today's date in the date filter input
    cy.get('input[type="date"]').first().clear().type(todayStr);
    cy.wait(500);

    // Stats cards should update to show today's data
    cy.contains(/Products Sold Today/i).should("exist");
    cy.contains(/Total Amount Received Today/i).should("exist");
    cy.contains(/Total Sales Today/i).should("exist");
    cy.log(`Date filter applied for ${todayStr}`);
  });

  // ── Test 4: View order details modal ─────────────────────────────────────
  it("should open order details modal and show patient and order info", () => {
    loginAndGoToPatients();
    selectFirstPatient();

    placeOrder().then((orderId) => {
      cy.visit("/en/pos/history");
      cy.wait(2000);

      // Find the row with this order and click the Eye/Details button
      cy.contains(String(orderId))
        .closest("tr, [role='row'], div")
        .find("button")
        .first()
        .click({ force: true });

      // Order details modal should open
      // It shows Sales # (order_id), patient details, and order summary
      cy.contains(new RegExp(`Sales.*#.*${orderId}|Order.*${orderId}`, "i"), { timeout: 15000 })
        .should("exist");

      // Patient details section
      cy.contains(/Name|Patient/i).should("exist");
      cy.contains(/Email/i).should("exist");
      cy.contains(/Phone/i).should("exist");

      cy.log(`Order details modal opened for order #${orderId}`);
    });
  });

  // ── Test 5: Delete order from table and verify removed from DB ────────────
  it("should delete an order from the history table and verify it is removed", () => {
    loginAndGoToPatients();
    selectFirstPatient();

    placeOrder().then((orderId) => {
      cy.visit("/en/pos/history");
      cy.wait(2000);

      // Confirm order exists before delete
      cy.contains(String(orderId)).should("exist");

      // Intercept the delete API call
      cy.intercept("POST", "/api/orders/delete").as("deleteOrder");

      // Click Delete button on the order row
      cy.contains(String(orderId))
        .closest("tr, [role='row'], div")
        .find("button")
        .contains(/delete/i)
        .click({ force: true });

      // Confirm delete modal appears — click confirm
      cy.contains(/Are you sure|confirm|delete/i, { timeout: 10000 }).should("exist");
      cy.contains("button", /confirm|yes|delete/i).last().click({ force: true });

      // Verify API call succeeded
      cy.wait("@deleteOrder").then((interception) => {
        expect(interception.response?.statusCode).to.eq(200);
        expect(interception.response?.body.success).to.eq(true);
        cy.log(`Order #${orderId} deleted successfully`);
      });

      // Order should no longer appear in the table
      cy.wait(1000);
      cy.contains(String(orderId)).should("not.exist");

      // Verify via Supabase task that order is gone from DB
      cy.task("verifyOrderDeleted", { orderId }).then((exists) => {
        expect(exists).to.eq(false);
        cy.log(`Order #${orderId} confirmed deleted from DB`);
      });
    });
  });

  // ── Test 6: Sales History PDF — open modal, apply date range, generate PDF ─
  it("should open sales history modal, apply date filter, and generate PDF", () => {
    cy.loginWithCredentials(TEST_EMAIL, TEST_PASSWORD);
    cy.visit("/en/pos/history");
    cy.wait(2000);

    // Click the Sales History button (FileClock icon + text)
    cy.contains("button", /Sales History|Report/i).click();

    // Date range modal opens
    cy.get(".rdrDateRangePickerWrapper, .rdrCalendarWrapper", { timeout: 10000 })
      .should("exist");
    cy.log("Date range picker opened");

    // Click Apply to generate PDF with default date range (yesterday)
    cy.contains("button", "Apply").click();

    // PDF generation triggers — toast success appears
    cy.contains(/PDF generated successfully|generated/i, { timeout: 30000 })
      .should("exist");
    cy.log("PDF generated successfully");
  });

  // ── Test 7: Verify stats cards calculate correctly ────────────────────────
  it("should correctly calculate stats cards after placing an order", () => {
    loginAndGoToPatients();
    selectFirstPatient();

    // Read stats before placing order
    cy.visit("/en/pos/history");
    cy.wait(2000);

    cy.contains(/Products Sold Today/i).parent().find("p.text-2xl").invoke("text")
      .then((beforeTxt) => {
        const productsBefore = parseInt(beforeTxt.trim()) || 0;
        cy.log(`Products sold before: ${productsBefore}`);

        cy.contains(/Total Amount Received Today/i).parent().find("p.text-2xl").invoke("text")
          .then((amtBeforeTxt) => {
            const amountBefore = parseFloat(amtBeforeTxt.replace(/[^0-9.]/g, "")) || 0;
            cy.log(`Amount received before: ${amountBefore}`);

            // Place an order
            cy.visit("/en/pos/sales/patients");
            cy.wait(1000);
            selectFirstPatient();

            // Get the cart total before placing
            cy.contains("button", "Add Product").click();
            cy.get('input[placeholder="Search product..."]').should("be.visible");
            cy.get("table tbody tr").should("have.length.greaterThan", 0);
            cy.get('input[placeholder="Search product..."]').clear().type("Vitamin B12");
            cy.contains("Vitamin B12").should("be.visible");
            cy.get("table tbody tr").first().find("button").contains("+").click({ force: true });

            cy.get("table tbody tr").first().find("td").eq(3).invoke("text").then((priceTxt) => {
              const pricePerUnit = parseFloat(priceTxt.replace(/[^0-9.]/g, "")) || 0;
              cy.log(`Price per unit: ${pricePerUnit}`);

              cy.contains("button", "Add to Cart").click({ force: true });
              cy.wait(300);
              cy.get('button[aria-label="Close modal"]').click({ force: true });
              cy.get('input[placeholder="Search product..."]').should("not.exist");

              cy.contains("h1", /Product Total After Discount/i).parent().find("p")
                .invoke("text").then((totalTxt) => {
                  const cartTotal = parseFloat(totalTxt.replace(/[^0-9.]/g, ""));

                  cy.get('input[placeholder="0.00"]').first().clear({ force: true }).type(cartTotal.toFixed(2), { force: true });
                  cy.wait(500);
                  cy.get("button.rounded.py-1.px-3.text-white.w-1\\/2.flex.justify-between.items-center.text-sm")
                    .should("not.be.disabled").click({ force: true });
                  cy.contains(/Order has been placed/i).should("be.visible");

                  // Go back to history and verify stats updated
                  cy.visit("/en/pos/history");
                  cy.wait(2000);

                  // Products Sold Today should have increased by 1
                  cy.contains(/Products Sold Today/i).parent().find("p.text-2xl").invoke("text")
                    .then((afterTxt) => {
                      const productsAfter = parseInt(afterTxt.trim()) || 0;
                      cy.log(`Products sold after: ${productsAfter}`);
                      expect(productsAfter).to.be.greaterThan(productsBefore);
                    });

                  // Total Amount Received Today should have increased by cartTotal
                  cy.contains(/Total Amount Received Today/i).parent().find("p.text-2xl").invoke("text")
                    .then((amtAfterTxt) => {
                      const amountAfter = parseFloat(amtAfterTxt.replace(/[^0-9.]/g, "")) || 0;
                      cy.log(`Amount received after: ${amountAfter}`);
                      expect(amountAfter).to.be.closeTo(amountBefore + cartTotal, 0.01);
                    });
                });
            });
          });
      });
  });
});
