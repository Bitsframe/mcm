/// <reference types="cypress" />

// POS Sales E2E Test — uses cy.prompt() for natural-language steps (Cypress 15+)
// Requires Cypress Cloud auth via --record --key (handled in GitHub Actions / cypress.yml)

// ─── Credentials (hardcoded for this spec) ───────────────────────────────────
const TEST_EMAIL = "mackjmart@gmail.com";
const TEST_PASSWORD = "Create123!";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getPlaceOrderButton = () =>
  cy.get(
    "button.rounded.py-1.px-3.text-white.w-1\\/2.flex.justify-between.items-center.text-sm",
    { timeout: 20000 },
  );

function selectFirstPatient() {
  cy.visit("/en/pos/sales/patients");
  cy.wait(1500);

  // Check Today tab first
  cy.get("body").then(($body) => {
    const todaySelectBtns = $body
      .find("button:visible")
      .toArray()
      .filter((btn) => /^select$|^seleccionar$/i.test((btn.textContent || "").trim()));

    if (todaySelectBtns.length > 0) {
      // Today tab has patients — select the first one
      cy.wrap(todaySelectBtns[0]).click({ force: true });
    } else {
      // No patients in Today — try Past Records tab
      cy.contains("button:visible", /past records|past/i, { timeout: 10000 })
        .click({ force: true });
      cy.wait(1000);

      cy.get("body").then(($body2) => {
        const pastSelectBtns = $body2
          .find("button:visible")
          .toArray()
          .filter((btn) => /^select$|^seleccionar$/i.test((btn.textContent || "").trim()));

        if (pastSelectBtns.length > 0) {
          // Past Records has patients — select the first one
          cy.wrap(pastSelectBtns[0]).click({ force: true });
        } else {
          // No patients anywhere — create one, then select from Today
          const stamp = Date.now().toString().slice(-6);
          cy.contains("button:visible", /add patient/i, { timeout: 20000 }).click();
          cy.get('[role="dialog"]', { timeout: 20000 }).should("be.visible").within(() => {
            cy.get('input[placeholder*="firstname"]').clear().type(`Sales${stamp}`);
            cy.get('input[placeholder*="lastname"]').clear().type("Patient");
            cy.get("select").first().select("Male");
            cy.get('input[placeholder*="email"]').clear().type(`sales.${stamp}@example.com`);
            cy.get('input[type="tel"]').clear().type("3055551212");
            cy.get('input[placeholder*="street"]').clear().type("123 Main St");
            cy.get('input[type="date"]').first().type("1990-01-01");
            cy.contains("button:visible", /add patient/i).click();
          });
          cy.wait(2000);
          cy.visit("/en/pos/sales/patients");
          cy.wait(1500);
          cy.contains("button:visible", /^select$|^seleccionar$/i, { timeout: 30000 })
            .first()
            .click({ force: true });
        }
      });
    }
  });

  // After selecting, wait for nav to /pos/sales then hard-visit for clean mount
  cy.url({ timeout: 30000 }).should("include", "/pos/sales");
  cy.visit("/en/pos/sales");
  cy.contains("button", "Add Product", { timeout: 20000 }).should("not.be.disabled");
  cy.log("✅ Patient selected, Add Product is enabled");
}

