/// <reference types="cypress" />

// POS Sales E2E Test
// Location is read dynamically from the app's localStorage — no hardcoding.
// Tests run against whatever clinic the logged-in user has selected.

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
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getPlaceOrderButton = () =>
  cy.get(
    "button.rounded.py-1.px-3.text-white.w-1\\/2.flex.justify-between.items-center.text-sm",
  );

function getCartRowValue(label: string) {
  return cy.contains("h1", new RegExp(`^${label}$`)).parent().find("p")
    .invoke("text").then((txt) => parseFloat(txt.replace(/[^0-9.]/g, "")));
}

function getCreditAvailable() {
  return cy.contains("h1", /Credit Available/i).find("span.font-bold")
    .invoke("text").then((txt) => parseFloat(txt.replace(/[^0-9.]/g, "")) || 0);
}

/**
 * Reads the active location id from the app's localStorage.
 * useLocationClinica stores it as @location_<userId> (or @location as fallback).
 * Uses cy.wrap() as return value to avoid async/sync mixing error.
 */
function getActiveLocationId(): Cypress.Chainable<number> {
  return cy.window().then((win) => {
    let locationId = 0;
    for (let i = 0; i < win.localStorage.length; i++) {
      const key = win.localStorage.key(i);
      if (key && key.startsWith("@location")) {
        const val = parseInt(win.localStorage.getItem(key) || "0", 10);
        if (val > 0) { locationId = val; break; }
      }
    }
    return cy.wrap(locationId);
  });
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
  // beforeEach already visits /en/pos/sales/patients
  cy.wait(1000);

  cy.get("body").then(($body) => {
    const todayBtns = $body.find("button:visible").toArray()
      .filter((b) => /^select$|^seleccionar$/i.test((b.textContent || "").trim()));

    if (todayBtns.length > 0) {
      // Today tab has patients — select first
      cy.wrap(todayBtns[0]).click({ force: true });
    } else {
      // Check Past Records
      cy.contains("button", "Past records").click({ force: true });
      cy.wait(1000);

      cy.get("body").then(($body2) => {
        const pastBtns = $body2.find("button:visible").toArray()
          .filter((b) => /^select$|^seleccionar$/i.test((b.textContent || "").trim()));

        if (pastBtns.length > 0) {
          // Past Records has patients — select first
          cy.wrap(pastBtns[0]).click({ force: true });
        } else {
          // No patients anywhere — create one, wait for it in Today tab
          cy.log("No patients found — creating a new patient");
          cy.contains("button", "Today").click({ force: true });
          cy.wait(500);

          cy.intercept("POST", "/api/user").as("createPatientForSales");
          cy.contains("button", /add patient/i).click();
          fillAddPatientForm();
          cy.get('[role="dialog"]').within(() => {
            cy.contains("button", /add patient|save|create/i).last().click({ force: true });
          });
          cy.wait("@createPatientForSales");
          cy.wait(1000);
          // Wait for the new patient row to appear
          cy.contains("button", /^select$|^seleccionar$/i, { timeout: 30000 })
            .first().click({ force: true });
        }
      });
    }
  });

  cy.url().should("include", "/pos/sales");
  cy.contains("button", "Add Product").should("not.be.disabled");
}

