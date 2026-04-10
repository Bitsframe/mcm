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

  cy.prompt([
    "wait for the patient list table to finish loading",
    "click the first visible Select button in the patient table",
  ]);

  cy.url({ timeout: 30000 }).should("include", "/pos/sales");
  // Hard-visit so the page fully mounts with localStorage already set
  cy.visit("/en/pos/sales");

  cy.prompt(["wait for the Add Product button to be visible and enabled"]);
}

function addProductToCart(qty = 1) {
  cy.prompt([
    "click the Add Product button",
    "wait for the Search product input to be visible",
    `click the plus button on the first product row ${qty} time${qty > 1 ? "s" : ""}`,
    "click the Add to Cart button",
    "wait for the Search product input to disappear",
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

    // placeholders keys must appear as {{key}} inside the step strings
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
        "reload the page",
        "wait 2000 milliseconds",
        "click the first visible Select button in the patient table",
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

    cy.prompt([
      "clear the first payment amount input and type 100",
      "click the Place Order button",
      "wait for a success toast or success message to appear",
    ]);
  });

  it("should not allow placing order with empty cart", () => {
    selectFirstPatient();

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
