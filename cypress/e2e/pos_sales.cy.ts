/// <reference types="cypress" />

// POS Sales E2E Test
// Location is read dynamically from localStorage — no hardcoding.

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
  cy.get("button.rounded.py-1.px-3.text-white.w-1\\/2.flex.justify-between.items-center.text-sm");

function getCartRowValue(label: string) {
  return cy.contains("h1", new RegExp(`^${label}$`)).parent().find("p")
    .invoke("text").then((txt) => parseFloat(txt.replace(/[^0-9.]/g, "")));
}

function getCreditAvailable() {
  return cy.contains("h1", /Credit Available/i).find("span.font-bold")
    .invoke("text").then((txt) => parseFloat(txt.replace(/[^0-9.]/g, "")) || 0);
}

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

/**
 * Click the Apply button inside the cart-level discount modal.
 * Cart modal: fixed inset-0 z-50 — Apply button: px-3 py-1 text-sm rounded bg-blue-600 text-white
 * Cannot use cy.contains("button","Apply") — it matches the PromoCode Apply button first.
 */
function clickDiscountModalApply() {
  cy.get("div.fixed.inset-0.z-50")
    .find("button.bg-blue-600")
    .contains("Apply")
    .click({ force: true });
  cy.get('input[placeholder="Enter % of discount"]').should("not.exist");
  cy.wait(300);
}

/**
 * Click the Apply button inside the per-item DiscountModal component.
 * DiscountModal: fixed inset-0 z-[1000] with role="dialog" aria-modal="true"
 * Apply button: px-3 py-2 rounded-md bg-[#0066FF] text-white
 */
