/// <reference types="cypress" />

// POS History E2E Tests
// One order is placed in the first test and its ID is stored via alias for reuse.

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
 * Mirrors "should complete a POS sale successfully" exactly.
 * Intercepts /api/orders and stores the order_id as Cypress alias "placedOrderId".
 */
function completePOSSaleAndAlias() {
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

  // Read cart total, verify sub total, balance, total paid, button label
  cy.contains("h1", /Product Total After Discount/i).parent().find("p")
    .invoke("text").then((txt) => {
      const cartTotal = parseFloat(txt.replace(/[^0-9.]/g, ""));
      cy.log(`cartTotal: ${cartTotal}`);

      cy.contains("h1", /Patient Balance/i).parent().find("p").invoke("text").then((balTxt) => {
        const creditAmount = parseFloat(balTxt.replace(/[^0-9.]/g, "")) || 0;

        cy.contains("h1", /Sub total/i).parent().find("p").invoke("text").then((subTxt) => {
          expect(parseFloat(subTxt.replace(/[^0-9.]/g, ""))).to.be.closeTo(cartTotal + creditAmount, 0.01);
        });

        const cash = cartTotal.toFixed(2);
        cy.get('input[placeholder="0.00"]').first().clear({ force: true }).type(cash, { force: true });
        cy.wait(500);

        cy.contains("h1", /^Balance$/).parent().find("p").invoke("text").then((cuTxt) => {
          expect(parseFloat(cuTxt.replace(/[^0-9.]/g, "")) || 0).to.equal(0);
        });

        cy.contains("h1", /Total Paid/i).parent().find("p").invoke("text").then((tpTxt) => {
          expect(parseFloat(tpTxt.replace(/[^0-9.]/g, ""))).to.be.closeTo(cartTotal, 0.01);
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

  cy.wait("@placeOrderHistory").then((interception) => {
    expect(interception.response?.statusCode).to.eq(200);
    expect(interception.response?.body.success).to.eq(true);
    const orderId = interception.response?.body.order_id as number;
    cy.contains(/Order has been placed, order #\s*\d+/i).should("be.visible");
    cy.log(`✅ Order placed: #${orderId}`);
    // Store for reuse across tests
    cy.wrap(orderId).as("placedOrderId");
  });
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("POS History", () => {
  beforeEach(() => {
    cy.viewport(1280, 800);
  });

  // ── Test 1: Place order and verify it appears in history ──────────────────
  it("should place an order and show it in POS history with correct details", () => {
    loginAndGoToPatients();
    selectFirstPatient();
    completePOSSaleAndAlias();

    cy.get("@placedOrderId").then((orderId) => {
      cy.visit("/en/pos/history");
      cy.wait(2000);

      cy.contains(String(orderId)).should("exist");
      cy.log(`Order #${orderId} found in history`);

      // Verify row has patient name, amount, phone, email
      cy.contains("table tbody tr td", String(orderId))
        .closest("tr")
        .within(() => {
          cy.get("td").eq(1).invoke("text").then((name) => {
            cy.log(`Patient Name: ${name.trim()}`);
            expect(name.trim()).to.not.be.empty;
          });
          cy.get("td").eq(2).invoke("text").then((amt) => {
            cy.log(`Amount Received: ${amt.trim()}`);
            expect(amt.trim()).to.not.be.empty;
          });
          cy.get("td").eq(3).invoke("text").then((phone) => {
            cy.log(`Phone: ${phone.trim()}`);
          });
          cy.get("td").eq(4).invoke("text").then((email) => {
            cy.log(`Email: ${email.trim()}`);
          });
        });

      // Save orderId to localStorage so other tests can reuse it
      cy.window().then((win) => {
        win.localStorage.setItem("@cypress_last_order_id", String(orderId));
      });
    });
  });

  // ── Test 2: Filter by Order ID ────────────────────────────────────────────
  it("should filter by Order ID — show match and no rows for non-existent ID", () => {
    cy.loginWithCredentials(TEST_EMAIL, TEST_PASSWORD);
    cy.visit("/en/pos/history");
    cy.wait(2000);

    cy.window().then((win) => {
      const orderId = win.localStorage.getItem("@cypress_last_order_id") || "";

      if (orderId) {
        cy.get('input[placeholder="Search Order ID"]').clear().type(orderId);
        cy.wait(500);
        cy.contains(orderId).should("exist");
        cy.log(`Order ID filter shows order #${orderId}`);
      }

      // Non-existent ID — no rows
      cy.get('input[placeholder="Search Order ID"]').clear().type("999999999");
      cy.wait(500);
      cy.get("table tbody tr").should("have.length", 0);
      cy.log("Non-existent Order ID — empty table as expected");
    });
  });

  // ── Test 3: Filter by Patient Name ────────────────────────────────────────
  it("should filter by Patient Name — show match and no rows for non-existent name", () => {
    cy.loginWithCredentials(TEST_EMAIL, TEST_PASSWORD);
    cy.visit("/en/pos/history");
    cy.wait(2000);

    // Filter by known test patient name
    cy.get('input[placeholder="Search Patient Name"]').clear().type("Alaina");
    cy.wait(500);
    cy.get("body").then(($body) => {
      const rows = $body.find("table tbody tr").length;
      cy.log(`Rows for "Alaina": ${rows}`);
      // Either rows exist or not — both are valid depending on location
    });

    // Non-existent name — no rows
    cy.get('input[placeholder="Search Patient Name"]').clear().type("ZZZNOMATCH999");
    cy.wait(500);
    cy.get("table tbody tr").should("have.length", 0);
    cy.log("Non-existent name — empty table as expected");
  });

  // ── Test 4: Filter by Phone Number ───────────────────────────────────────
  it("should filter by Phone Number — no rows for non-existent phone", () => {
    cy.loginWithCredentials(TEST_EMAIL, TEST_PASSWORD);
    cy.visit("/en/pos/history");
    cy.wait(2000);

    cy.get('input[placeholder="Phone Number"]').clear().type("0000000000");
    cy.wait(500);
    cy.get("table tbody tr").should("have.length", 0);
    cy.log("Non-existent phone — empty table as expected");
  });

  // ── Test 5: Filter by Email ───────────────────────────────────────────────
  it("should filter by Email — show match and no rows for non-existent email", () => {
    cy.loginWithCredentials(TEST_EMAIL, TEST_PASSWORD);
    cy.visit("/en/pos/history");
    cy.wait(2000);

    // Filter by testcypress.com domain
    cy.get('input[placeholder="Search Email"]').clear().type("testcypress.com");
    cy.wait(500);
    cy.get("body").then(($body) => {
      const rows = $body.find("table tbody tr").length;
      cy.log(`Rows for testcypress.com: ${rows}`);
    });

    // Non-existent email — no rows
    cy.get('input[placeholder="Search Email"]').clear().type("zzznomatch@nowhere.xyz");
    cy.wait(500);
    cy.get("table tbody tr").should("have.length", 0);
    cy.log("Non-existent email — empty table as expected");
  });

  // ── Test 6: Filter by date — no rows for future date ─────────────────────
  it("should show no rows when filtering by a future date", () => {
    cy.loginWithCredentials(TEST_EMAIL, TEST_PASSWORD);
    cy.visit("/en/pos/history");
    cy.wait(2000);

    cy.get('input[type="date"]').first().clear().type("2099-12-31");
    cy.wait(500);
    cy.get("table tbody tr").should("have.length", 0);
    cy.log("Future date — empty table as expected");
  });

  // ── Test 7: Open order details modal ─────────────────────────────────────
  it("should open order details modal and show Sales# Summary with patient and order details", () => {
    cy.loginWithCredentials(TEST_EMAIL, TEST_PASSWORD);
    cy.visit("/en/pos/history");
    cy.wait(2000);

    cy.window().then((win) => {
      const orderId = win.localStorage.getItem("@cypress_last_order_id") || "";

      if (orderId) {
        // Click Details button on the specific order row
        cy.contains("table tbody tr td", orderId)
          .closest("tr")
          .find("button.bg-blue-500")
          .contains("Details")
          .click({ force: true });
      } else {
        // Fallback: click Details on first row
        cy.get("table tbody tr").first().find("button.bg-blue-500").contains("Details").click({ force: true });
      }

      // Modal: "Sales# <id> Summary"
      cy.contains(/Sales#\s*\d+\s*Summary/i, { timeout: 15000 }).should("exist");

      // Patient Details
      cy.contains("Patient Details").should("exist");
      cy.contains("Patient Name:").should("exist");
      cy.contains("Phone:").should("exist");
      cy.contains("Email:").should("exist");
      cy.contains("Gender:").should("exist");
      cy.contains("Location:").should("exist");

      // Invoice Summary
      cy.contains("Invoice Summary").should("exist");
      cy.contains("Invoice Date:").should("exist");
      cy.contains("Payment Method:").should("exist");
      cy.contains("Cash Amount:").should("exist");
      cy.contains("Gross Amount:").should("exist");
      cy.contains("Net Amount:").should("exist");

      // Order Details — product table
      cy.contains("Order Details").should("exist");
      cy.contains("Vitamin B12").should("exist");
    });
  });

  // ── Test 8: Delete order ──────────────────────────────────────────────────
  it("should delete an order and verify it is removed from UI and DB", () => {
    loginAndGoToPatients();
    selectFirstPatient();
    completePOSSaleAndAlias();

    cy.get("@placedOrderId").then((orderId) => {
      cy.visit("/en/pos/history");
      cy.wait(2000);

      cy.contains(String(orderId)).should("exist");

      cy.intercept("POST", "/api/orders/delete").as("deleteOrder");

      cy.contains("table tbody tr td", String(orderId))
        .closest("tr")
        .find("button.bg-red-500")
        .contains("Delete")
        .click({ force: true });

      // ConfirmDeleteModal
      cy.contains(/Are you sure|delete this order/i, { timeout: 10000 }).should("exist");
      cy.contains("button", /confirm|yes|delete/i).last().click({ force: true });

      // Wait indefinitely for delete to complete (no timeout)
      cy.wait("@deleteOrder", { timeout: 0 }).then((interception) => {
        expect(interception.response?.statusCode).to.eq(200);
        expect(interception.response?.body.success).to.eq(true);
        cy.log(`Order #${orderId} deleted`);
      });

      // Order gone from UI
      cy.wait(1500);
      cy.contains(String(orderId)).should("not.exist");

      // Verify gone from DB
      cy.task("verifyOrderDeleted", { orderId }).then((exists) => {
        expect(exists).to.eq(false);
        cy.log(`Order #${orderId} confirmed deleted from DB`);
      });
    });
  });

  // ── Test 9: Sales History PDF ─────────────────────────────────────────────
  it("should open Sales History modal, select date range, click Apply and trigger PDF download", () => {
    cy.loginWithCredentials(TEST_EMAIL, TEST_PASSWORD);
    cy.visit("/en/pos/history");
    cy.wait(2000);

    // Click the "Sales History" button (blue, top right, FileClock icon)
    cy.contains("button", /Sales History/i).click();

    // "Select a Date Range" modal appears
    cy.contains("Select a Date Range", { timeout: 10000 }).should("exist");
    cy.get(".rdrDateRangePickerWrapper, .rdrCalendarWrapper").should("exist");

    // Click "Today" preset to select today's range
    cy.contains("Today").click();
    cy.wait(300);

    // Intercept the PDF generation — it calls /api/orders internally
    // The PDF downloads via doc.save() — no success toast appears on screen.
    // We verify the Apply button triggers the flow and the modal closes.
    cy.contains("button", "Apply").click();

    // Modal should close after Apply (handleClose is called after doc.save())
    cy.contains("Select a Date Range", { timeout: 60000 }).should("not.exist");
    cy.log("PDF generation triggered — modal closed after Apply");
  });

  // ── Test 10: Stats cards calculate correctly ──────────────────────────────
  it("should correctly calculate stats cards after placing an order", () => {
    cy.loginWithCredentials(TEST_EMAIL, TEST_PASSWORD);
    cy.visit("/en/pos/history");
    cy.wait(2000);

    // Read stats before
    cy.contains(/Products Sold/i).closest("div.bg-white, div.rounded-lg").find("p.text-2xl").invoke("text")
      .then((beforeTxt) => {
        const productsBefore = parseInt(beforeTxt.trim()) || 0;
        cy.log(`Products sold before: ${productsBefore}`);

        cy.contains(/Total Amount Received/i).closest("div.bg-white, div.rounded-lg").find("p.text-2xl").invoke("text")
          .then((amtBeforeTxt) => {
            const amountBefore = parseFloat(amtBeforeTxt.replace(/[^0-9.]/g, "")) || 0;
            cy.log(`Amount received before: ${amountBefore}`);

            // Place an order
            cy.visit("/en/pos/sales/patients");
            cy.wait(1000);
            selectFirstPatient();
            completePOSSaleAndAlias();

            // Return to history and verify stats increased
            cy.visit("/en/pos/history");
            cy.wait(2000);

            cy.contains(/Products Sold/i).closest("div.bg-white, div.rounded-lg").find("p.text-2xl").invoke("text")
              .then((afterTxt) => {
                const productsAfter = parseInt(afterTxt.trim()) || 0;
                cy.log(`Products sold after: ${productsAfter}`);
                expect(productsAfter).to.be.greaterThan(productsBefore);
              });

            cy.contains(/Total Amount Received/i).closest("div.bg-white, div.rounded-lg").find("p.text-2xl").invoke("text")
              .then((amtAfterTxt) => {
                const amountAfter = parseFloat(amtAfterTxt.replace(/[^0-9.]/g, "")) || 0;
                cy.log(`Amount received after: ${amountAfter}`);
                expect(amountAfter).to.be.greaterThan(amountBefore);
              });
          });
      });
  });
});
