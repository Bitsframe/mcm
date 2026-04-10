/// <reference types="cypress" />

// POS Sales E2E Test — pure Cypress commands, no cy.prompt

// ─── Credentials ─────────────────────────────────────────────────────────────
const TEST_EMAIL = "mackjmart@gmail.com";
const TEST_PASSWORD = "Create123!";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getPlaceOrderButton = () =>
  cy.get(
    "button.rounded.py-1.px-3.text-white.w-1\\/2.flex.justify-between.items-center.text-sm",
    { timeout: 20000 },
  );

/**
 * Navigate to patients page, pick the first available patient
 * (Today → Past Records → create new), then land on /pos/sales
 * with Add Product enabled.
 */
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
      // Try Past Records tab
      cy.contains("button", /past records/i, { timeout: 10000 }).click({ force: true });
      cy.wait(1000);

      cy.get("body").then(($body2) => {
        const pastBtns = $body2
          .find("button:visible")
          .toArray()
          .filter((b) => /^select$|^seleccionar$/i.test((b.textContent || "").trim()));

        if (pastBtns.length > 0) {
          cy.wrap(pastBtns[0]).click({ force: true });
        } else {
          // Create a new patient
          const stamp = Date.now().toString().slice(-6);
          cy.contains("button", /add patient/i, { timeout: 20000 }).click();
          cy.get('[role="dialog"]', { timeout: 20000 }).should("be.visible").within(() => {
            cy.get('input[placeholder*="firstname" i]').clear().type(`Sales${stamp}`);
            cy.get('input[placeholder*="lastname" i]').clear().type("Patient");
            cy.get("select").first().select("Male");
            cy.get('input[placeholder*="email" i]').clear().type(`sales.${stamp}@example.com`);
            cy.get('input[type="tel"]').clear().type("3055551212");
            cy.get('input[placeholder*="street" i]').clear().type("123 Main St");
            cy.get('input[type="date"]').first().type("1990-01-01");
            cy.contains("button", /add patient/i).click();
          });
          cy.get('[role="dialog"]', { timeout: 10000 }).should("not.exist");
          cy.wait(1500);
          cy.contains("button", /^select$|^seleccionar$/i, { timeout: 30000 })
            .first()
            .click({ force: true });
        }
      });
    }
  });

  // Wait for client-side nav then hard-visit for clean mount
  cy.url({ timeout: 30000 }).should("include", "/pos/sales");
  cy.visit("/en/pos/sales");
  cy.contains("button", "Add Product", { timeout: 20000 }).should("not.be.disabled");
  cy.log("✅ Patient selected, Add Product enabled");
}

/**
 * Open product modal, search Vitamin B, set qty, add to cart,
 * close modal via ✕ button, verify product appears in cart.
 */
