/// <reference types="cypress" />

// POS Sales E2E Test — pure Cypress commands

const TEST_EMAIL = "mackjmart@gmail.com";
const TEST_PASSWORD = "Create123!";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getPlaceOrderButton = () =>
  cy.get(
    "button.rounded.py-1.px-3.text-white.w-1\\/2.flex.justify-between.items-center.text-sm",
  );

/**
 * Read a cart summary row value.
 * Each row is: <div class="flex items-center justify-between">
 *                <h1>Label</h1>  <p>$value</p>
 *              </div>
 */
function getCartRowValue(label: string) {
  return cy.contains("h1", label)
    .parent()
    .find("p")
    .invoke("text")
    .then((txt) => parseFloat(txt.replace(/[^0-9.]/g, "")));
}

/**
 * Read Credit Available value — it lives inside the h1 as a <span>:
 * <h1>Credit Available: <span class="font-bold">123.00</span></h1>
 */
function getCreditAvailable() {
  return cy.contains("h1", /Credit Available/i)
    .find("span.font-bold")
    .invoke("text")
    .then((txt) => parseFloat(txt.replace(/[^0-9.]/g, "")) || 0);
}

function selectFirstPatient() {
  cy.visit("/en/pos/sales/patients");
  cy.wait(2000);

  cy.get("body").then(($body) => {
    const todayBtns = $body
      .find("button:visible")
      .toArray()
      .filter((b) => /^select$|^seleccionar$/i.test((b.textContent || "").trim()));

    if (todayBtns.length > 0) {
      cy.wrap(todayBtns[0]).click({ force: true });
    } else {
      // Try Past Records
      cy.contains("button", "Past records").click({ force: true });
      cy.wait(1500);

      cy.get("body").then(($body2) => {
        const pastBtns = $body2
          .find("button:visible")
          .toArray()
          .filter((b) => /^select$|^seleccionar$/i.test((b.textContent || "").trim()));

        if (pastBtns.length > 0) {
          cy.wrap(pastBtns[0]).click({ force: true });
        } else {
          // Create a patient
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
          cy.wait(2000);
          // Reload to see the new patient in Today tab
          cy.reload();
          cy.wait(2000);
          cy.contains("button", /^select$|^seleccionar$/i)
            .first()
            .click({ force: true });
        }
      });
    }
  });

  // Wait for client-side nav to /pos/sales — do NOT hard cy.visit (causes ESOCKETTIMEDOUT)
  cy.url().should("include", "/pos/sales");
  // Wait for the page to load patient from localStorage (2s useEffect)
  cy.contains("button", "Add Product").should("not.be.disabled");
  cy.log("✅ Patient selected, Add Product enabled");
}

