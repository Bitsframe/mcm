/// <reference types="cypress" />

// POS Sales E2E Test
// One shared patient: Alaina Ali (aa@gmail.com) used across ALL tests.
// First test creates the patient if not already in DB, all others reuse it.

const TEST_EMAIL = "mackjmart@gmail.com";
const TEST_PASSWORD = "Create123!";

// ─── Shared patient data ──────────────────────────────────────────────────────
const PATIENT = {
  firstname: "Alaina",
  lastname: "Ali",
  email: "aa@gmail.com",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getPlaceOrderButton = () =>
  cy.get(
    "button.rounded.py-1.px-3.text-white.w-1\\/2.flex.justify-between.items-center.text-sm",
  );

function getCartRowValue(label: string) {
  return cy
    .contains("h1", label)
    .parent()
    .find("p")
    .invoke("text")
    .then((txt) => parseFloat(txt.replace(/[^0-9.]/g, "")));
}

function getCreditAvailable() {
  return cy
    .contains("h1", /Credit Available/i)
    .find("span.font-bold")
    .invoke("text")
    .then((txt) => parseFloat(txt.replace(/[^0-9.]/g, "")) || 0);
}

/**
 * Fill the Add Patient form using the exact selectors for each custom component.
 * - firstname/lastname/email/dob: Input_Component → renders <input id="section">
 *   but we target by placeholder since all share the same id
 * - gender: Select_Dropdown → renders a native <select>
 * - phone: react-phone-input-2 → renders <input class="form-control">
 * - address: plain <input placeholder="Enter street address">
 */
function fillAddPatientForm() {
  cy.get('[role="dialog"]').should("be.visible").within(() => {
    // firstname — Input_Component with placeholder from k86 = "Enter firstname"
    cy.get('input[placeholder="Enter firstname"]').clear().type(PATIENT.firstname);

    // lastname — Input_Component with placeholder from k87 = "Enter lastname"
    cy.get('input[placeholder="Enter lastname"]').clear().type(PATIENT.lastname);

    // gender — Select_Dropdown renders a native <select>
    cy.get("select").first().select("Female");

    // email — Input_Component with placeholder from k88 = "Enter email"
    cy.get('input[placeholder="Enter email"]').clear().type(PATIENT.email);

    // phone — react-phone-input-2 renders <input class="form-control">
    // It prepends +1 automatically, so just type the 10-digit number
    cy.get("input.form-control").clear().type("3055551212");

    // address — plain native input
    cy.get('input[placeholder="Enter street address"]').clear().type("123 Main St");

    // dob — Input_Component type="date" with placeholder "Select date of birth"
    cy.get('input[placeholder="Select date of birth"]').clear().type("1990-01-01");
  });
}

/**
 * Navigate to patients page, select the shared patient Alaina Ali.
 * Checks Today tab first, then Past Records.
 * Does NOT create a new patient — that's only done in the first test.
 */
function selectSharedPatient() {
  cy.visit("/en/pos/sales/patients");
  cy.wait(1500);

  // Search for the shared patient by name to isolate the row
  cy.get('input[placeholder*="search"]').clear().type(PATIENT.firstname);
  cy.wait(500);

  // Try Today tab first
  cy.get("body").then(($body) => {
    const selectBtns = $body
      .find("button:visible")
      .toArray()
      .filter((b) => /^select$|^seleccionar$/i.test((b.textContent || "").trim()));

    if (selectBtns.length > 0) {
      cy.wrap(selectBtns[0]).click({ force: true });
    } else {
      // Try Past Records
      cy.contains("button", "Past records").click({ force: true });
      cy.wait(1000);
      cy.get('input[placeholder*="search"]').clear().type(PATIENT.firstname);
      cy.wait(500);
      cy.contains("button", /^select$|^seleccionar$/i).first().click({ force: true });
    }
  });

  cy.url().should("include", "/pos/sales");
  cy.contains("button", "Add Product").should("not.be.disabled");
  cy.log("✅ Shared patient selected");
}

function addProductToCart(qty = 1) {
  cy.contains("button", "Add Product").click();
  cy.get('input[placeholder="Search product..."]').should("be.visible");
  cy.get("table tbody tr").should("have.length.greaterThan", 0);
  cy.get('input[placeholder="Search product..."]').clear().type("Vitamin B");
  cy.contains("Vitamin B").should("be.visible");

  cy.get("table tbody tr").first().find("td").eq(2).invoke("text").then((a) => {
    cy.log(`Availability: ${a.trim()}`);
  });

  for (let i = 0; i < qty; i++) {
    cy.get("table tbody tr").first().find("button").contains("+").click({ force: true });
  }

  cy.get("table tbody tr").first().find("td").eq(3).invoke("text").then((p) => {
    cy.log(`Price/Unit: ${p.trim()}`);
  });
  cy.get("table tbody tr").first().find("td").eq(4).invoke("text").then((t) => {
    cy.log(`Total Cost: ${t.trim()}`);
  });

  cy.contains("button", "Add to Cart").click({ force: true });
  cy.wait(300);
  cy.get('button[aria-label="Close modal"]').click({ force: true });
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
    // ── Check if Alaina Ali already exists in Today tab ───────────────────
    cy.get('input[placeholder*="search"]').clear().type(PATIENT.firstname);
    cy.wait(800);

    cy.get("body").then(($body) => {
      const hasSelect = $body
        .find("button:visible")
        .toArray()
        .some((b) => /^select$|^seleccionar$/i.test((b.textContent || "").trim()));

      if (hasSelect) {
        cy.log("Patient already exists in Today tab — selecting directly");
        cy.contains("button", /^select$|^seleccionar$/i).first().click({ force: true });
      } else {
        // ── Create the patient ──────────────────────────────────────────
        cy.log("No patient found — creating Alaina Ali");

        // Intercept the POST /api/user to verify DB insert
        cy.intercept("POST", "/api/user").as("createPatient");

        cy.contains("button", /add patient/i).click();
        fillAddPatientForm();

        // Submit — button calls createNewDataHandle() + setAddPatientModalOpen(false)
        cy.get('[role="dialog"]').within(() => {
          cy.contains("button", /add patient|save|create/i).last().click({ force: true });
        });

        // ── Verify the API call succeeded ────────────────────────────────
        cy.wait("@createPatient").then((interception) => {
          cy.log(`API status: ${interception.response?.statusCode}`);
          cy.log(`API body: ${JSON.stringify(interception.response?.body)}`);
          expect(interception.response?.statusCode).to.eq(200);
          expect(interception.response?.body.success).to.eq(true);
        });

        // ── Verify via Supabase task that record is in DB ─────────────────
        cy.task("waitForPatientInDB", {
          firstname: PATIENT.firstname,
          maxAttempts: 15,
          intervalMs: 2000,
        }).then((patient) => {
          expect(patient).to.not.be.null;
          cy.log(`✅ DB confirmed: ${JSON.stringify(patient)}`);
        });

        // ── Wait for the patient to appear in Today tab ───────────────────
        // The page calls fetch_handle() after creation — row appears without reload
        cy.get('input[placeholder*="search"]').clear().type(PATIENT.firstname);
        cy.wait(500);

        // Wait for the exact patient row with Alaina's name to appear
        cy.contains(PATIENT.firstname, { timeout: 30000 }).should("be.visible");
        cy.contains("button", /^select$|^seleccionar$/i).first().click({ force: true });
      }
    });

    // ── Verify navigation and Patient Details ─────────────────────────────
    cy.url().should("include", "/pos/sales");
    cy.contains(/patients details/i).should("be.visible");
    cy.contains(PATIENT.email).should("be.visible");
    cy.contains(PATIENT.firstname).should("be.visible");
  });

  it("should select a patient from Past records", () => {
    cy.contains("button", "Past records").click();
    cy.wait(1500);

    // Search for shared patient
    cy.get('input[placeholder*="search"]').clear().type(PATIENT.firstname);
    cy.wait(500);

    // Wait for rows
    cy.get("tr:visible").should("have.length.greaterThan", 1);

    cy.contains("button", /^select$|^seleccionar$/i).first().click({ force: true });

    cy.url().should("include", "/pos/sales");
    cy.contains(/patients details/i).should("be.visible");
    cy.contains(PATIENT.email).should("be.visible");
  });
});