function addProductToCart(productName = "Vitamin B12", qty = 1) {
  cy.contains("button", "Add Product").click();
  cy.get('input[placeholder="Search product..."]').should("be.visible");
  cy.get("table tbody tr").should("have.length.greaterThan", 0);
  cy.get('input[placeholder="Search product..."]').clear().type(productName);
  cy.contains(productName).should("be.visible");

  cy.get("table tbody tr").first().find("td").eq(2).invoke("text").then((a) => cy.log(`Availability: ${a.trim()}`));

  for (let i = 0; i < qty; i++) {
    cy.get("table tbody tr").first().find("button").contains("+").click({ force: true });
  }

  cy.get("table tbody tr").first().find("td").eq(3).invoke("text").then((p) => cy.log(`Price/Unit: ${p.trim()}`));
  cy.get("table tbody tr").first().find("td").eq(4).invoke("text").then((t) => cy.log(`Total Cost: ${t.trim()}`));

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
  });

  it("should add a patient from Today tab and select it", () => {
    cy.intercept("POST", "/api/user").as("createPatient");

    cy.contains("button", /add patient/i).click();
    fillAddPatientForm();

    cy.get('[role="dialog"]').within(() => {
      cy.contains("button", /add patient|save|create/i).last().click({ force: true });
    });

    cy.wait("@createPatient").then((interception) => {
      cy.log(`API status: ${interception.response?.statusCode}`);
      cy.log(`API body: ${JSON.stringify(interception.response?.body)}`);
      expect(interception.response?.statusCode).to.eq(200);
      expect(interception.response?.body.success).to.eq(true);
    });

    // Verify ALL fields in DB using the active location from localStorage
    getActiveLocationId().then((activeLocId) => {
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
          if (activeLocId > 0) expect(p.locationid).to.eq(activeLocId);
          cy.log(`locationid in DB: ${p.locationid}, address: ${p.address}, dob: ${p.dob}`);
        });
    });

    cy.contains("button", /^select$|^seleccionar$/i).first().click({ force: true });

    cy.url().should("include", "/pos/sales");
    cy.contains(/patients details/i).should("exist");
    cy.contains(PATIENT.email).should("exist");
    cy.contains(PATIENT.firstname).should("exist");
  });

  it("should select a patient from Past records", () => {
    cy.contains("button", "Past records").click();
    cy.wait(1500);

    getActiveLocationId().then((activeLocId) => {
      cy.task("getPatientsCountByLocation", { locationid: activeLocId }).then((count) => {
        cy.log(`Patients in DB for location ${activeLocId}: ${count}`);

        if ((count as number) === 0) {
          // No patients for this location — this is valid, test passes
          cy.log("✅ No patients in DB for this location — empty Past Records is correct. Test passes.");
          return;
        }

        // DB has patients — UI must show them
        cy.get(".grid.grid-cols-6.gap-4.py-4").then(($rows) => {
          if ($rows.length === 0) {
            // Rows not visible yet — could be loading
            cy.log("⚠️ DB has patients but no rows visible yet — waiting...");
            cy.get(".grid.grid-cols-6.gap-4.py-4", { timeout: 30000 })
              .should("have.length.greaterThan", 0);
          }
          cy.contains("button", /^select$|^seleccionar$/i).first().click({ force: true });
          cy.url().should("include", "/pos/sales");
          cy.contains(/patients details/i).should("exist");
        });
      });
    });
  });
});

// ─── POS Sales Feature ───────────────────────────────────────────────────────

