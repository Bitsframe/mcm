/// <reference types="cypress" />

// POS History E2E Tests

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
 * Full POS sale flow — mirrors "should complete a POS sale successfully" exactly.
 * Returns the placed order_id.
 */
function completePOSSale(): Cypress.Chainable<number> {
  // Add Vitamin B12 to cart
  cy.contains("button", "Add Product").click();
  cy.get('input[placeholder="Search product..."]').should("be.visible");
  cy.get("table tbody tr").should("have.length.greaterThan", 0);
  cy.get('input[placeholder="Search product..."]').clear().type("Vitamin B12");
  cy.contains("Vitamin B12").should("be.visible");

  cy.get("table tbody tr").first().find("td").eq(2).invoke("text").then((a) => cy.log(`Availability: ${a.trim()}`));
  cy.get("table tbody tr").first().find("button").contains("+").click({ force: true });
  cy.get("table tbody tr").first().find("td").eq(3).invoke("text").then((p) => cy.log(`Price/Unit: ${p.trim()}`));
  cy.get("table tbody tr").first().find("td").eq(4).invoke("text").then((t) => cy.log(`Total Cost: ${t.trim()}`));

  cy.contains("button", "Add to Cart").click({ force: true });
  cy.wait(300);
  cy.get('button[aria-label="Close modal"]').click({ force: true });
  cy.get('input[placeholder="Search product..."]').should("not.exist");
  cy.wait(300);
  cy.contains("Vitamin B12").should("exist");

  // Read cart totals and verify
  cy.contains("h1", /Product Total After Discount/i).parent().find("p")
    .invoke("text").then((txt) => {
      const cartTotal = parseFloat(txt.replace(/[^0-9.]/g, ""));
      cy.log(`cartTotal: ${cartTotal}`);

      cy.contains("h1", /Patient Balance/i).parent().find("p").invoke("text").then((balTxt) => {
        const creditAmount = parseFloat(balTxt.replace(/[^0-9.]/g, "")) || 0;

        cy.contains("h1", /Sub total/i).parent().find("p").invoke("text").then((subTxt) => {
          const subTotal = parseFloat(subTxt.replace(/[^0-9.]/g, ""));
          expect(subTotal).to.be.closeTo(cartTotal + creditAmount, 0.01);
        });

        const cash = cartTotal.toFixed(2);
        cy.get('input[placeholder="0.00"]').first().clear({ force: true }).type(cash, { force: true });
        cy.wait(500);

        cy.contains("h1", /^Balance$/).parent().find("p").invoke("text").then((cuTxt) => {
          const creditUsed = parseFloat(cuTxt.replace(/[^0-9.]/g, "")) || 0;
          expect(creditUsed).to.equal(0);
        });

        cy.contains("h1", /Total Paid/i).parent().find("p").invoke("text").then((tpTxt) => {
          const totalPaid = parseFloat(tpTxt.replace(/[^0-9.]/g, ""));
          expect(totalPaid).to.be.closeTo(cartTotal, 0.01);
        });

        cy.get("button.rounded.py-1.px-3.text-white.w-1\\/2.flex.justify-between.items-center.text-sm")
          .should("not.be.disabled")
          .within(() => {
            cy.get("span.font-medium").invoke("text").then((btnTxt) => {
              expect(parseFloat(btnTxt.replace(/[^0-9.]/g, ""))).to.be.closeTo(cartTotal, 0.01);
            });
          });
      });
    });

  cy.intercept("POST", "/api/orders").as("placeOrderHistory");
  cy.get("button.rounded.py-1.px-3.text-white.w-1\\/2.flex.justify-between.items-center.text-sm")
    .click({ force: true });

  return cy.wait("@placeOrderHistory").then((interception) => {
    expect(interception.response?.statusCode).to.eq(200);
    expect(interception.response?.body.success).to.eq(true);
    const orderId = interception.response?.body.order_id as number;
    cy.contains(/Order has been placed, order #\s*\d+/i).should("be.visible");
    cy.log(`✅ Order placed: #${orderId}`);
    return cy.wrap(orderId);
  });
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("POS History", () => {
  beforeEach(() => {
    cy.viewport(1280, 800);
  });

  // ── Test 1: Place order then verify it appears in history ─────────────────
  it("should show the placed order in POS history with correct details", () => {
    loginAndGoToPatients();
    selectFirstPatient();
    completePOSSale().then((orderId) => {
      cy.visit("/en/pos/history");
      cy.wait(2000);

      // Order ID column should contain the placed order
      cy.contains(String(orderId)).should("exist");
      cy.log(`Order #${orderId} found in history table`);

      // Row should also show patient name, phone, email columns
      cy.get("table tbody tr").contains(String(orderId))
        .closest("tr")
        .within(() => {
          // Patient Name cell should not be empty
          cy.get("td").eq(1).invoke("text").then((name) => {
            cy.log(`Patient Name: ${name.trim()}`);
            expect(name.trim()).to.not.be.empty;
          });
          // Amount Received cell
          cy.get("td").eq(2).invoke("text").then((amt) => {
            cy.log(`Amount Received: ${amt.trim()}`);
            expect(amt.trim()).to.not.be.empty;
          });
        });
    });
  });

  // ── Test 2: Filter by Order ID ────────────────────────────────────────────
  it("should filter orders by Order ID and show no rows for non-existent ID", () => {
    loginAndGoToPatients();
    selectFirstPatient();
    completePOSSale().then((orderId) => {
      cy.visit("/en/pos/history");
      cy.wait(2000);

      // Filter by the placed order ID
      cy.get('input[placeholder="Order ID"]').clear().type(String(orderId));
      cy.wait(500);
      cy.contains(String(orderId)).should("exist");
      cy.log(`Filter by Order ID ${orderId} — row visible`);

      // Filter by non-existent ID — no rows shown (empty table body)
      cy.get('input[placeholder="Order ID"]').clear().type("999999999");
      cy.wait(500);
      cy.get("table tbody tr").should("have.length", 0);
      cy.log("Non-existent Order ID — no rows shown as expected");
    });
  });

  // ── Test 3: Filter by Patient Name ────────────────────────────────────────
  it("should filter orders by Patient Name and show no rows for non-existent name", () => {
    cy.loginWithCredentials(TEST_EMAIL, TEST_PASSWORD);
    cy.visit("/en/pos/history");
    cy.wait(2000);

    // Filter by a name that should exist (Alaina)
    cy.get('input[placeholder="Patient Name"]').clear().type("Alaina");
    cy.wait(500);
    cy.get("body").then(($body) => {
      const rows = $body.find("table tbody tr");
      if (rows.length > 0) {
        cy.log(`Found ${rows.length} rows for "Alaina"`);
        cy.get("table tbody tr").should("have.length.greaterThan", 0);
      } else {
        cy.log("No rows for Alaina — no patients with this name in this location");
      }
    });

    // Filter by non-existent name — no rows
    cy.get('input[placeholder="Patient Name"]').clear().type("ZZZNOMATCH999");
    cy.wait(500);
    cy.get("table tbody tr").should("have.length", 0);
    cy.log("Non-existent name — no rows shown as expected");
  });

  // ── Test 4: Filter by Phone Number ───────────────────────────────────────
  it("should filter orders by Phone Number and show no rows for non-existent phone", () => {
    cy.loginWithCredentials(TEST_EMAIL, TEST_PASSWORD);
    cy.visit("/en/pos/history");
    cy.wait(2000);

    // Filter by non-existent phone — no rows
    cy.get('input[placeholder="Phone Number"]').clear().type("0000000000");
    cy.wait(500);
    cy.get("table tbody tr").should("have.length", 0);
    cy.log("Non-existent phone — no rows shown as expected");
  });

  // ── Test 5: Filter by Email ───────────────────────────────────────────────
  it("should filter orders by Email and show no rows for non-existent email", () => {
    loginAndGoToPatients();
    selectFirstPatient();
    completePOSSale().then(() => {
      cy.visit("/en/pos/history");
      cy.wait(2000);

      // Filter by testcypress.com domain (our test patients use this)
      cy.get('input[placeholder="Email"]').clear().type("testcypress.com");
      cy.wait(500);
      cy.get("table tbody tr").should("have.length.greaterThan", 0);
      cy.log("Email filter shows matching rows");

      // Filter by non-existent email — no rows
      cy.get('input[placeholder="Email"]').clear().type("zzznomatch@nowhere.xyz");
      cy.wait(500);
      cy.get("table tbody tr").should("have.length", 0);
      cy.log("Non-existent email — no rows shown as expected");
    });
  });

  // ── Test 6: Filter by date — no rows for future date ─────────────────────
  it("should show no rows when filtering by a future date", () => {
    cy.loginWithCredentials(TEST_EMAIL, TEST_PASSWORD);
    cy.visit("/en/pos/history");
    cy.wait(2000);

    // Type a far future date — no orders will match
    cy.get('input[type="date"]').first().clear().type("2099-12-31");
    cy.wait(500);
    cy.get("table tbody tr").should("have.length", 0);
    cy.log("Future date filter — no rows shown as expected");
  });

  // ── Test 7: Open order details modal and verify Sales# Summary ────────────
  it("should open order details modal and show Sales# Summary with patient and order details", () => {
    loginAndGoToPatients();
    selectFirstPatient();
    completePOSSale().then((orderId) => {
      cy.visit("/en/pos/history");
      cy.wait(2000);

      // Find the row with this order ID and click the "Details" button
      cy.contains("table tbody tr td", String(orderId))
        .closest("tr")
        .find("button")
        .contains("Details")
        .click({ force: true });

      // Modal title: "Sales# <orderId> Summary"
      cy.contains(new RegExp(`Sales#\\s*${orderId}\\s*Summary`, "i"), { timeout: 15000 })
        .should("exist");
      cy.log(`Sales# ${orderId} Summary modal opened`);

      // Patient Details section
      cy.contains("Patient Details").should("exist");
      cy.contains("Patient Name:").should("exist");
      cy.contains("Phone:").should("exist");
      cy.contains("Email:").should("exist");
      cy.contains("Gender:").should("exist");
      cy.contains("Location:").should("exist");

      // Invoice Summary section
      cy.contains("Invoice Summary").should("exist");
      cy.contains("Invoice Date:").should("exist");
      cy.contains("Payment Method:").should("exist");
      cy.contains("Cash Amount:").should("exist");
      cy.contains("Gross Amount:").should("exist");
      cy.contains("Net Amount:").should("exist");

      // Order Details section — product table
      cy.contains("Order Details").should("exist");
      cy.contains("Vitamin B12").should("exist");
      cy.contains("Quantity").should("exist");
      cy.contains("Amount").should("exist");
    });
  });

  // ── Test 8: Delete order and verify removed ───────────────────────────────
  it("should delete an order from the history table and verify it is removed", () => {
    loginAndGoToPatients();
    selectFirstPatient();
    completePOSSale().then((orderId) => {
      cy.visit("/en/pos/history");
      cy.wait(2000);

      cy.contains(String(orderId)).should("exist");

      cy.intercept("POST", "/api/orders/delete").as("deleteOrder");

      // Click Delete button on the order row
      cy.contains("table tbody tr td", String(orderId))
        .closest("tr")
        .find("button")
        .contains("Delete")
        .click({ force: true });

      // ConfirmDeleteModal appears
      cy.contains(/Are you sure|confirm|delete this order/i, { timeout: 10000 }).should("exist");
      cy.contains("button", /confirm|yes|delete/i).last().click({ force: true });

      cy.wait("@deleteOrder").then((interception) => {
        expect(interception.response?.statusCode).to.eq(200);
        expect(interception.response?.body.success).to.eq(true);
        cy.log(`Order #${orderId} deleted`);
      });

      cy.wait(1000);
      cy.contains(String(orderId)).should("not.exist");

      cy.task("verifyOrderDeleted", { orderId }).then((exists) => {
        expect(exists).to.eq(false);
      });
    });
  });

  // ── Test 9: Sales History PDF generation ─────────────────────────────────
  it("should open sales history modal, apply date filter, and generate PDF", () => {
    cy.loginWithCredentials(TEST_EMAIL, TEST_PASSWORD);
    cy.visit("/en/pos/history");
    cy.wait(2000);

    cy.contains("button", /Sales History|Report/i).click();

    cy.get(".rdrDateRangePickerWrapper, .rdrCalendarWrapper", { timeout: 10000 }).should("exist");

    cy.contains("button", "Apply").click();

    cy.contains(/PDF generated successfully|generated/i, { timeout: 30000 }).should("exist");
  });

  // ── Test 10: Stats cards calculate correctly ──────────────────────────────
  it("should correctly calculate stats cards after placing an order", () => {
    cy.loginWithCredentials(TEST_EMAIL, TEST_PASSWORD);
    cy.visit("/en/pos/history");
    cy.wait(2000);

    // Read stats before
    cy.contains(/Products Sold/i).closest("div.bg-white").find("p.text-2xl").invoke("text")
      .then((beforeTxt) => {
        const productsBefore = parseInt(beforeTxt.trim()) || 0;
        cy.log(`Products sold before: ${productsBefore}`);

        cy.contains(/Total Amount Received/i).closest("div.bg-white").find("p.text-2xl").invoke("text")
          .then((amtBeforeTxt) => {
            const amountBefore = parseFloat(amtBeforeTxt.replace(/[^0-9.]/g, "")) || 0;
            cy.log(`Amount received before: ${amountBefore}`);

            // Place an order
            cy.visit("/en/pos/sales/patients");
            cy.wait(1000);
            selectFirstPatient();

            cy.contains("h1", /Product Total After Discount/i).parent().find("p")
              .invoke("text").then(() => {
                // Use completePOSSale to place the order
                completePOSSale().then(() => {
                  cy.visit("/en/pos/history");
                  cy.wait(2000);

                  // Products Sold should have increased
                  cy.contains(/Products Sold/i).closest("div.bg-white").find("p.text-2xl").invoke("text")
                    .then((afterTxt) => {
                      const productsAfter = parseInt(afterTxt.trim()) || 0;
                      cy.log(`Products sold after: ${productsAfter}`);
                      expect(productsAfter).to.be.greaterThan(productsBefore);
                    });

                  // Total Amount Received should have increased
                  cy.contains(/Total Amount Received/i).closest("div.bg-white").find("p.text-2xl").invoke("text")
                    .then((amtAfterTxt) => {
                      const amountAfter = parseFloat(amtAfterTxt.replace(/[^0-9.]/g, "")) || 0;
                      cy.log(`Amount received after: ${amountAfter}`);
                      expect(amountAfter).to.be.greaterThan(amountBefore);
                    });
                });
              });
          });
      });
  });
});
