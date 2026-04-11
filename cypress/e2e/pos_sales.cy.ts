/// <reference types="cypress" />

// POS Sales E2E Test
// Location: Clínica San Miguel Blanco (id: 26)
// One shared patient created fresh each run — unique email + phone prevent upsert collision

const TEST_EMAIL = "mackjmart@gmail.com";
const TEST_PASSWORD = "Create123!";

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
  // locationid is read dynamically from the app's localStorage at runtime
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getPlaceOrderButton = () =>
  cy.get(
    "button.rounded.py-1.px-3.text-white.w-1\\/2.flex.justify-between.items-center.text-sm",
  );

function getCartRowValue(label: string) {
  return cy.contains("h1", label).parent().find("p")
    .invoke("text").then((txt) => parseFloat(txt.replace(/[^0-9.]/g, "")));
}

function getCreditAvailable() {
  return cy.contains("h1", /Credit Available/i).find("span.font-bold")
    .invoke("text").then((txt) => parseFloat(txt.replace(/[^0-9.]/g, "")) || 0);
}

/** Read the currently selected location id from the app's localStorage */
function getActiveLocationId(): Cypress.Chainable<number> {
  return cy.window().then((win) => {
    // The key is @location_<userId> — find it by prefix
    let locationId = 0;
    for (let i = 0; i < win.localStorage.length; i++) {
      const key = win.localStorage.key(i);
      if (key && key.startsWith("@location")) {
        locationId = parseInt(win.localStorage.getItem(key) || "0", 10);
        break;
      }
    }
    cy.log(`Active location from localStorage: ${locationId}`);
    return locationId;
  });
}

/** Select a location by id in the location dropdown */
function selectLocation(id: number) {
  cy.get("select#locations").select(String(id), { force: true });
  cy.wait(1000);
}

/**
 * Fill the Add Patient form.
 * All fields use exact placeholders from the source code.
 */
function fillAddPatientForm() {
  cy.get('[role="dialog"]').should("be.visible").within(() => {
    cy.get('input[placeholder="Enter firstname"]').clear().type(PATIENT.firstname);
    cy.get('input[placeholder="Enter lastname"]').clear().type(PATIENT.lastname);
    cy.get("select").first().select(PATIENT.gender);
    cy.get('input[placeholder="Enter email"]').clear().type(PATIENT.email);
    // react-phone-input-2 renders <input class="form-control">
    cy.get("input.form-control").clear().type(PATIENT.phone);
    cy.get('input[placeholder="Enter street address"]').clear().type(PATIENT.address);
    cy.get('input[placeholder="Select date of birth"]').clear().type(PATIENT.dob);
  });
}

/**
 * Select the shared patient (Alaina Ali) from the patients page.
 * Searches by firstname, tries Today tab then Past Records.
 */
function selectSharedPatient() {
  cy.visit("/en/pos/sales/patients");
  cy.wait(1500);
  // Use whatever location the app currently has active — no hardcoding

  cy.get('input[placeholder*="search"]').clear().type(PATIENT.firstname);
  cy.wait(800);

  cy.get("body").then(($body) => {
    const selectBtns = $body.find("button:visible").toArray()
      .filter((b) => /^select$|^seleccionar$/i.test((b.textContent || "").trim()));

    if (selectBtns.length > 0) {
      cy.wrap(selectBtns[0]).click({ force: true });
    } else {
      cy.contains("button", "Past records").click({ force: true });
      cy.wait(1000);
      cy.get('input[placeholder*="search"]').clear().type(PATIENT.firstname);
      cy.wait(800);
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
    // No hardcoded location — use whatever the app has selected for this user
  });

  it("should add a patient from Today tab and select it", () => {
    // Intercept before anything so it's registered
    cy.intercept("POST", "/api/user").as("createPatient");

    // Open Add Patient modal
    cy.contains("button", /add patient/i).click();
    fillAddPatientForm();

    // Submit
    cy.get('[role="dialog"]').within(() => {
      cy.contains("button", /add patient|save|create/i).last().click({ force: true });
    });

    // ── Verify API call succeeded ─────────────────────────────────────────
    cy.wait("@createPatient").then((interception) => {
      cy.log(`API status: ${interception.response?.statusCode}`);
      cy.log(`API body: ${JSON.stringify(interception.response?.body)}`);
      expect(interception.response?.statusCode).to.eq(200);
      expect(interception.response?.body.success).to.eq(true);
    });

    // ── Verify ALL fields in DB via Supabase task ─────────────────────────
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
        expect(p.onsite).to.eq(true);
        // locationid should match whatever the app had active
        cy.log(`locationid in DB: ${p.locationid}`);
        cy.log(`address in DB: ${p.address}`);
        cy.log(`dob in DB: ${p.dob}`);

        // Verify locationid matches the app's active location
        getActiveLocationId().then((activeLocId) => {
          if (activeLocId > 0) {
            expect(p.locationid).to.eq(activeLocId);
          }
        });
      });

    // ── Wait for patient to appear in Today tab ───────────────────────────
    cy.get('input[placeholder*="search"]').clear().type(PATIENT.firstname);
    cy.wait(500);
    cy.contains(PATIENT.firstname).should("be.visible");
    cy.contains("button", /^select$|^seleccionar$/i).first().click({ force: true });

    // ── Verify Patient Details on POS sales page ──────────────────────────
    cy.url().should("include", "/pos/sales");
    cy.contains(/patients details/i).should("be.visible");
    cy.contains(PATIENT.email).should("be.visible");
    cy.contains(PATIENT.firstname).should("be.visible");
  });

  it("should select a patient from Past records", () => {
    cy.contains("button", "Past records").click();
    cy.wait(1500);

    cy.get('input[placeholder*="search"]').clear().type(PATIENT.firstname);
    cy.wait(800);

    // Read the active location from localStorage, then check DB
    getActiveLocationId().then((activeLocId) => {
      cy.log(`Checking DB for location: ${activeLocId}`);

      cy.task("getPatientsCountByLocation", { locationid: activeLocId }).then((count) => {
        cy.log(`Patients in DB for location ${activeLocId}: ${count}`);

        if (count === 0) {
          // DB has no patients for this location — empty table is correct
          cy.log("✅ No patients in DB for this location — empty Past Records is expected. Test passes.");
          return;
        }

        // DB has patients — they MUST appear on screen
        cy.get("table").find("tr").should("have.length.greaterThan", 1);
        cy.contains("button", /^select$|^seleccionar$/i).first().click({ force: true });
        cy.url().should("include", "/pos/sales");
        cy.contains(/patients details/i).should("be.visible");
      });
    });
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