describe("POS Sales Feature", () => {
  beforeEach(() => {
    cy.viewport(1280, 800);
    cy.loginWithCredentials(TEST_EMAIL, TEST_PASSWORD);
    cy.visit("/en/pos/sales/patients");
  });

  it("should complete a POS sale successfully", () => {
    selectSharedPatient();
    addProductToCart("Vitamin B12", 1);

    getCartRowValue("Product Total After Discount").then((cartTotal) => {
      getCartRowValue("Patient Balance").then((creditAmount) => {
        getCartRowValue("Sub total").then((subTotal) => {
          expect(subTotal).to.be.closeTo(cartTotal + creditAmount, 0.01);
        });

        const cash = cartTotal.toFixed(2);
        cy.get('input[placeholder="0.00"]').first().clear({ force: true }).type(cash, { force: true });
        cy.wait(500);

        getCartRowValue("Balance").then((creditUsed) => {
          expect(creditUsed).to.equal(0);
        });

        getCartRowValue("Total Paid").then((totalPaid) => {
          expect(totalPaid).to.be.closeTo(cartTotal, 0.01);
        });

        getPlaceOrderButton().should("not.be.disabled").within(() => {
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
    addProductToCart("Vitamin B12", 1);

    getCartRowValue("Product Total After Discount").then((cartTotal) => {
      getCreditAvailable().then((locationBalance) => {
        const partialCash = parseFloat((cartTotal / 2).toFixed(2));
        cy.get('input[placeholder="0.00"]').first().clear({ force: true }).type(String(partialCash), { force: true });
        cy.wait(500);

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
    addProductToCart("Vitamin B12", 1);
    cy.get('input[placeholder="0.00"]').first().clear({ force: true }).type("99999", { force: true });
    getPlaceOrderButton().should("be.disabled");
  });

  it("should not allow placing order when totalPaid is zero and no credit covers the cart", () => {
    selectSharedPatient();
    addProductToCart("Vitamin B12", 1);
    getPlaceOrderButton().should("be.disabled");
  });

  it("should not allow placing order if creditUsed > selectedLocation.balance", () => {
    selectSharedPatient();
    addProductToCart("Vitamin B12", 1);

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

// ─── POS Sales — Additional Feature Tests ────────────────────────────────────

describe("POS Sales — Cart & Discount Features", () => {
  beforeEach(() => {
    cy.viewport(1280, 800);
    cy.loginWithCredentials(TEST_EMAIL, TEST_PASSWORD);
    cy.visit("/en/pos/sales/patients");
  });

  it("should apply a cart-level discount and recalculate totals", () => {
    selectSharedPatient();
    addProductToCart("Vitamin B12", 1);

    getCartRowValue("Product Total After Discount").then((originalTotal) => {
      // Click Add button next to "Discount Used %"
      cy.contains("h1", /Discount Used %/i).parent().find("button").contains("Add").click();

      // Modal appears with input placeholder "Enter Discount %, (0 - 100)"
      cy.get('input[placeholder="Enter % of discount"]').clear().type("10");
      cy.contains("button", "Apply").click();
      cy.wait(500);

      // After Discount = originalTotal * 0.9
      getCartRowValue("Product Total After Discount").then((afterDiscount) => {
        expect(afterDiscount).to.be.closeTo(originalTotal * 0.9, 0.01);
      });

      // Row shows "30.00 (10%)" style text
      cy.contains("h1", /Discount Used %/i).parent().find("p").invoke("text").then((txt) => {
        expect(txt).to.include("10");
      });
    });
  });

  it("should remove a cart-level discount and restore original total", () => {
    selectSharedPatient();
    addProductToCart("Vitamin B12", 1);

    getCartRowValue("Product Total After Discount").then((originalTotal) => {
      // Apply 20% discount via modal
      cy.contains("h1", /Discount Used %/i).parent().find("button").contains("Add").click();
      cy.get('input[placeholder="Enter % of discount"]').clear().type("20");
      cy.contains("button", "Apply").click();
      cy.wait(500);

      // Verify discount applied
      getCartRowValue("Product Total After Discount").then((discounted) => {
        expect(discounted).to.be.closeTo(originalTotal * 0.8, 0.01);
      });

      // Click X button to remove discount (shown as "X" next to the discount value)
      cy.contains("h1", /Discount Used %/i).parent().find("button").contains("X").click();
      cy.wait(500);

      // Total restored
      getCartRowValue("Product Total After Discount").then((restored) => {
        expect(restored).to.be.closeTo(originalTotal, 0.01);
      });
    });
  });

  it("should apply a per-item discount on a cart product", () => {
    selectSharedPatient();
    addProductToCart("Vitamin B12", 1);

    // Click "Add discount" button on the cart item row
    cy.contains("button", /add discount/i).first().click();

    // Same modal as cart-level discount
    cy.get('input[placeholder="Enter % of discount"]').clear().type("15");
    cy.contains("button", "Apply").click();
    cy.wait(500);

    // Cart item shows "15% off"
    cy.contains("15% off").should("exist");

    // Product Total After Discount reflects per-item discount
    getCartRowValue("Product Total After Discount").then((afterDiscount) => {
      cy.log(`After 15% per-item discount: ${afterDiscount}`);
      expect(afterDiscount).to.be.greaterThan(0);
    });
  });

  it("should apply card payment and enable place order", () => {
    selectSharedPatient();
    addProductToCart("Vitamin B12", 1);

    cy.contains("span", /^Card$/i).parent().find('input[type="checkbox"]').click({ force: true });
    cy.wait(300);
    cy.contains("span", /^Cash$/i).parent().find('input[type="checkbox"]').click({ force: true });
    cy.wait(300);

    getCartRowValue("Product Total After Discount").then((cartTotal) => {
      cy.get('input[placeholder="0.00"]').first().clear({ force: true }).type(cartTotal.toFixed(2), { force: true });
      cy.wait(500);
      getPlaceOrderButton().should("not.be.disabled");
    });
  });

  it("should apply Zelle payment and enable place order", () => {
    selectSharedPatient();
    addProductToCart("Vitamin B12", 1);

    cy.contains("span", "Zelle").parent().find('input[type="checkbox"]').click({ force: true });
    cy.wait(300);
    cy.contains("span", /^Cash$/i).parent().find('input[type="checkbox"]').click({ force: true });
    cy.wait(300);

    getCartRowValue("Product Total After Discount").then((cartTotal) => {
      cy.get('input[placeholder="0.00"]').first().clear({ force: true }).type(cartTotal.toFixed(2), { force: true });
      cy.wait(500);
      getPlaceOrderButton().should("not.be.disabled");
    });
  });

  it("should split payment between cash and card", () => {
    selectSharedPatient();
    addProductToCart("Vitamin B12", 1);

    cy.contains("span", /^Card$/i).parent().find('input[type="checkbox"]').click({ force: true });
    cy.wait(300);

    getCartRowValue("Product Total After Discount").then((cartTotal) => {
      const half = parseFloat((cartTotal / 2).toFixed(2));
      cy.get('input[placeholder="0.00"]').eq(0).clear({ force: true }).type(String(half), { force: true });
      cy.get('input[placeholder="0.00"]').eq(1).clear({ force: true }).type(String(half), { force: true });
      cy.wait(500);

      getCartRowValue("Total Paid").then((totalPaid) => {
        expect(totalPaid).to.be.closeTo(cartTotal, 0.02);
      });

      getPlaceOrderButton().should("not.be.disabled");
    });
  });

  it("should show error toast for invalid promo code", () => {
    selectSharedPatient();
    addProductToCart("Vitamin B12", 1);

    cy.get('input[placeholder="Promo Code"]').clear().type("INVALIDCODE123");
    cy.contains("button", "Apply").click();
    cy.contains(/expired|invalid|promo/i).should("exist");
  });

  it("should show error toast for expired promo code", () => {
    selectSharedPatient();
    addProductToCart("Vitamin B12", 1);

    // FBK3QE8QP is expired (expiry: 2025-07-14)
    cy.get('input[placeholder="Promo Code"]').clear().type("FBK3QE8QP");
    cy.contains("button", "Apply").click();
    cy.contains(/expired|invalid/i).should("exist");
    cy.contains("NILL").should("exist");
  });

  it("should add multiple products to cart and show combined total", () => {
    selectSharedPatient();
    addProductToCart("Vitamin B12", 1);

    getCartRowValue("Product Total After Discount").then((firstTotal) => {
      cy.log(`After first product (qty 1): ${firstTotal}`);

      // Add the same product again with qty 2 — total should increase
      addProductToCart("Vitamin B12", 2);

      getCartRowValue("Product Total After Discount").then((combinedTotal) => {
        cy.log(`After adding qty 2 more: ${combinedTotal}`);
        expect(combinedTotal).to.be.greaterThan(firstTotal);
      });
    });
  });

  it("should increase product quantity by adding same product again and update total", () => {
    selectSharedPatient();
    addProductToCart("Vitamin B12", 1);

    getCartRowValue("Product Total After Discount").then((singleTotal) => {
      cy.log(`Total at qty 1: ${singleTotal}`);

      // Add same product again with qty 1 — total should double
      addProductToCart("Vitamin B12", 1);

      getCartRowValue("Product Total After Discount").then((doubleTotal) => {
        cy.log(`Total after adding again: ${doubleTotal}`);
        expect(doubleTotal).to.be.closeTo(singleTotal * 2, 0.01);
      });
    });
  });

  it("should clear cart and patient after successful order", () => {
    selectSharedPatient();
    addProductToCart("Vitamin B12", 1);

    getCartRowValue("Product Total After Discount").then((cartTotal) => {
      cy.get('input[placeholder="0.00"]').first().clear({ force: true }).type(cartTotal.toFixed(2), { force: true });
      cy.wait(500);
      getPlaceOrderButton().should("not.be.disabled").click({ force: true });
    });

    cy.contains(/Order has been placed, order #\s*\d+/i).should("be.visible");
    getPlaceOrderButton().should("be.disabled");
    cy.contains(/No Selected Patient/i).should("exist");
  });

  it("should verify order is recorded in DB after successful placement", () => {
    selectSharedPatient();
    addProductToCart("Vitamin B12", 1);

    cy.intercept("POST", "/api/orders").as("placeOrder");

    getCartRowValue("Product Total After Discount").then((cartTotal) => {
      cy.get('input[placeholder="0.00"]').first().clear({ force: true }).type(cartTotal.toFixed(2), { force: true });
      cy.wait(500);
      getPlaceOrderButton().should("not.be.disabled").click({ force: true });
    });

    cy.wait("@placeOrder").then((interception) => {
      expect(interception.response?.statusCode).to.eq(200);
      expect(interception.response?.body.success).to.eq(true);
      const orderId = interception.response?.body.order_id;
      expect(orderId).to.be.a("number");
      cy.contains(new RegExp(`Order has been placed, order # ${orderId}`, "i")).should("exist");
    });
  });
});
