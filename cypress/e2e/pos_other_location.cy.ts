/// <reference types="cypress" />

// POS Sales — Add from Other Location
// Tests adding a product from a different location, applying/changing/removing
// per-item discount, placing the order, and verifying inventory reduction in DB.

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getPlaceOrderBtn = () =>
  cy.get("button.rounded.py-1.px-3.text-white.w-1\\/2.flex.justify-between.items-center.text-sm");

/**
 * Flowbite <Modal> renders as:
 * <div class="fixed inset-0 z-50 overflow-y-auto overflow-x-hidden ...">
 *   <div class="relative ..."> ← modal content
 * The inner content div contains the selects.
 */
function getOtherLocationModal() {
  return cy.get("div.fixed.inset-0.z-50.overflow-y-auto");
}

function selectFirstPatient() {
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
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("POS Sales — Add from Other Location", () => {
  beforeEach(() => {
    cy.viewport(1280, 800);
    cy.loginWithCredentials(TEST_EMAIL, TEST_PASSWORD);
    cy.visit("/en/pos/sales/patients");
  });

  it("should add product from another location, apply/change/remove discount, place order and verify inventory reduced", () => {
    // ── Step 1: Select a patient ──────────────────────────────────────────
    selectFirstPatient();

    // ── Step 2: Open "Add from Other Location" modal ──────────────────────
    cy.contains("button", "Add from Other Location").click({ force: true });

    // Flowbite Modal: fixed inset-0 z-50 overflow-y-auto
    getOtherLocationModal().should("exist");
    cy.contains("Select Location").should("exist");

    // ── Step 3: Select Location (1st select) ─────────────────────────────
    getOtherLocationModal().within(() => {
      cy.get("select").eq(0)
        .find("option:not([disabled])").not('[value=""]').first()
        .invoke("val").then((locVal) => {
          cy.get("select").eq(0).select(String(locVal), { force: true });
          cy.log(`Location selected: ${locVal}`);
        });
    });
    cy.wait(1500);

    // ── Step 4: Select Category (2nd select — visible after location) ─────
    cy.contains("Select Category").should("exist");
    getOtherLocationModal().within(() => {
      cy.get("select").eq(1)
        .find("option").not('[value=""]').first()
        .invoke("val").then((catVal) => {
          cy.get("select").eq(1).select(String(catVal), { force: true });
          cy.log(`Category selected: ${catVal}`);
        });
    });
    cy.wait(1500);

    // ── Step 5: Select Product (3rd select — visible after category) ──────
    cy.contains("Select Product").should("exist");

    let selectedProductName = "";
    let selectedInventoryId = 0;

    getOtherLocationModal().within(() => {
      cy.get("select").eq(2)
        .find("option").not('[value=""]').first().then(($opt) => {
          selectedProductName = $opt.text().trim();
          selectedInventoryId = parseInt($opt.val() as string) || 0;
          cy.log(`Product: "${selectedProductName}", inventory_id: ${selectedInventoryId}`);
          cy.get("select").eq(2).select(String(selectedInventoryId), { force: true });
        });
    });
    cy.wait(500);

    // ── Step 6: Increase quantity via + button ────────────────────────────
    cy.contains("Quantity").should("exist");
    getOtherLocationModal().within(() => {
      cy.contains("button", "+").click({ force: true });
    });
    cy.wait(300);

    // ── Step 7: Click "Add to cart" button ────────────────────────────────
    getOtherLocationModal().within(() => {
      cy.contains("button", "Add to cart").click({ force: true });
    });
    cy.wait(500);

    // Modal closes — the fixed overlay disappears
    cy.get("div.fixed.inset-0.z-50.overflow-y-auto").should("not.exist");

    // ── Step 8: Expand cart panel (collapse/expand toggle button) ─────────
    // Button: absolute -top-3 right-2 z-10 p-1 bg-blue-500 rounded-full
    cy.get("button.absolute").filter(".bg-blue-500").click({ force: true });
    cy.wait(300);

    // ── Step 9: Verify cart item — product name, Fulfilled at label ───────
    // Other-location items render with blue border: bg-blue-50 border-blue-400
    cy.get(".bg-blue-50, .border.border-blue-400").first().within(() => {
      cy.contains(selectedProductName).should("exist");
      cy.log(`"${selectedProductName}" visible in cart`);
      cy.contains(/Fulfilled at:/i).should("exist");
      cy.log("Fulfilled at: label confirmed");
    });

    // ── Step 10: Apply 10% per-item discount ─────────────────────────────
    cy.contains("button", /add discount/i).first().click({ force: true });
    cy.get('input[placeholder="Enter % of discount"]').should("be.visible").clear().type("10");
    cy.get('[role="dialog"][aria-modal="true"]').find("button").contains("Apply").click({ force: true });
    cy.get('[role="dialog"][aria-modal="true"]').should("not.exist");
    cy.wait(300);

    cy.contains("10% off").should("exist");
    cy.log("10% discount applied");

    cy.contains("h1", /Product Total After Discount/i).parent().find("p")
      .invoke("text").then((txt10) => {
        const total10 = parseFloat(txt10.replace(/[^0-9.]/g, ""));
        cy.log(`Total after 10% discount: ${total10}`);

        // ── Step 11: Change discount to 20% ──────────────────────────────
        cy.contains("button", /change discount/i).first().click({ force: true });
        cy.get('input[placeholder="Enter % of discount"]').should("be.visible").clear().type("20");
        cy.get('[role="dialog"][aria-modal="true"]').find("button").contains("Apply").click({ force: true });
        cy.get('[role="dialog"][aria-modal="true"]').should("not.exist");
        cy.wait(300);

        cy.contains("20% off").should("exist");
        cy.log("Discount changed to 20%");

        cy.contains("h1", /Product Total After Discount/i).parent().find("p")
          .invoke("text").then((txt20) => {
            const total20 = parseFloat(txt20.replace(/[^0-9.]/g, ""));
            cy.log(`Total after 20% discount: ${total20}`);
            expect(total20).to.be.lessThan(total10);

            // ── Step 12: Remove discount ──────────────────────────────────
            cy.contains("button", /remove discount/i).first().click({ force: true });
            cy.wait(300);

            cy.contains("20% off").should("not.exist");
            cy.log("Discount removed");

            cy.contains("h1", /Product Total After Discount/i).parent().find("p")
              .invoke("text").then((txtNoDiscount) => {
                const totalNoDiscount = parseFloat(txtNoDiscount.replace(/[^0-9.]/g, ""));
                cy.log(`Total after removing discount: ${totalNoDiscount}`);
                expect(totalNoDiscount).to.be.greaterThan(total20);

                // ── Step 13: Get inventory qty before order ───────────────
                cy.task("getInventoryQuantity", { inventoryId: selectedInventoryId }).then((qtyBefore) => {
                  cy.log(`Inventory before order: ${qtyBefore}`);

                  // ── Step 14: Place the order ──────────────────────────
                  cy.get('input[placeholder="0.00"]').first()
                    .clear({ force: true }).type(totalNoDiscount.toFixed(2), { force: true });
                  cy.wait(500);

                  cy.intercept("POST", "/api/orders").as("placeOtherLocOrder");
                  getPlaceOrderBtn().should("not.be.disabled").click({ force: true });

                  cy.wait("@placeOtherLocOrder").then((interception) => {
                    expect(interception.response?.statusCode).to.eq(200);
                    const orderId = interception.response?.body?.order_id;
                    cy.contains(/Order has been placed, order #\s*\d+/i).should("be.visible");
                    cy.log(`Order placed: #${orderId}`);

                    // ── Step 15: Verify inventory reduced in DB ───────────
                    cy.task("getInventoryQuantity", { inventoryId: selectedInventoryId }).then((qtyAfter) => {
                      cy.log(`Inventory after order: ${qtyAfter}`);
                      if (qtyBefore > 0 && qtyAfter >= 0) {
                        expect(qtyAfter).to.be.lessThan(qtyBefore);
                        cy.log(`Inventory reduced: ${qtyBefore} → ${qtyAfter}`);
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