// ─── POS Sales Feature ───────────────────────────────────────────────────────

describe("POS Sales Feature", () => {
  beforeEach(() => {
    cy.viewport(1280, 800);
    cy.loginWithCredentials(TEST_EMAIL, TEST_PASSWORD);
  });

  it("should complete a POS sale successfully", () => {
    selectSharedPatient();
    addProductToCart(1);

    getCartRowValue("Product Total After Discount").then((cartTotal) => {
      cy.log(`cartTotal: ${cartTotal}`);

      getCartRowValue("Patient Balance").then((creditAmount) => {
        cy.log(`creditAmount: ${creditAmount}`);

        getCartRowValue("Sub total").then((subTotal) => {
          expect(subTotal).to.be.closeTo(cartTotal + creditAmount, 0.01);
        });

        const cash = cartTotal.toFixed(2);
        cy.get('input[placeholder="0.00"]').first().clear({ force: true }).type(cash, { force: true });

        getCartRowValue("Balance").then((creditUsed) => {
          expect(creditUsed).to.equal(0);
        });

        getCartRowValue("Total Paid").then((totalPaid) => {
          expect(totalPaid).to.be.closeTo(cartTotal, 0.01);
        });

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
    selectSharedPatient();
    addProductToCart(1);

    getCartRowValue("Product Total After Discount").then((cartTotal) => {
      getCreditAvailable().then((locationBalance) => {
        const partialCash = parseFloat((cartTotal / 2).toFixed(2));
        cy.get('input[placeholder="0.00"]').first().clear({ force: true }).type(String(partialCash), { force: true });

        const creditNeeded = parseFloat((cartTotal - partialCash).toFixed(2));
        const expectedCreditUsed = parseFloat(Math.min(creditNeeded, locationBalance).toFixed(2));
        const expectedBalanceLimit = parseFloat(Math.max(0, locationBalance - expectedCreditUsed).toFixed(2));

        getCartRowValue("Balance").then((displayed) => {
          expect(displayed).to.be.closeTo(expectedCreditUsed, 0.01);
        });

        getCreditAvailable().then((updated) => {
          expect(updated).to.be.closeTo(expectedBalanceLimit, 0.01);
        });

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
    selectSharedPatient();
    getPlaceOrderButton().should("be.disabled");
  });

  it("should not allow placing order if totalPaid > cartTotal + creditAmount", () => {
    selectSharedPatient();
    addProductToCart(1);
    cy.get('input[placeholder="0.00"]').first().clear({ force: true }).type("99999", { force: true });
    getPlaceOrderButton().should("be.disabled");
  });

  it("should not allow placing order when totalPaid is zero and no credit covers the cart", () => {
    selectSharedPatient();
    addProductToCart(1);
    // Initial state: nothing typed → disabled
    getPlaceOrderButton().should("be.disabled");
  });

  it("should not allow placing order if creditUsed > selectedLocation.balance", () => {
    selectSharedPatient();
    addProductToCart(1);

    getCartRowValue("Product Total After Discount").then((cartTotal) => {
      getCreditAvailable().then((locationBalance) => {
        if (cartTotal > locationBalance) {
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
