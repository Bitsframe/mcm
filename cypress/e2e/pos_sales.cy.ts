/// <reference types="cypress" />

// POS Sales E2E Test — Location 26 (Clínica San Miguel Blanco) hardcoded for now
// Dynamic location detection commented out until async/sync issues are resolved

const TEST_EMAIL = "mackjmart@gmail.com";
const TEST_PASSWORD = "Create123!";

// ─── Active location (hardcoded for now — dynamic version commented below) ───
const LOCATION_ID = 26;

// ─── Shared patient — unique per run to always INSERT (never UPDATE) ──────────
const RUN_ID = Date.now().toString().slice(-8);
const PATIENT = {
  firstname: "Alaina",
  lastname:  "Ali",
  email:     `alaina.ali.${RUN_ID}@testcypress.com`,
  phone:     `555${RUN_ID}`.slice(0, 10),
  gender:    "Female",
  address:   "123 Main St",
  dob:       "1990-01-01",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getPlaceOrderButton = () =>
  cy.get(
    "button.rounded.py-1.px-3.text-white.w-1\\/2.flex.justify-between.items-center.text-sm",
  );

function getCartRowValue(label: string) {
  // Use exact text match to avoid "Patient Balance" matching when looking for "Balance"
  return cy.contains("h1", new RegExp(`^${label}$`)).parent().find("p")
    .invoke("text").then((txt) => parseFloat(txt.replace(/[^0-9.]/g, "")));
}

function getCreditAvailable() {
  return cy.contains("h1", /Credit Available/i).find("span.font-bold")
    .invoke("text").then((txt) => parseFloat(txt.replace(/[^0-9.]/g, "")) || 0);
}

/*
 * DYNAMIC LOCATION — commented out until Cypress async/sync issue is resolved.
 * The problem: cy.log() inside .then() makes it async, but returning locationId
 * makes it sync — Cypress throws "mixing async and sync code".
 * Fix needed: remove cy.log() from inside the .then() or wrap return in cy.wrap().
 *
 * function getActiveLocationId(): Cypress.Chainable<number> {
 *   return cy.window().then((win) => {
 *     let locationId = 0;
 *     for (let i = 0; i < win.localStorage.length; i++) {
 *       const key = win.localStorage.key(i);
 *       if (key && key.startsWith("@location")) {
 *         locationId = parseInt(win.localStorage.getItem(key) || "0", 10);
 *         break;
 *       }
 *     }
 *     return cy.wrap(locationId); // must return cy.wrap, not raw value
 *   });
 * }
 */

/** Set location in localStorage the same way useLocationClinica does */
function setLocationInStorage(locationId: number) {
  // useLocationClinica stores location as @location_<userId>
  // We set both the generic key and any user-specific key pattern
  cy.window().then((win) => {
    // Find existing @location key and update it, or set the generic one
    let found = false;
    for (let i = 0; i < win.localStorage.length; i++) {
      const key = win.localStorage.key(i);
      if (key && key.startsWith("@location")) {
        win.localStorage.setItem(key, String(locationId));
        found = true;
        cy.log(`Set location ${locationId} on key: ${key}`);
      }
    }
    if (!found) {
      win.localStorage.setItem("@location", String(locationId));
      cy.log(`Set location ${locationId} on key: @location`);
    }
  });
  // Reload so the app picks up the new location from localStorage
  cy.reload();
  cy.wait(1000);
}

function fillAddPatientForm() {
  cy.get('[role="dialog"]').should("be.visible").within(() => {
    cy.get('input[placeholder="Enter firstname"]').clear().type(PATIENT.firstname);
    cy.get('input[placeholder="Enter lastname"]').clear().type(PATIENT.lastname);
    cy.get("select").first().select(PATIENT.gender);
    cy.get('input[placeholder="Enter email"]').clear().type(PATIENT.email);
    cy.get("input.form-control").clear().type(PATIENT.phone);
    cy.get('input[placeholder="Enter street address"]').clear().type(PATIENT.address);
    cy.get('input[placeholder="Select date of birth"]').clear().type(PATIENT.dob);
  });
}

function selectSharedPatient() {
  // beforeEach already visits /en/pos/sales/patients and sets location 26
  cy.wait(1000);

  // No search — just pick the first available patient from Today tab
  cy.get("body").then(($body) => {
    const selectBtns = $body.find("button:visible").toArray()
      .filter((b) => /^select$|^seleccionar$/i.test((b.textContent || "").trim()));

    if (selectBtns.length > 0) {
      cy.wrap(selectBtns[0]).click({ force: true });
    } else {
      // No patients in Today — try Past Records
      cy.contains("button", "Past records").click({ force: true });
      cy.wait(1000);
      cy.contains("button", /^select$|^seleccionar$/i).first().click({ force: true });
    }
  });

  cy.url().should("include", "/pos/sales");
  cy.contains("button", "Add Product").should("not.be.disabled");
  cy.log("✅ Patient selected");
}

function addProductToCart(productName = "Vitamin B12", qty = 1) {
  cy.contains("button", "Add Product").click();
  cy.get('input[placeholder="Search product..."]').should("be.visible");
  cy.get("table tbody tr").should("have.length.greaterThan", 0);
  cy.get('input[placeholder="Search product..."]').clear().type(productName);
  cy.contains(productName).should("be.visible");

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
  cy.contains(productName).should("exist");
}

// ─── POS Patients Feature ────────────────────────────────────────────────────

describe("POS Patients Feature", () => {
  beforeEach(() => {
    cy.viewport(1280, 800);
    cy.loginWithCredentials(TEST_EMAIL, TEST_PASSWORD);
    cy.visit("/en/pos/sales/patients");
    setLocationInStorage(LOCATION_ID);
  });

  it("should add a patient from Today tab and select it", () => {
    // Always create a new patient — RUN_ID guarantees unique email+phone every run
    cy.intercept("POST", "/api/user").as("createPatient");

    cy.contains("button", /add patient/i).click();
    fillAddPatientForm();

    cy.get('[role="dialog"]').within(() => {
      cy.contains("button", /add patient|save|create/i).last().click({ force: true });
    });

    // ── Verify API succeeded ──────────────────────────────────────────────
    cy.wait("@createPatient").then((interception) => {
      cy.log(`API status: ${interception.response?.statusCode}`);
      cy.log(`API body: ${JSON.stringify(interception.response?.body)}`);
      expect(interception.response?.statusCode).to.eq(200);
      expect(interception.response?.body.success).to.eq(true);
    });

    // ── Verify ALL fields in DB ───────────────────────────────────────────
    cy.task("waitForPatientInDB", { email: PATIENT.email, maxAttempts: 15, intervalMs: 2000 })
      .then((patient) => {
        expect(patient).to.not.be.null;
        cy.log(`✅ DB record: ${JSON.stringify(patient)}`);
        const p = patient as Record<string, unknown>;
        expect(p.firstname).to.eq(PATIENT.firstname);
        expect(p.lastname).to.eq(PATIENT.lastname);
        expect(p.email).to.eq(PATIENT.email);
        expect(String(p.phone)).to.include(PATIENT.phone.replace(/\D/g, "").slice(-10));
        expect(p.gender).to.eq(PATIENT.gender);
        expect(p.locationid).to.eq(LOCATION_ID);
        expect(p.onsite).to.eq(true);
        cy.log(`address in DB: ${p.address}`);
        cy.log(`dob in DB: ${p.dob}`);
      });

    // ── Wait for patient row in Today tab ────────────────────────────────
    // After creation fetch_handle() re-fetches — wait for Select button to appear
    cy.contains("button", /^select$|^seleccionar$/i).first().click({ force: true });

    cy.url().should("include", "/pos/sales");
    // Patient Details heading may be in a responsive container — use exist not be.visible
    cy.contains(/patients details/i).should("exist");
    cy.contains(PATIENT.email).should("exist");
    cy.contains(PATIENT.firstname).should("exist");
  });

  it("should select a patient from Past records", () => {
    cy.contains("button", "Past records").click();
    cy.wait(1500);

    // No search — just wait for rows to appear and select the first one
    cy.task("getPatientsCountByLocation", { locationid: LOCATION_ID }).then((count) => {
      cy.log(`Patients in DB for location ${LOCATION_ID}: ${count}`);

      if ((count as number) === 0) {
        cy.log("✅ No patients in DB for this location — empty Past Records is expected.");
        return;
      }

      // DB has patients — must appear on screen
      // Past Records uses CSS Grid divs, NOT a <table> element
      cy.get(".grid.grid-cols-6.gap-4.py-4").should("have.length.greaterThan", 0);
      cy.contains("button", /^select$|^seleccionar$/i).first().click({ force: true });
      cy.url().should("include", "/pos/sales");
      // Use exist instead of be.visible — element may be in a hidden responsive container
      cy.contains(/patients details/i).should("exist");
    });
  });
});

// ─── POS Sales Feature ───────────────────────────────────────────────────────

describe("POS Sales Feature", () => {
  beforeEach(() => {
    cy.viewport(1280, 800);
    cy.loginWithCredentials(TEST_EMAIL, TEST_PASSWORD);
    // Set location 26 in localStorage before any test — same as Patients Feature
    cy.visit("/en/pos/sales/patients");
    setLocationInStorage(LOCATION_ID);
  });

  it("should complete a POS sale successfully", () => {
    selectSharedPatient();
    addProductToCart("Vitamin B12", 1);

    getCartRowValue("Product Total After Discount").then((cartTotal) => {
      cy.log(`cartTotal: ${cartTotal}`);

      getCartRowValue("Patient Balance").then((creditAmount) => {
        cy.log(`creditAmount: ${creditAmount}`);

        getCartRowValue("Sub total").then((subTotal) => {
          expect(subTotal).to.be.closeTo(cartTotal + creditAmount, 0.01);
        });

        const cash = cartTotal.toFixed(2);
        cy.get('input[placeholder="0.00"]').first().clear({ force: true }).type(cash, { force: true });

        // Wait for React to re-render after input
        cy.wait(500);

        getCartRowValue("Balance").then((creditUsed) => {
          cy.log(`creditUsed after full cash: ${creditUsed}`);
          expect(creditUsed).to.equal(0);
        });

        getCartRowValue("Total Paid").then((totalPaid) => {
          cy.log(`totalPaid: ${totalPaid}`);
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
    // ── Explanation of Balance = 0 issue ─────────────────────────────────
    // The app calculates creditUsed as:
    //   creditUsed = max(0, min(cartTotal - paid, locationBalance))
    // If locationBalance = 0 (location 26 has no credit limit set),
    // then creditUsed = max(0, min(anything, 0)) = 0 always.
    // So Balance row will always show 0 when location has no credit balance.
    // This test verifies the calculation is correct given the actual location balance.

    selectSharedPatient();
    addProductToCart("Vitamin B12", 1);

    getCartRowValue("Product Total After Discount").then((cartTotal) => {
      cy.log(`cartTotal: ${cartTotal}`);

      getCreditAvailable().then((locationBalance) => {
        cy.log(`locationBalance (Credit Available): ${locationBalance}`);

        const partialCash = parseFloat((cartTotal / 2).toFixed(2));
        cy.log(`Entering partial cash: ${partialCash}`);

        cy.get('input[placeholder="0.00"]').first()
          .clear({ force: true })
          .type(String(partialCash), { force: true });

        // Wait for React to re-render
        cy.wait(500);

        const creditNeeded = parseFloat((cartTotal - partialCash).toFixed(2));
        // creditUsed = max(0, min(creditNeeded, locationBalance))
        const expectedCreditUsed = parseFloat(Math.min(creditNeeded, locationBalance).toFixed(2));
        const expectedBalanceLimit = parseFloat(Math.max(0, locationBalance - expectedCreditUsed).toFixed(2));

        cy.log(`creditNeeded: ${creditNeeded}, expectedCreditUsed: ${expectedCreditUsed}`);

        // If locationBalance = 0, creditUsed will always be 0 — that is correct behaviour
        getCartRowValue("Balance").then((displayed) => {
          cy.log(`Displayed Balance (creditUsed): ${displayed}`);
          expect(displayed).to.be.closeTo(expectedCreditUsed, 0.01);
        });

        getCreditAvailable().then((updated) => {
          cy.log(`Updated Credit Available: ${updated}`);
          expect(updated).to.be.closeTo(expectedBalanceLimit, 0.01);
        });

        getCartRowValue("Total Paid").then((totalPaid) => {
          cy.log(`Total Paid: ${totalPaid}`);
          expect(totalPaid).to.be.closeTo(partialCash, 0.01);
        });

        if (locationBalance >= creditNeeded) {
          getPlaceOrderButton().should("not.be.disabled").click({ force: true });
          cy.contains(/Order has been placed, order #\s*\d+/i).should("be.visible");
        } else {
          cy.log("Location balance insufficient — Place Order should be disabled");
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
    addProductToCart("Vitamin B12", 1);
    cy.get('input[placeholder="0.00"]').first().clear({ force: true }).type("99999", { force: true });
    getPlaceOrderButton().should("be.disabled");
  });

  it("should not allow placing order when totalPaid is zero and no credit covers the cart", () => {
    selectSharedPatient();
    addProductToCart("Vitamin B12", 1);
    // Initial state: nothing typed → userStartedPaying=false → creditUsed=0, totalPaid=0 → disabled
    getPlaceOrderButton().should("be.disabled");
  });

  it("should not allow placing order if creditUsed > selectedLocation.balance", () => {
    selectSharedPatient();
    addProductToCart("Vitamin B12", 1);

    getCartRowValue("Product Total After Discount").then((cartTotal) => {
      getCreditAvailable().then((locationBalance) => {
        cy.log(`cartTotal: ${cartTotal}, locationBalance: ${locationBalance}`);

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
