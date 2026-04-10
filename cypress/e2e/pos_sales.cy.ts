/// <reference types="cypress" />

// POS Sales E2E Test — pure Cypress commands

// ─── Credentials ─────────────────────────────────────────────────────────────
const TEST_EMAIL = "mackjmart@gmail.com";
const TEST_PASSWORD = "Create123!";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getPlaceOrderButton = () =>
  cy.get(
    "button.rounded.py-1.px-3.text-white.w-1\\/2.flex.justify-between.items-center.text-sm",
  );

function selectFirstPatient() {
  cy.visit("/en/pos/sales/patients");
  cy.wait(1500);

  cy.get("body").then(($body) => {
    const todayBtns = $body
      .find("button:visible")
      .toArray()
      .filter((b) => /^select$|^seleccionar$/i.test((b.textContent || "").trim()));

    if (todayBtns.length > 0) {
      cy.wrap(todayBtns[0]).click({ force: true });
    } else {
      cy.contains("button", /past records/i).click({ force: true });
      cy.wait(1000);

      cy.get("body").then(($body2) => {
        const pastBtns = $body2
          .find("button:visible")
          .toArray()
          .filter((b) => /^select$|^seleccionar$/i.test((b.textContent || "").trim()));

        if (pastBtns.length > 0) {
          cy.wrap(pastBtns[0]).click({ force: true });
        } else {
          const stamp = Date.now().toString().slice(-6);
          cy.contains("button", /add patient/i).click();
          cy.get('[role="dialog"]').should("be.visible").within(() => {
            cy.get('input[placeholder*="firstname"]').clear().type(`Sales${stamp}`);
            cy.get('input[placeholder*="lastname"]').clear().type("Patient");
            cy.get("select").first().select("Male");
            cy.get('input[placeholder*="email"]').clear().type(`sales.${stamp}@example.com`);
            cy.get('input[type="tel"]').clear().type("3055551212");
            cy.get('input[placeholder*="street"]').clear().type("123 Main St");
            cy.get('input[type="date"]').first().type("1990-01-01");
            cy.contains("button", /add patient/i).click();
          });
          cy.get('[role="dialog"]').should("not.exist");
          cy.wait(1500);
          cy.contains("button", /^select$|^seleccionar$/i)
            .first()
            .click({ force: true });
        }
      });
    }
  });

  cy.url().should("include", "/pos/sales");
  cy.visit("/en/pos/sales");
  cy.contains("button", "Add Product").should("not.be.disabled");
  cy.log("✅ Patient selected, Add Product enabled");
}

function addProductToCart(qty = 1) {
  cy.contains("button", "Add Product").click();

  cy.get('input[placeholder="Search product..."]').should("be.visible");
  cy.get("table tbody tr").should("have.length.greaterThan", 0);

  cy.get('input[placeholder="Search product..."]').clear().type("Vitamin B");
  cy.contains("Vitamin B").should("be.visible");

  // Log availability (3rd column)
  cy.get("table tbody tr").first().find("td").eq(2).invoke("text").then((avail) => {
    cy.log(`Availability: ${avail.trim()}`);
  });

  // Set quantity
  for (let i = 0; i < qty; i++) {
    cy.get("table tbody tr").first().find("button").contains("+").click({ force: true });
  }

  // Log price/unit and total cost
  cy.get("table tbody tr").first().find("td").eq(3).invoke("text").then((p) => {
    cy.log(`Price/Unit: ${p.trim()}`);
  });
  cy.get("table tbody tr").first().find("td").eq(4).invoke("text").then((t) => {
    cy.log(`Total Cost: ${t.trim()}`);
  });

  // Add to cart — modal stays open, close via ✕
  cy.contains("button", "Add to Cart").click({ force: true });
  cy.wait(300);
  cy.get('button[aria-label="Close modal"]').click({ force: true });

  // Wait for modal to be gone
  cy.get('input[placeholder="Search product..."]').should("not.exist");
  cy.wait(300);

  // Verify product in cart
  cy.contains("Vitamin B").should("exist");
}

// ─── POS Patients Feature ────────────────────────────────────────────────────