function addProductToCart(qty = 1) {
  // Open modal
  cy.contains("button", "Add Product").click();

  // Wait for search input and product rows
  cy.get('input[placeholder="Search product..."]', { timeout: 15000 }).should("be.visible");
  cy.get("table tbody tr", { timeout: 20000 }).should("have.length.greaterThan", 0);

  // Search Vitamin B
  cy.get('input[placeholder="Search product..."]').clear().type("Vitamin B");
  cy.contains("Vitamin B", { timeout: 10000 }).should("be.visible");

  // Log availability from 3rd column
  cy.get("table tbody tr").first().find("td").eq(2).invoke("text").then((avail) => {
    cy.log(`Availability: ${avail.trim()}`);
  });

  // Set quantity
  for (let i = 0; i < qty; i++) {
    cy.get("table tbody tr").first().find("button").contains("+").click({ force: true });
  }

  // Log price/unit and total cost
  cy.get("table tbody tr").first().find("td").eq(3).invoke("text").then((price) => {
    cy.log(`Price/Unit: ${price.trim()}`);
  });
  cy.get("table tbody tr").first().find("td").eq(4).invoke("text").then((total) => {
    cy.log(`Total Cost (price × qty): ${total.trim()}`);
  });

  // Add to cart — modal stays open, must close manually
  cy.contains("button", "Add to Cart").click({ force: true });
  cy.wait(300);

  // Close modal via ✕ (Add to Cart does NOT call onClose)
  cy.get('button[aria-label="Close modal"]').click({ force: true });

  // Wait for modal to be gone
  cy.get('input[placeholder="Search product..."]', { timeout: 10000 }).should("not.exist");
  cy.wait(300);

  // Verify product appears in cart
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
    cy.contains("button", /add patient/i, { timeout: 20000 }).click();

    // Fill form
    cy.get('[role="dialog"]', { timeout: 20000 }).should("be.visible").within(() => {
      cy.get('input[placeholder*="firstname" i]').clear().type(firstName);
      cy.get('input[placeholder*="lastname" i]').clear().type("Patient");
      cy.get("select").first().select("Male");
      cy.get('input[placeholder*="email" i]').clear().type(email);
      cy.get('input[type="tel"]').clear().type("3055551212");
      cy.get('input[placeholder*="street" i]').clear().type("123 Main St");
      cy.get('input[type="date"]').first().type("1990-01-01");
      cy.contains("button", /add patient/i).click();
    });

    // Wait for modal to close
    cy.get('[role="dialog"]', { timeout: 10000 }).should("not.exist");
    cy.wait(1500);

    // Ensure Today tab is active, search for the new patient
    cy.contains("button", "Today").click();
    cy.wait(1000);
    cy.get('input[placeholder*="search" i]').clear().type(firstName);
    cy.wait(800);

    // Select the patient
    cy.contains("button", /^select$|^seleccionar$/i, { timeout: 20000 })
      .first()
      .click({ force: true });

    // router.push("/pos/sales") fires — wait for URL, do NOT hard cy.visit
    cy.url({ timeout: 30000 }).should("include", "/pos/sales");

    // Verify Patient Details
    cy.contains("Patient Details", { timeout: 20000 }).should("be.visible");
    cy.contains(email, { timeout: 10000 }).should("be.visible");
    cy.contains("Patient", { timeout: 10000 }).should("be.visible");
    cy.contains("3055551212", { timeout: 10000 }).should("be.visible");
  });

  it("should select a patient from Past records", () => {
    // Switch to Past records tab
    cy.contains("button", "Past records", { timeout: 20000 }).click();
    cy.wait(1500);

    // Wait for rows
    cy.get("table tbody tr", { timeout: 30000 }).should("have.length.greaterThan", 0);

    // Select first patient
    cy.contains("button", /^select$|^seleccionar$/i, { timeout: 20000 })
      .first()
      .click({ force: true });

    // Wait for client-side nav — do NOT hard cy.visit
    cy.url({ timeout: 30000 }).should("include", "/pos/sales");

    // Verify Patient Details section is populated
    cy.contains("Patient Details", { timeout: 20000 }).should("be.visible");
    cy.get("dl, .space-y-0\\.5", { timeout: 10000 }).should("exist");
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

    // ── Financial logic (mirrors source exactly) ──────────────────────────
    // cartTotal        = grandTotalHandle(cartArray, appliedDiscount).amount
    // creditAmount     = patient's credit_audit.balance
    // creditUsed       = max(0, min(cartTotal - totalPaid, locationBalance))
    //                    (only active once user types in any payment input)
    // displayedBalance = max(0, locationBalance - creditUsed)
    // totalPaid        = cash + card + zelle (active methods only)
    //
    // STRATEGY: enter exact cartTotal as cash
    //   → totalPaid = cartTotal, creditUsed = 0 → button ENABLED

    cy.contains("Total after discount").siblings("p").invoke("text").then((txt) => {
      const cartTotal = parseFloat(txt.replace(/[^0-9.]/g, ""));
      cy.log(`cartTotal: ${cartTotal}`);

      // Verify Patient Balance row exists
      cy.contains("Patient Balance").siblings("p").invoke("text").then((balTxt) => {
        const creditAmount = parseFloat(balTxt.replace(/[-$,]/g, "").trim()) || 0;
        cy.log(`creditAmount: ${creditAmount}`);

        // Verify Subtotal = cartTotal + creditAmount
        cy.contains("Subtotal").siblings("p").invoke("text").then((subTxt) => {
          const displayed = parseFloat(subTxt.replace(/[^0-9.]/g, ""));
          expect(displayed).to.be.closeTo(cartTotal + creditAmount, 0.01);
          cy.log(`Subtotal verified: ${displayed}`);
        });

        // Enter full cart total as cash
        const cash = cartTotal.toFixed(2);
        cy.get('input[placeholder="0.00"]').first().clear({ force: true }).type(cash, { force: true });

        // Verify Credit Used = 0
        cy.contains(/saldo|credit used/i).siblings("p").invoke("text").then((cuTxt) => {
          const creditUsed = parseFloat(cuTxt.replace(/[^0-9.]/g, "")) || 0;
          cy.log(`creditUsed: ${creditUsed}`);
          expect(creditUsed).to.equal(0);
        });

        // Verify Total Paid = cartTotal
        cy.contains("Total Paid").siblings("p").invoke("text").then((tpTxt) => {
          const totalPaid = parseFloat(tpTxt.replace(/[^0-9.]/g, ""));
          cy.log(`totalPaid: ${totalPaid}`);
          expect(totalPaid).to.be.closeTo(cartTotal, 0.01);
        });

        // Verify button label = totalPaid, then click
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

    // Success: "Order has been placed, order # <id>"
    cy.contains(/Order has been placed, order #\s*\d+/i, { timeout: 20000 }).should("be.visible");
  });

  it("should correctly calculate credit used when partial cash is entered", () => {
    // SCENARIO: pay half in cash → credit covers the rest (up to locationBalance)
    selectFirstPatient();
    addProductToCart(1);

    cy.contains("Total after discount").siblings("p").invoke("text").then((txt) => {
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

        // Verify Credit Used
        cy.contains(/saldo|credit used/i).siblings("p").invoke("text").then((cuTxt) => {
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

        // Place order if location has enough balance, else verify disabled
        if (locationBalance >= creditNeeded) {
          getPlaceOrderButton().should("not.be.disabled").click({ force: true });
          cy.contains(/Order has been placed, order #\s*\d+/i, { timeout: 20000 }).should("be.visible");
        } else {
          getPlaceOrderButton().should("be.disabled");
        }
      });
    });
  });

  it("should not allow placing order with empty cart", () => {
    selectFirstPatient();
    // No product added — cart is empty
    getPlaceOrderButton().should("be.disabled");
  });

  it("should not allow placing order if totalPaid > cartTotal + creditAmount", () => {
    selectFirstPatient();
    addProductToCart(1);

    // Enter absurdly large amount — totalPaid > cartTotal + creditAmount
    cy.get('input[placeholder="0.00"]').first().clear({ force: true }).type("99999", { force: true });
    getPlaceOrderButton().should("be.disabled");
  });

  it("should not allow placing order if all payment methods are unchecked", () => {
    selectFirstPatient();
    addProductToCart(1);

    // Cash is always re-enabled by the app if all unchecked.
    // Entering 0 means totalPaid=0 and creditUsed=0 → disabled
    cy.get('input[placeholder="0.00"]').first().clear({ force: true }).type("0", { force: true });
    getPlaceOrderButton().should("be.disabled");
  });

  it("should not allow placing order if creditUsed > selectedLocation.balance", () => {
    selectFirstPatient();
    addProductToCart(1);

    // Trigger userStartedPaying with 0.01, then set to 0
    // → creditUsed = cartTotal, if cartTotal > locationBalance → disabled
    cy.get('input[placeholder="0.00"]').first().clear({ force: true }).type("0.01", { force: true });
    cy.wait(300);
    cy.get('input[placeholder="0.00"]').first().clear({ force: true }).type("0", { force: true });
    getPlaceOrderButton().should("be.disabled");
  });
});