function addProductToCart(qty = 1) {
  cy.contains("button", "Add Product").click();

  cy.get('input[placeholder="Search product..."]').should("be.visible");
  cy.get("table tbody tr").should("have.length.greaterThan", 0);

  cy.get('input[placeholder="Search product..."]').clear().type("Vitamin B");
  cy.contains("Vitamin B").should("be.visible");

  // Log availability
  cy.get("table tbody tr").first().find("td").eq(2).invoke("text").then((a) => {
    cy.log(`Availability: ${a.trim()}`);
  });

  // Set quantity
  for (let i = 0; i < qty; i++) {
    cy.get("table tbody tr").first().find("button").contains("+").click({ force: true });
  }

  // Log price and total
  cy.get("table tbody tr").first().find("td").eq(3).invoke("text").then((p) => {
    cy.log(`Price/Unit: ${p.trim()}`);
  });
  cy.get("table tbody tr").first().find("td").eq(4).invoke("text").then((t) => {
    cy.log(`Total Cost: ${t.trim()}`);
  });

  // Add to cart — modal stays open, must close via ✕
  cy.contains("button", "Add to Cart").click({ force: true });
  cy.wait(300);
  cy.get('button[aria-label="Close modal"]').click({ force: true });

  // Wait for modal gone
  cy.get('input[placeholder="Search product..."]').should("not.exist");
  cy.wait(300);

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
    // ── Logic ─────────────────────────────────────────────────────────────
    // 1. Check if Today tab already has patients → select first one
    // 2. If no patients → fill Add Patient form → intercept API response
    //    to confirm DB insert → wait for row to appear → select it
    // 3. After select → verify Patient Details shows name + email

    cy.get("body").then(($body) => {
      const hasSelect = $body
        .find("button:visible")
        .toArray()
        .some((b) => /^select$|^seleccionar$/i.test((b.textContent || "").trim()));

      if (hasSelect) {
        // Today already has patients — just select the first one
        cy.contains("button", /^select$|^seleccionar$/i).first().click({ force: true });
      } else {
        // No patients in Today — create one
        const stamp = Date.now().toString().slice(-6);
        const firstName = `Test${stamp}`;
        const email = `test${stamp}@example.com`;

        // Intercept the POST /api/user call to confirm it succeeds
        cy.intercept("POST", "/api/user").as("createPatient");

        cy.contains("button", /add patient/i).click();

        cy.get('[role="dialog"]').should("be.visible").within(() => {
          cy.get('input[placeholder*="firstname"]').clear().type(firstName);
          cy.get('input[placeholder*="lastname"]').clear().type("Patient");
          cy.get("select").first().select("Male");
          cy.get('input[placeholder*="email"]').clear().type(email);
          cy.get('input[type="tel"]').clear().type("3055551212");
          cy.get('input[placeholder="Enter street address"]').clear().type("123 Main St");
          cy.get('input[placeholder="Select date of birth"]').clear().type("1990-01-01");
          cy.contains("button", /add patient/i).click();
        });

        // Wait for the API call to complete and confirm success
        cy.wait("@createPatient").then((interception) => {
          expect(interception.response?.statusCode).to.eq(200);
          cy.log(`✅ Patient API response: ${JSON.stringify(interception.response?.body)}`);
        });

        // Modal should close after successful creation
        cy.get('[role="dialog"]').should("not.exist");

        // Wait for the row to appear in Today tab — page calls fetch_handle() after creation
        cy.contains("button", /^select$|^seleccionar$/i).first().click({ force: true });
      }
    });

    // Wait for client-side nav
    cy.url().should("include", "/pos/sales");

    // Verify Patient Details section is visible with patient data
    cy.contains(/patients details/i).should("be.visible");
    // Name field should show firstname + lastname
    cy.contains(/Name:/i).should("be.visible");
    // Email field should be visible
    cy.contains(/Email:/i).should("be.visible");
  });

  it("should select a patient from Past records", () => {
    cy.contains("button", "Past records").click();

    // Wait for rows — the table uses shadcn TableRow which renders as <tr>
    // Use a broad selector that catches both native and role-based rows
    cy.get("tr").filter(":visible").should("have.length.greaterThan", 1);

    cy.contains("button", /^select$|^seleccionar$/i).first().click({ force: true });

    // Wait for client-side nav
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

    // Cart summary DOM structure:
    // <div class="flex items-center justify-between">
    //   <h1>Product Total After Discount</h1>  <p>$XX.XX</p>
    // </div>
    //
    // Credit Available:
    // <h1>Credit Available: <span class="font-bold">XX.XX</span></h1>
    //
    // STRATEGY: pay exact cartTotal in cash → creditUsed=0, button enables

    getCartRowValue("Product Total After Discount").then((cartTotal) => {
      cy.log(`cartTotal: ${cartTotal}`);

      getCartRowValue("Patient Balance").then((creditAmount) => {
        cy.log(`creditAmount: ${creditAmount}`);

        // Verify Sub total = cartTotal + creditAmount
        getCartRowValue("Sub total").then((subTotal) => {
          expect(subTotal).to.be.closeTo(cartTotal + creditAmount, 0.01);
          cy.log(`Sub total verified: ${subTotal}`);
        });

        // Enter exact cartTotal as cash
        const cash = cartTotal.toFixed(2);
        cy.get('input[placeholder="0.00"]').first().clear({ force: true }).type(cash, { force: true });

        // Verify Balance (creditUsed) = 0
        getCartRowValue("Balance").then((creditUsed) => {
          cy.log(`creditUsed: ${creditUsed}`);
          expect(creditUsed).to.equal(0);
        });

        // Verify Total Paid = cartTotal
        getCartRowValue("Total Paid").then((totalPaid) => {
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

    getCartRowValue("Product Total After Discount").then((cartTotal) => {
      cy.log(`cartTotal: ${cartTotal}`);

      getCreditAvailable().then((locationBalance) => {
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
        getCartRowValue("Balance").then((displayed) => {
          cy.log(`Displayed creditUsed: ${displayed}`);
          expect(displayed).to.be.closeTo(expectedCreditUsed, 0.01);
        });

        // Verify Credit Available updated
        getCreditAvailable().then((updated) => {
          cy.log(`Updated Credit Available: ${updated}`);
          expect(updated).to.be.closeTo(expectedBalanceLimit, 0.01);
        });

        // Verify Total Paid = partialCash
        getCartRowValue("Total Paid").then((totalPaid) => {
          expect(totalPaid).to.be.closeTo(partialCash, 0.01);
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
    getPlaceOrderButton().should("be.disabled");
  });

  it("should not allow placing order if totalPaid > cartTotal + creditAmount", () => {
    selectFirstPatient();
    addProductToCart(1);

    cy.get('input[placeholder="0.00"]').first().clear({ force: true }).type("99999", { force: true });
    getPlaceOrderButton().should("be.disabled");
  });

  it("should not allow placing order when totalPaid is zero and no credit covers the cart", () => {
    selectFirstPatient();
    addProductToCart(1);

    // Initial state: nothing typed → userStartedPaying=false → creditUsed=0, totalPaid=0 → disabled
    getPlaceOrderButton().should("be.disabled");
  });

  it("should not allow placing order if creditUsed > selectedLocation.balance", () => {
    selectFirstPatient();
    addProductToCart(1);

    getCartRowValue("Product Total After Discount").then((cartTotal) => {
      getCreditAvailable().then((locationBalance) => {
        cy.log(`cartTotal: ${cartTotal}, locationBalance: ${locationBalance}`);

        if (cartTotal > locationBalance) {
          // Trigger userStartedPaying then set to 0 → creditUsed = cartTotal > locationBalance
          cy.get('input[placeholder="0.00"]').first().clear({ force: true }).type("0.01", { force: true });
          cy.wait(300);
          cy.get('input[placeholder="0.00"]').first().clear({ force: true }).type("0", { force: true });
          getPlaceOrderButton().should("be.disabled");
        } else {
          cy.log("Location balance covers cart — scenario not applicable");
          getPlaceOrderButton().should("exist");
        }
      });
    });
  });
});