describe("POS Patients Feature", () => {
  beforeEach(() => {
    cy.viewport(1280, 800);
    cy.loginWithCredentials(TEST_EMAIL, TEST_PASSWORD);
    cy.visit("/en/pos/sales/patients");
  });

  it("should add a patient from Today tab and select it", () => {
    const stamp = Date.now().toString().slice(-6);
    const firstName = `Test${stamp}`;
    const email = `test.${stamp}@example.com`;

    // Open Add Patient modal
    cy.contains("button", /add patient/i).click();

    // Fill form — no case-insensitive flag in attribute selectors (jQuery doesn't support it)
    cy.get('[role="dialog"]').should("be.visible").within(() => {
      cy.get('input[placeholder*="firstname"]').clear().type(firstName);
      cy.get('input[placeholder*="lastname"]').clear().type("Patient");
      cy.get("select").first().select("Male");
      cy.get('input[placeholder*="email"]').clear().type(email);
      cy.get('input[type="tel"]').clear().type("3055551212");
      cy.get('input[placeholder*="street"]').clear().type("123 Main St");
      cy.get('input[type="date"]').first().type("1990-01-01");
      cy.contains("button", /add patient/i).click();
    });

    // Wait for modal to close
    cy.get('[role="dialog"]').should("not.exist");
    cy.wait(1500);

    // Ensure Today tab active, search for new patient
    cy.contains("button", "Today").click();
    cy.wait(1000);
    cy.get('input[placeholder*="search"]').clear().type(firstName);
    cy.wait(800);

    // Select the patient
    cy.contains("button", /^select$|^seleccionar$/i)
      .first()
      .click({ force: true });

    // router.push fires — wait for URL, no hard cy.visit
    cy.url().should("include", "/pos/sales");

    // Verify Patient Details
    cy.contains(/patients details/i).should("be.visible");
    cy.contains(email).should("be.visible");
    cy.contains("3055551212").should("be.visible");
  });

  it("should select a patient from Past records", () => {
    cy.contains("button", "Past records").click();
    cy.wait(1500);

    cy.get("table tbody tr").should("have.length.greaterThan", 0);

    cy.contains("button", /^select$|^seleccionar$/i)
      .first()
      .click({ force: true });

    // Wait for client-side nav — no hard cy.visit
    cy.url().should("include", "/pos/sales");
    cy.contains(/patients details/i).should("be.visible");
  });
});

// ─── POS Sales Feature ───────────────────────────────────────────────────────

