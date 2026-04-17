/// <reference types="cypress" />

// POS Sales — Add from Other Location

const getPlaceOrderBtn = () =>
  cy.get("button.rounded.py-1.px-3.text-white.w-1\\/2.flex.justify-between.items-center.text-sm");

/**
 * Flowbite Modal root class (from theme.js):
 * "fixed inset-x-0 top-0 z-50 h-screen overflow-y-auto overflow-x-hidden md:inset-0 md:h-full"
 * When open it also has: "flex bg-gray-900 bg-opacity-50"
 * We target by the stable part: fixed + z-50 + overflow-y-auto
 */
const getFlowbiteModal = () =>
  cy.get("div.fixed.z-50.overflow-y-auto.overflow-x-hidden", { timeout: 15000 });

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

describe("POS Sales — Add from Other Location", () => {
  beforeEach(() => {
    cy.viewport(1280, 800);
    cy.loginWithCredentials(TEST_EMAIL, TEST_PASSWORD);
    cy.visit("/en/pos/sales/patients");
  });

  it("should add product from another location, apply/change/remove discount, place order and verify inventory reduced", () => {
    // ── Step 1: Select patient ────────────────────────────────────────────
    selectFirstPatient();

    // ── Step 2: Open modal ────────────────────────────────────────────────
    cy.contains("button", "Add from Other Location").click({ force: true });

    // Wait for Flowbite Modal to appear (has flex + bg-gray-900 when open)
    getFlowbiteModal().should("exist");
    cy.contains("Select Location").should("exist");
    cy.log("Add from Other Location modal opened");

    // ── Step 3: Select Location ───────────────────────────────────────────
    // The modal content has the selects — scope to the modal
    getFlowbiteModal().within(() => {
      cy.get("select").first()
        .find("option:not([disabled])").not('[value=""]').first()
        .invoke("val").then((locVal) => {
          cy.get("select").first().select(String(locVal), { force: true });
          cy.log(`Location selected: ${locVal}`);
        });
    });
    cy.wait(1500);

    // ── Step 4: Select Category ───────────────────────────────────────────
    cy.contains("Select Category").should("exist");
    getFlowbiteModal().within(() => {
      cy.get("select").eq(1)
        .find("option").not('[value=""]').first()
        .invoke("val").then((catVal) => {
          cy.get("select").eq(1).select(String(catVal), { force: true });
          cy.log(`Category selected: ${catVal}`);
        });
    });
    cy.wait(1500);

    // ── Step 5: Select Product ────────────────────────────────────────────
    cy.contains("Select Product").should("exist");

    let selectedProductName = "";
    let selectedInventoryId = 0;

    getFlowbiteModal().within(() => {
      cy.get("select").eq(2)
        .find("option").not('[value=""]').first().then(($opt) => {
          selectedProductName = $opt.text().trim();
          selectedInventoryId = parseInt($opt.val() as string) || 0;
          cy.log(`Product: "${selectedProductName}", inventory_id: ${selectedInventoryId}`);
          cy.get("select").eq(2).select(String(selectedInventoryId), { force: true });
        });
    });
    cy.wait(500);

    // ── Step 6: Set quantity to 2 via + button ────────────────────────────
    cy.contains("Quantity").should("exist");
    getFlowbiteModal().within(() => {
      cy.contains("button", "+").click({ force: true });
      cy.wait(200);
      cy.contains("button", "+").click({ force: true });
    });
    cy.wait(300);

    // ── Step 7: Click "Add to cart" ───────────────────────────────────────
    getFlowbiteModal().within(() => {
      cy.contains("button", "Add to cart").click({ force: true });
    });
    cy.wait(500);

    // Modal closes — the Flowbite overlay disappears
    cy.get("div.fixed.z-50.overflow-y-auto.overflow-x-hidden").should("not.exist");
    cy.log("Modal closed after Add to cart");

    // ── Step 8: Expand cart panel ─────────────────────────────────────────
    cy.get("button.absolute").filter(".bg-blue-500").first().click({ force: true });
    cy.wait(300);

    // ── Step 9: Verify cart item ──────────────────────────────────────────
    // Other-location items have blue border styling
    cy.get(".bg-blue-50, .border.border-blue-400").first().within(() => {
      cy.contains(selectedProductName).should("exist");
      cy.log(`"${selectedProductName}" in cart`);
      cy.contains(/Fulfilled at:/i).should("exist");
      cy.log("Fulfilled at: confirmed");
    });

    // ── Step 10: Apply 10% discount ───────────────────────────────────────
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
        cy.log(`Total at 10%: ${total10}`);

        // ── Step 11: Change to 20% ────────────────────────────────────────
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
            cy.log(`Total at 20%: ${total20}`);
            expect(total20).to.be.lessThan(total10);

            // ── Step 12: Remove discount ──────────────────────────────────
            cy.contains("button", /remove discount/i).first().click({ force: true });
            cy.wait(300);
            cy.contains("20% off").should("not.exist");
            cy.log("Discount removed");

            cy.contains("h1", /Product Total After Discount/i).parent().find("p")
              .invoke("text").then((txtNone) => {
                const totalNone = parseFloat(txtNone.replace(/[^0-9.]/g, ""));
                cy.log(`Total no discount: ${totalNone}`);
                expect(totalNone).to.be.greaterThan(total20);

                // ── Step 13: Inventory before ─────────────────────────────
                cy.task("getInventoryQuantity", { inventoryId: selectedInventoryId }).then((qtyBefore) => {
                  cy.log(`Inventory before: ${qtyBefore}`);

                  // ── Step 14: Place order ──────────────────────────────
                  cy.get('input[placeholder="0.00"]').first()
                    .clear({ force: true }).type(totalNone.toFixed(2), { force: true });
                  cy.wait(500);

                  cy.intercept("POST", "/api/orders").as("placeOtherLocOrder");
                  getPlaceOrderBtn().should("not.be.disabled").click({ force: true });

                  cy.wait("@placeOtherLocOrder").then((interception) => {
                    expect(interception.response?.statusCode).to.eq(200);
                    const orderId = interception.response?.body?.order_id;
                    cy.contains(/Order has been placed, order #\s*\d+/i).should("be.visible");
                    cy.log(`Order placed: #${orderId}`);

                    // ── Step 15: Inventory after ──────────────────────────
                    cy.task("getInventoryQuantity", { inventoryId: selectedInventoryId }).then((qtyAfter) => {
                      cy.log(`Inventory after: ${qtyAfter}`);
                      if ((qtyBefore as number) > 0 && (qtyAfter as number) >= 0) {
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