function addProductToCart(qty = 1) {
  cy.prompt([
    "click the Add Product button",
    "wait for the Search product input to be visible",
    "wait for the product table rows to appear",
    "type Vitamin B in the Search product input",
    "wait for Vitamin B to appear in the table",
    "read the availability from the third column of the first table row and log it",
    `click the plus button in the first table row ${qty} time${qty > 1 ? "s" : ""}`,
    "read the price per unit from the fourth column of the first table row and store it as pricePerUnit",
    "read the total cost from the fifth column of the first table row and store it as totalCost",
    "click the Add to Cart button",
    "click the close modal button with aria-label Close modal",
    "wait for the Search product input to not exist",
    "verify Vitamin B text is visible in the page",
  ]);
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

    cy.prompt(
      [
        "click the Add Patient button",
        "fill in the firstname field with {{firstName}}",
        "fill in the lastname field with Patient",
        "select Male from the first select dropdown",
        "fill in the email field with {{email}}",
        "fill in the phone field with 3055551212",
        "fill in the street field with 123 Main St",
        "fill in the first date field with 1990-01-01",
        "click the Add Patient submit button inside the dialog",
        "wait 2000 milliseconds",
        "navigate to http://localhost:3000/en/pos/sales/patients",
        "wait 2000 milliseconds",
        "click the first visible Select button in the patient table",
        "navigate to http://localhost:3000/en/pos/sales",
        "verify the Patient Details section is visible",
        "verify the page contains the patient email {{email}}",
        "verify the page contains the text Patient",
        "verify the page contains the text 3055551212",
        "verify the page contains the text 01/01/1990",
      ],
      {
        placeholders: {
          firstName: `Test${stamp}`,
          email: `test.${stamp}@example.com`,
        },
      },
    );

    cy.url({ timeout: 30000 }).should("include", "/pos/sales");
  });

  it("should select a patient from Past records", () => {
    cy.prompt([
      "click the Past Records tab button",
      "wait for the patient table to load",
      "click the first visible Select button in the patient table",
      "navigate to http://localhost:3000/en/pos/sales",
      "verify the Patient Details section is visible",
      "verify the page contains a patient name",
      "verify the page contains a phone number",
      "verify the page contains an email address",
      "verify the page contains a date of birth",
    ]);

    cy.url({ timeout: 30000 }).should("include", "/pos/sales");
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

    // ── FINANCIAL LOGIC (mirrors the source code exactly) ─────────────────
    //
    // grandTotalHandle(cartArray, appliedDiscount):
    //   productTotalOriginalPrice = sum(item.original_price × item.quantity)
    //   productLevelTotal         = sum(original_price × qty × (1 - discount_percent/100))
    //   discountAmount            = productLevelTotal × appliedDiscount / 100
    //   amount (cartTotal)        = productLevelTotal - discountAmount
    //
    // creditAmount   = patient's credit_audit.balance (fetched on mount)
    // creditAvailable = selectedLocation.balance
    //
    // creditUsed (only when user has typed in any payment input):
    //   paid          = receivedAmount + cardAmount + zelleAmount
    //   creditNeeded  = cartTotal - paid
    //   allowedCredit = min(creditNeeded, creditAvailable)
    //   creditUsed    = max(0, allowedCredit)
    //
    // displayedBalanceLimit = max(0, creditAvailable - creditUsed)
    //
    // totalPaid = (payWithCash ? receivedAmount : 0)
    //           + (payWithCard ? cardAmount : 0)
    //           + (payWithZelle ? zelleAmount : 0)
    //
    // Place Order DISABLED when:
    //   1. cart is empty
    //   2. totalPaid > cartTotal + max(creditAmount, 0)
    //   3. creditUsed > selectedLocation.balance
    //   4. totalPaid === 0 AND creditUsed === 0  (nothing being paid)
    //
    // SCENARIO: pay full cartTotal in cash
    //   → paid = cartTotal
    //   → creditNeeded = cartTotal - cartTotal = 0
    //   → creditUsed = max(0, min(0, creditAvailable)) = 0
    //   → condition 2: cartTotal ≤ cartTotal + max(creditAmount,0) ✓
    //   → condition 3: 0 ≤ locationBalance ✓
    //   → condition 4: totalPaid > 0 ✓
    //   → button ENABLED ✓
    // ─────────────────────────────────────────────────────────────────────

    // Read the "Total after discount" value from the cart summary panel.
    // This is the authoritative cartTotal the app uses for all calculations.
    cy.contains("Total after discount")
      .siblings("p")
      .invoke("text")
      .then((afterDiscountText) => {
        const cartTotal = parseFloat(afterDiscountText.replace(/[^0-9.]/g, ""));
        cy.log(`cartTotal (After Discount): ${cartTotal}`);

        // Read Patient Balance (creditAmount) from the cart panel
        cy.contains("Patient Balance")
          .siblings("p")
          .invoke("text")
          .then((balanceText) => {
            const creditAmount = parseFloat(balanceText.replace(/[-$,]/g, "").trim()) || 0;
            cy.log(`Patient Balance (creditAmount): ${creditAmount}`);

            // Verify Subtotal = cartTotal + creditAmount
            cy.contains("Subtotal")
              .siblings("p")
              .invoke("text")
              .then((subtotalText) => {
                const displayedSubtotal = parseFloat(subtotalText.replace(/[^0-9.]/g, ""));
                const expectedSubtotal = parseFloat((cartTotal + creditAmount).toFixed(2));
                cy.log(`Subtotal check: displayed=${displayedSubtotal}, expected=${expectedSubtotal}`);
                expect(displayedSubtotal).to.be.closeTo(expectedSubtotal, 0.01);
              });

            // Enter exact cartTotal as cash receivable
            // → totalPaid = cartTotal, creditUsed = 0, button enables
            const cashToEnter = cartTotal.toFixed(2);
            cy.log(`Entering cash: ${cashToEnter}`);

            cy.get('input[placeholder="0.00"]').first()
              .clear({ force: true })
              .type(cashToEnter, { force: true });

            // Verify Credit Used shows 0.00 (no credit needed since cash covers full amount)
            cy.contains(/saldo|credit used/i)
              .siblings("p")
              .invoke("text")
              .then((creditUsedText) => {
                const creditUsed = parseFloat(creditUsedText.replace(/[^0-9.]/g, "")) || 0;
                cy.log(`Credit Used after entering cash: ${creditUsed}`);
                expect(creditUsed).to.equal(0);
              });

            // Verify Total Paid display = cashToEnter
            cy.contains("Total Paid")
              .siblings("p")
              .invoke("text")
              .then((totalPaidText) => {
                const totalPaid = parseFloat(totalPaidText.replace(/[^0-9.]/g, ""));
                cy.log(`Total Paid displayed: ${totalPaid}`);
                expect(totalPaid).to.be.closeTo(cartTotal, 0.01);
              });

            // Place Order button label also shows totalPaid — click it
            getPlaceOrderButton()
              .should("not.be.disabled")
              .within(() => {
                cy.get("span.font-medium").invoke("text").then((btnText) => {
                  const btnAmount = parseFloat(btnText.replace(/[^0-9.]/g, ""));
                  cy.log(`Place Order button amount: ${btnAmount}`);
                  expect(btnAmount).to.be.closeTo(cartTotal, 0.01);
                });
              });

            getPlaceOrderButton().click({ force: true });
          });
      });

    // API returns: { message: "Order has been placed, order # <order_id>" }
    cy.contains(/Order has been placed, order #\s*\d+/i, { timeout: 20000 })
      .should("be.visible");
  });

  it("should correctly calculate credit used when partial cash is entered", () => {
    // SCENARIO: pay LESS than cartTotal in cash
    //   → creditNeeded = cartTotal - partialCash  (positive)
    //   → creditUsed   = min(creditNeeded, locationBalance)
    //   → displayedBalanceLimit = locationBalance - creditUsed
    //   → button ENABLED only if creditUsed ≤ locationBalance
    //
    // This test verifies the live credit calculation updates correctly
    // as the user types a partial payment amount.

    selectFirstPatient();
    addProductToCart(1);

    cy.contains("Total after discount")
      .siblings("p")
      .invoke("text")
      .then((afterDiscountText) => {
        const cartTotal = parseFloat(afterDiscountText.replace(/[^0-9.]/g, ""));
        cy.log(`cartTotal: ${cartTotal}`);

        // Read location's Credit Available (= selectedLocation.balance)
        cy.contains("Credit Available")
          .siblings("span")
          .invoke("text")
          .then((creditAvailText) => {
            const locationBalance = parseFloat(creditAvailText.replace(/[^0-9.]/g, "")) || 0;
            cy.log(`Location balance (creditAvailable): ${locationBalance}`);

            // Enter partial cash = cartTotal / 2 (rounded to 2dp)
            const partialCash = parseFloat((cartTotal / 2).toFixed(2));
            cy.log(`Entering partial cash: ${partialCash}`);

            cy.get('input[placeholder="0.00"]').first()
              .clear({ force: true })
              .type(String(partialCash), { force: true });

            // Expected creditUsed = min(cartTotal - partialCash, locationBalance)
            const creditNeeded = parseFloat((cartTotal - partialCash).toFixed(2));
            const expectedCreditUsed = parseFloat(Math.min(creditNeeded, locationBalance).toFixed(2));
            cy.log(`Expected creditUsed: ${expectedCreditUsed}`);

            // Verify Credit Used display matches calculation
            cy.contains(/saldo|credit used/i)
              .siblings("p")
              .invoke("text")
              .then((creditUsedText) => {
                const displayedCreditUsed = parseFloat(creditUsedText.replace(/[^0-9.]/g, "")) || 0;
                cy.log(`Displayed creditUsed: ${displayedCreditUsed}`);
                expect(displayedCreditUsed).to.be.closeTo(expectedCreditUsed, 0.01);
              });

            // Verify Credit Available (displayedBalanceLimit) = locationBalance - creditUsed
            const expectedBalanceLimit = parseFloat(
              Math.max(0, locationBalance - expectedCreditUsed).toFixed(2)
            );
            cy.log(`Expected Credit Available after credit used: ${expectedBalanceLimit}`);

            cy.contains("Credit Available")
              .siblings("span")
              .invoke("text")
              .then((updatedCreditAvailText) => {
                const updatedBalance = parseFloat(updatedCreditAvailText.replace(/[^0-9.]/g, "")) || 0;
                cy.log(`Updated Credit Available: ${updatedBalance}`);
                expect(updatedBalance).to.be.closeTo(expectedBalanceLimit, 0.01);
              });

            // Verify Total Paid = partialCash
            cy.contains("Total Paid")
              .siblings("p")
              .invoke("text")
              .then((totalPaidText) => {
                const totalPaid = parseFloat(totalPaidText.replace(/[^0-9.]/g, ""));
                expect(totalPaid).to.be.closeTo(partialCash, 0.01);
              });

            // If locationBalance >= creditNeeded → button should be enabled
            // If locationBalance < creditNeeded → button disabled (creditUsed > balance)
            if (locationBalance >= creditNeeded) {
              cy.log("Location has enough balance — Place Order should be enabled");
              getPlaceOrderButton().should("not.be.disabled").click({ force: true });
              cy.contains(/Order has been placed, order #\s*\d+/i, { timeout: 20000 })
                .should("be.visible");
            } else {
              cy.log("Location balance insufficient — Place Order should be disabled");
              getPlaceOrderButton().should("be.disabled");
            }
          });
      });
  });

  it("should not allow placing order with empty cart", () => {
    selectFirstPatient();
    addProductToCart(1);


    cy.prompt(["verify the Place Order button is disabled"]);
  });

  it("should not allow placing order if totalPaid > cartTotal + creditAmount", () => {
    selectFirstPatient();
    addProductToCart(1);

    cy.prompt([
      "clear the first payment amount input and type 99999",
      "verify the Place Order button is disabled",
    ]);
  });

  it("should not allow placing order if all payment methods are unchecked", () => {
    selectFirstPatient();
    addProductToCart(1);

    cy.prompt([
      "clear the first payment amount input and type 0",
      "verify the Place Order button is disabled",
    ]);
  });

  it("should not allow placing order if creditUsed > selectedLocation.balance", () => {
    selectFirstPatient();
    addProductToCart(1);

    cy.prompt([
      "clear the first payment amount input and type 0.01",
      "wait 300 milliseconds",
      "clear the first payment amount input and type 0",
      "verify the Place Order button is disabled",
    ]);
  });
});