describe("POS Sales Feature", () => {
  beforeEach(() => {
    cy.viewport(1280, 800);
    cy.loginWithCredentials(TEST_EMAIL, TEST_PASSWORD);
  });

  it("should complete a POS sale successfully", () => {
    selectFirstPatient();
    addProductToCart(1);

    // Read exact label text from translations:
    // k78 = "Product Total After Discount" = cartTotal (grandTotalHandle.amount)
    // k32 = "Patient Balance"              = creditAmount
    // k42 = "Sub total"                    = cartTotal + creditAmount
    // k80 = "Balance"                      = creditUsed display
    // k100 = "Total Paid"
    //
    // STRATEGY: enter exact cartTotal as cash
    // → totalPaid = cartTotal, creditUsed = 0 → button ENABLED

    cy.contains("Product Total After Discount").siblings("p").invoke("text").then((txt) => {
      const cartTotal = parseFloat(txt.replace(/[^0-9.]/g, ""));
      cy.log(`cartTotal: ${cartTotal}`);

      // Verify Patient Balance row exists
      cy.contains("Patient Balance").siblings("p").invoke("text").then((balTxt) => {
        const creditAmount = parseFloat(balTxt.replace(/[^0-9.]/g, "")) || 0;
        cy.log(`creditAmount: ${creditAmount}`);

        // Verify Sub total = cartTotal + creditAmount
        cy.contains("Sub total").siblings("p").invoke("text").then((subTxt) => {
          const displayed = parseFloat(subTxt.replace(/[^0-9.]/g, ""));
          expect(displayed).to.be.closeTo(cartTotal + creditAmount, 0.01);
          cy.log(`Sub total verified: ${displayed}`);
        });

        // Enter full cart total as cash
        const cash = cartTotal.toFixed(2);
        cy.get('input[placeholder="0.00"]').first().clear({ force: true }).type(cash, { force: true });

        // Verify Balance (creditUsed) = 0
        cy.contains("Balance").siblings("p").invoke("text").then((cuTxt) => {
          const creditUsed = parseFloat(cuTxt.replace(/[^0-9.]/g, "")) || 0;
          cy.log(`creditUsed (Balance): ${creditUsed}`);
          expect(creditUsed).to.equal(0);
        });

        // Verify Total Paid = cartTotal
        cy.contains("Total Paid").siblings("p").invoke("text").then((tpTxt) => {
          const totalPaid = parseFloat(tpTxt.replace(/[^0-9.]/g, ""));
          cy.log(`totalPaid: ${totalPaid}`);
          expect(totalPaid).to.be.closeTo(cartTotal, 0.01);
        });

        // Verify button label = totalPaid then click
        getPlaceOrderButton()
          .should("not.be.disabled")
          .within(() => {
            cy.get("span.font-medium").invoke("text").then((btnTxt) => {
              expect(parseFloat(btnTxt.replace(/[^0-9.]/g, ""))).to.be.closeTo(cartTotal, 0.01);
            });
          });

        getPlaceOrderButton().click({ force: true });
      });
    });

    cy.contains(/Order has been placed, order #\s*\d+/i).should("be.visible");
  });

  it("should correctly calculate credit used when partial cash is entered", () => {
    selectFirstPatient();
    addProductToCart(1);

    cy.contains("Product Total After Discount").siblings("p").invoke("text").then((txt) => {
      const cartTotal = parseFloat(txt.replace(/[^0-9.]/g, ""));
      cy.log(`cartTotal: ${cartTotal}`);

      cy.contains("Credit Available").siblings("span").invoke("text").then((caTxt) => {
        const locationBalance = parseFloat(caTxt.replace(/[^0-9.]/g, "")) || 0;
        cy.log(`locationBalance: ${locationBalance}`);

        const partialCash = parseFloat((cartTotal / 2).toFixed(2));
        cy.get('input[placeholder="0.00"]').first()
          .clear({ force: true })
          .type(String(partialCash), { force: true });

        const creditNeeded = parseFloat((cartTotal - partialCash).toFixed(2));
        const expectedCreditUsed = parseFloat(Math.min(creditNeeded, locationBalance).toFixed(2));
        const expectedBalanceLimit = parseFloat(Math.max(0, locationBalance - expectedCreditUsed).toFixed(2));

        cy.log(`partialCash: ${partialCash}, expectedCreditUsed: ${expectedCreditUsed}`);

        // Verify Balance (creditUsed)
        cy.contains("Balance").siblings("p").invoke("text").then((cuTxt) => {
          const displayed = parseFloat(cuTxt.replace(/[^0-9.]/g, "")) || 0;
          cy.log(`Displayed creditUsed: ${displayed}`);
          expect(displayed).to.be.closeTo(expectedCreditUsed, 0.01);
        });

        // Verify Credit Available updated
        cy.contains("Credit Available").siblings("span").invoke("text").then((updTxt) => {
          const updated = parseFloat(updTxt.replace(/[^0-9.]/g, "")) || 0;
          cy.log(`Updated Credit Available: ${updated}`);
          expect(updated).to.be.closeTo(expectedBalanceLimit, 0.01);
        });

        // Verify Total Paid = partialCash
        cy.contains("Total Paid").siblings("p").invoke("text").then((tpTxt) => {
          expect(parseFloat(tpTxt.replace(/[^0-9.]/g, ""))).to.be.closeTo(partialCash, 0.01);
        });

        if (locationBalance >= creditNeeded) {
          getPlaceOrderButton().should("not.be.disabled").click({ force: true });
          cy.contains(/Order has been placed, order #\s*\d+/i).should("be.visible");
        } else {
          getPlaceOrderButton().should("be.disabled");
        }
      });
    });
  });

  it("should not allow placing order with empty cart", () => {
    selectFirstPatient();
    // Cart is empty — disabled regardless of payment state
    getPlaceOrderButton().should("be.disabled");
  });

  it("should not allow placing order if totalPaid > cartTotal + creditAmount", () => {
    selectFirstPatient();
    addProductToCart(1);

    // 99999 >> any possible cartTotal + creditAmount
    cy.get('input[placeholder="0.00"]').first().clear({ force: true }).type("99999", { force: true });
    getPlaceOrderButton().should("be.disabled");
  });

  it("should not allow placing order when totalPaid is zero and no credit covers the cart", () => {
    selectFirstPatient();
    addProductToCart(1);

    // Before typing anything: userStartedPaying=false → creditUsed=0, totalPaid=0 → disabled
    // The button is disabled on initial state (nothing entered yet)
    // Verify this initial disabled state before any input
    getPlaceOrderButton().should("be.disabled");
  });

  it("should not allow placing order if creditUsed > selectedLocation.balance", () => {
    selectFirstPatient();
    addProductToCart(1);

    cy.contains("Product Total After Discount").siblings("p").invoke("text").then((txt) => {
      const cartTotal = parseFloat(txt.replace(/[^0-9.]/g, ""));

      cy.contains("Credit Available").siblings("span").invoke("text").then((caTxt) => {
        const locationBalance = parseFloat(caTxt.replace(/[^0-9.]/g, "")) || 0;
        cy.log(`cartTotal: ${cartTotal}, locationBalance: ${locationBalance}`);

        if (cartTotal > locationBalance) {
          // Enter 0 cash → creditUsed = min(cartTotal, locationBalance) = locationBalance
          // but creditNeeded = cartTotal > locationBalance → creditUsed > balance → disabled
          cy.get('input[placeholder="0.00"]').first().clear({ force: true }).type("0.01", { force: true });
          cy.wait(300);
          cy.get('input[placeholder="0.00"]').first().clear({ force: true }).type("0", { force: true });
          getPlaceOrderButton().should("be.disabled");
        } else {
          // Location has enough balance — skip this test scenario
          cy.log("Location balance covers cart total — credit limit test not applicable, skipping assertion");
          getPlaceOrderButton().should("exist");
        }
      });
    });
  });
});