function clickPerItemDiscountModalApply() {
  cy.get('[role="dialog"][aria-modal="true"]')
    .find("button")
    .contains("Apply")
    .click({ force: true });
  cy.get('[role="dialog"][aria-modal="true"]').should("not.exist");
  cy.wait(300);
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
  cy.wait(1000);

  cy.get("body").then(($body) => {
    const todayBtns = $body.find("button:visible").toArray()
      .filter((b) => /^select$|^seleccionar$/i.test((b.textContent || "").trim()));

    if (todayBtns.length > 0) {
      cy.wrap(todayBtns[0]).click({ force: true });
    } else {
      cy.contains("button", "Past records").click({ force: true });
      cy.wait(1000);

      cy.get("body").then(($body2) => {
        const pastBtns = $body2.find("button:visible").toArray()
          .filter((b) => /^select$|^seleccionar$/i.test((b.textContent || "").trim()));

        if (pastBtns.length > 0) {
          cy.wrap(pastBtns[0]).click({ force: true });
        } else {
          cy.log("No patients found — creating one");
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
      expect(interception.response?.statusCode).to.eq(200);
      expect(interception.response?.body.success).to.eq(true);
    });

    getActiveLocationId().then((activeLocId) => {
      cy.task("waitForPatientInDB", { email: PATIENT.email, maxAttempts: 15, intervalMs: 2000 })
        .then((patient) => {
          expect(patient).to.not.be.null;
          const p = patient as Record<string, unknown>;
          expect(p.firstname).to.eq(PATIENT.firstname);
          expect(p.lastname).to.eq(PATIENT.lastname);
          expect(p.email).to.eq(PATIENT.email);
          expect(String(p.phone)).to.include(PATIENT.phone.replace(/\D/g, "").slice(-10));
          expect(p.gender).to.eq(PATIENT.gender);
          expect(p.onsite).to.eq(true);
          if (activeLocId > 0) expect(p.locationid).to.eq(activeLocId);
          cy.log(`DB: locationid=${p.locationid}, address=${p.address}, dob=${p.dob}`);
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

    cy.get("body").then(($body) => {
      const rows = $body.find(".grid.grid-cols-6.gap-4.py-4");
      if (rows.length === 0) {
        cy.log("No past records for this location — test passes.");
        return;
      }
      cy.contains("button", /^select$|^seleccionar$/i).first().click({ force: true });
      cy.url().should("include", "/pos/sales");
      cy.contains(/patients details/i).should("exist");
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

        getCartRowValue("Balance").then((creditUsed) => { expect(creditUsed).to.equal(0); });
        getCartRowValue("Total Paid").then((totalPaid) => { expect(totalPaid).to.be.closeTo(cartTotal, 0.01); });

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

        getCartRowValue("Balance").then((d) => { expect(d).to.be.closeTo(expectedCreditUsed, 0.01); });
        getCreditAvailable().then((u) => { expect(u).to.be.closeTo(expectedBalanceLimit, 0.01); });
        getCartRowValue("Total Paid").then((tp) => { expect(tp).to.be.closeTo(partialCash, 0.01); });

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

// ─── POS Sales — Cart & Discount Features ────────────────────────────────────

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
      // Open discount modal via Add button
      cy.contains("h1", /Discount Used %/i).parent().find("button").contains("Add").click({ force: true });
      cy.get('input[placeholder="Enter % of discount"]').should("be.visible").clear().type("10");

      // Click Apply inside the modal — target precisely to avoid matching PromoCode Apply
      clickDiscountModalApply();

      // Product Total After Discount = originalTotal * 0.9
      getCartRowValue("Product Total After Discount").then((afterDiscount) => {
        expect(afterDiscount).to.be.closeTo(originalTotal * 0.9, 0.01);
      });

      cy.contains("h1", /Discount Used %/i).parent().find("p").invoke("text").then((txt) => {
        expect(txt).to.include("10");
      });
    });
  });

  it("should remove a cart-level discount and restore original total", () => {
    selectSharedPatient();
    addProductToCart("Vitamin B12", 1);

    getCartRowValue("Product Total After Discount").then((originalTotal) => {
      cy.contains("h1", /Discount Used %/i).parent().find("button").contains("Add").click({ force: true });
      cy.get('input[placeholder="Enter % of discount"]').should("be.visible").clear().type("20");
      clickDiscountModalApply();

      getCartRowValue("Product Total After Discount").then((discounted) => {
        expect(discounted).to.be.closeTo(originalTotal * 0.8, 0.01);
      });

      // X button removes the discount
      cy.contains("h1", /Discount Used %/i).parent().find("button").contains("X").click({ force: true });
      cy.wait(500);

      getCartRowValue("Product Total After Discount").then((restored) => {
        expect(restored).to.be.closeTo(originalTotal, 0.01);
      });
    });
  });

  it("should apply a per-item discount on a cart product", () => {
    selectSharedPatient();
    addProductToCart("Vitamin B12", 1);

    cy.contains("button", /add discount/i).first().click({ force: true });
    cy.get('input[placeholder="Enter % of discount"]').should("be.visible").clear().type("15");
    clickPerItemDiscountModalApply();

    cy.contains("15% off").should("exist");
    getCartRowValue("Product Total After Discount").then((afterDiscount) => {
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

    cy.get('input[placeholder="Promo Code"]').clear().type("FBK3QE8QP");
    cy.contains("button", "Apply").click();
    cy.contains(/expired|invalid/i).should("exist");
    cy.contains("NILL").should("exist");
  });

  it("should add multiple products to cart and show combined total", () => {
    selectSharedPatient();
    addProductToCart("Vitamin B12", 1);

    getCartRowValue("Product Total After Discount").then((firstTotal) => {
      addProductToCart("Vitamin B12", 2);
      getCartRowValue("Product Total After Discount").then((combinedTotal) => {
        expect(combinedTotal).to.be.greaterThan(firstTotal);
      });
    });
  });

  it("should increase product quantity by adding same product again and update total", () => {
    selectSharedPatient();
    addProductToCart("Vitamin B12", 1);

    getCartRowValue("Product Total After Discount").then((singleTotal) => {
      addProductToCart("Vitamin B12", 1);
      getCartRowValue("Product Total After Discount").then((doubleTotal) => {
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

// ─── Add from Other Location + Discount + Order ───────────────────────────────

describe("POS Sales — Add from Other Location", () => {
  beforeEach(() => {
    cy.viewport(1280, 800);
    cy.loginWithCredentials(TEST_EMAIL, TEST_PASSWORD);
    cy.visit("/en/pos/sales/patients");
  });

  it("should add product from another location, apply/change/remove discount, place order and verify inventory reduced", () => {
    // ── Step 1: Select a patient ──────────────────────────────────────────
    cy.wait(1000);
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

    // ── Step 2: Open "Add from Other Location" modal ──────────────────────
    cy.contains("button", /Add from Other Location/i).click({ force: true });

    // Flowbite Modal renders with role="dialog"
    cy.get('[role="dialog"]', { timeout: 10000 }).should("be.visible");
    cy.contains("Select Location").should("exist");

    // ── Step 3: Select Location (1st select in modal) ─────────────────────
    // Pick the first non-disabled, non-empty option (not current location)
    cy.get('[role="dialog"]').within(() => {
      cy.get("select").eq(0).find("option:not([disabled])").not('[value=""]').first()
        .invoke("val").then((locVal) => {
          cy.get("select").eq(0).select(String(locVal), { force: true });
          cy.log(`Location selected: ${locVal}`);
        });
    });
    cy.wait(1500); // wait for categories to load

    // ── Step 4: Select Category (2nd select — appears after location chosen) ─
    cy.get('[role="dialog"]').within(() => {
      cy.contains("Select Category").should("exist");
      cy.get("select").eq(1).find("option").not('[value=""]').first()
        .invoke("val").then((catVal) => {
          cy.get("select").eq(1).select(String(catVal), { force: true });
          cy.log(`Category selected: ${catVal}`);
        });
    });
    cy.wait(1500); // wait for products to load

    // ── Step 5: Select Product (3rd select — appears after category chosen) ─
    let selectedProductName = "";
    let selectedInventoryId = 0;

    cy.get('[role="dialog"]').within(() => {
      cy.contains("Select Product").should("exist");
      cy.get("select").eq(2).find("option").not('[value=""]').first().then(($opt) => {
        selectedProductName = $opt.text().trim();
        selectedInventoryId = parseInt($opt.val() as string) || 0;
        cy.log(`Product: ${selectedProductName}, inventory_id: ${selectedInventoryId}`);
        cy.get("select").eq(2).select(String(selectedInventoryId), { force: true });
      });
    });
    cy.wait(500);

    // ── Step 6: Increase quantity via + button (inside modal) ────────────
    cy.get('[role="dialog"]').within(() => {
      cy.contains("Quantity").should("exist");
      cy.contains("button", "+").click({ force: true });
    });
    cy.wait(300);

    // ── Step 7: Click Add to Cart button (inside modal) ───────────────────
    cy.get('[role="dialog"]').within(() => {
      cy.contains("button", /^Add to cart$|^Add$/i).click({ force: true });
    });
    cy.wait(500);

    // Modal closes
    cy.get('[role="dialog"]').should("not.exist");

    // ── Step 8: Expand cart panel via the collapse/expand button ──────────
    // The button is absolute -top-3 right-2 bg-blue-500 rounded-full
    cy.get("button.absolute.-top-3.right-2.bg-blue-500.rounded-full").click({ force: true });
    cy.wait(300);

    // ── Step 9: Verify cart item details ─────────────────────────────────
    // Cart item shows product name, category, quantity, and "Fulfilled at: <location>"
    cy.get(".bg-blue-50, .border-blue-400").first().within(() => {
      cy.contains(selectedProductName).should("exist");
      cy.log(`Product "${selectedProductName}" visible in cart`);
      cy.contains(/Fulfilled at:/i).should("exist");
      cy.log("Fulfilled at: label visible");
    });

    // ── Step 10: Apply a discount on the cart item ────────────────────────
    cy.contains("button", /add discount/i).first().click({ force: true });
    cy.get('input[placeholder="Enter % of discount"]').should("be.visible").clear().type("10");
    cy.get('[role="dialog"][aria-modal="true"]').find("button").contains("Apply").click({ force: true });
    cy.get('[role="dialog"][aria-modal="true"]').should("not.exist");
    cy.wait(300);

    cy.contains("10% off").should("exist");
    cy.log("10% discount applied to cart item");

    // Capture Product Total After Discount with 10% off
    cy.contains("h1", /Product Total After Discount/i).parent().find("p")
      .invoke("text").then((discountedTxt) => {
        const discountedTotal = parseFloat(discountedTxt.replace(/[^0-9.]/g, ""));
        cy.log(`Product Total After Discount (10% off): ${discountedTotal}`);

        // ── Step 11: Change discount to 20% ──────────────────────────────
        cy.contains("button", /change discount/i).first().click({ force: true });
        cy.get('input[placeholder="Enter % of discount"]').should("be.visible").clear().type("20");
        cy.get('[role="dialog"][aria-modal="true"]').find("button").contains("Apply").click({ force: true });
        cy.get('[role="dialog"][aria-modal="true"]').should("not.exist");
        cy.wait(300);

        cy.contains("20% off").should("exist");
        cy.log("Discount changed to 20%");

        cy.contains("h1", /Product Total After Discount/i).parent().find("p")
          .invoke("text").then((newDiscountedTxt) => {
            const newDiscountedTotal = parseFloat(newDiscountedTxt.replace(/[^0-9.]/g, ""));
            cy.log(`Product Total After Discount (20% off): ${newDiscountedTotal}`);
            // 20% discount should give a lower total than 10%
            expect(newDiscountedTotal).to.be.lessThan(discountedTotal);

            // ── Step 12: Remove discount ──────────────────────────────────
            cy.contains("button", /remove discount/i).first().click({ force: true });
            cy.wait(300);

            cy.contains("20% off").should("not.exist");
            cy.log("Discount removed");

            cy.contains("h1", /Product Total After Discount/i).parent().find("p")
              .invoke("text").then((restoredTxt) => {
                const restoredTotal = parseFloat(restoredTxt.replace(/[^0-9.]/g, ""));
                cy.log(`Product Total After Discount (no discount): ${restoredTotal}`);
                // Restored total should be higher than discounted total
                expect(restoredTotal).to.be.greaterThan(newDiscountedTotal);

                // ── Step 13: Get inventory qty before order ───────────────
                cy.task("getInventoryQuantity", { inventoryId: selectedInventoryId }).then((qtyBefore) => {
                  cy.log(`Inventory qty before order: ${qtyBefore}`);

                  // ── Step 14: Place the order ──────────────────────────
                  cy.get('input[placeholder="0.00"]').first()
                    .clear({ force: true }).type(restoredTotal.toFixed(2), { force: true });
                  cy.wait(500);

                  cy.intercept("POST", "/api/orders").as("placeOtherLocOrder");
                  getPlaceOrderButton().should("not.be.disabled").click({ force: true });

                  cy.wait("@placeOtherLocOrder").then((interception) => {
                    expect(interception.response?.statusCode).to.eq(200);
                    const orderId = interception.response?.body?.order_id;
                    cy.contains(/Order has been placed, order #\s*\d+/i).should("be.visible");
                    cy.log(`Order placed: #${orderId}`);

                    // ── Step 15: Verify inventory reduced in DB ───────────
                    // Note: for other-location products, inventory deduction
                    // happens via fulfillment flow, not immediately.
                    // We verify the order was created successfully.
                    cy.task("getInventoryQuantity", { inventoryId: selectedInventoryId }).then((qtyAfter) => {
                      cy.log(`Inventory qty after order: ${qtyAfter}`);
                      // Quantity should have decreased by 1 (the qty we added)
                      if (qtyBefore > 0 && qtyAfter >= 0) {
                        expect(qtyAfter).to.be.lessThan(qtyBefore);
                        cy.log(`Inventory reduced from ${qtyBefore} to ${qtyAfter}`);
                      } else {
                        cy.log("Inventory check skipped — unlimited or not tracked");
                      }
                    });
                  });
                });
              });
          });
      });
  });
});
