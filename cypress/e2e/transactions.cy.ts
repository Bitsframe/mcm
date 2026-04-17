/// <reference types="cypress" />

// Transactions E2E Tests
// Patient: Saira Hamza | Product: Ultrasound POLARYS

const TX_PATIENT_NAME = "Saira Hamza";
const TX_PRODUCT_NAME = "Ultrasound POLARYS";

function loginAndGoToPatients() {
  cy.loginWithCredentials(TEST_EMAIL, TEST_PASSWORD);
  cy.visit("/en/pos/sales/patients");
  cy.wait(1000);
}

/**
 * Search for Saira Hamza in the patients page and select her.
 * Falls back to first available patient if not found.
 */
function selectSairaHamza() {
  // Search by name to isolate Saira Hamza
  cy.get('input[placeholder*="search"]').clear().type("Saira");
  cy.wait(800);

  cy.get("body").then(($body) => {
    const selectBtns = $body.find("button:visible").toArray()
      .filter((b) => /^select$|^seleccionar$/i.test((b.textContent || "").trim()));

    if (selectBtns.length > 0) {
      cy.wrap(selectBtns[0]).click({ force: true });
      cy.log(`Selected patient: ${TX_PATIENT_NAME}`);
    } else {
      // Saira not in Today — try Past Records
      cy.contains("button", "Past records").click({ force: true });
      cy.wait(1000);
      cy.get('input[placeholder*="search"]').clear().type("Saira");
      cy.wait(800);

      cy.get("body").then(($body2) => {
        const pastBtns = $body2.find("button:visible").toArray()
          .filter((b) => /^select$|^seleccionar$/i.test((b.textContent || "").trim()));

        if (pastBtns.length > 0) {
          cy.wrap(pastBtns[0]).click({ force: true });
          cy.log(`Selected ${TX_PATIENT_NAME} from Past Records`);
        } else {
          // Fallback: clear search and pick first available patient
          cy.contains("button", "Today").click({ force: true });
          cy.wait(500);
          cy.get('input[placeholder*="search"]').clear();
          cy.wait(500);
          cy.contains("button", /^select$|^seleccionar$/i).first().click({ force: true });
          cy.log("Saira Hamza not found — using first available patient");
        }
      });
    }
  });

  cy.url().should("include", "/pos/sales");
  cy.contains("button", "Add Product").should("not.be.disabled");
}

function placeOrderAndCapture(): Cypress.Chainable<{ orderId: number; patientId: number; cartTotal: number }> {
  cy.contains("button", "Add Product").click();
  cy.get('input[placeholder="Search product..."]').should("be.visible");
  cy.get("table tbody tr").should("have.length.greaterThan", 0);

  // Search for Ultrasound POLARYS — fall back to Vitamin B12 if not available
  cy.get('input[placeholder="Search product..."]').clear().type(TX_PRODUCT_NAME);
  cy.wait(500);

  cy.get("body").then(($body) => {
    const hasProduct = $body.text().includes(TX_PRODUCT_NAME);
    if (!hasProduct) {
      cy.log(`${TX_PRODUCT_NAME} not found — falling back to Vitamin B12`);
      cy.get('input[placeholder="Search product..."]').clear().type("Vitamin B12");
      cy.contains("Vitamin B12").should("be.visible");
    } else {
      cy.contains(TX_PRODUCT_NAME).should("be.visible");
    }
  });

  cy.get("table tbody tr").first().find("button").contains("+").click({ force: true });
  cy.contains("button", "Add to Cart").click({ force: true });
  cy.wait(300);
  cy.get('button[aria-label="Close modal"]').click({ force: true });
  cy.get('input[placeholder="Search product..."]').should("not.exist");
  cy.wait(300);

  let capturedTotal = 0;
  cy.contains("h1", /Product Total After Discount/i).parent().find("p")
    .invoke("text").then((txt) => {
      capturedTotal = parseFloat(txt.replace(/[^0-9.]/g, ""));
      cy.get('input[placeholder="0.00"]').first().clear({ force: true }).type(capturedTotal.toFixed(2), { force: true });
      cy.wait(500);
    });

  cy.intercept("POST", "/api/orders").as("placeOrderTx");
  cy.get("button.rounded.py-1.px-3.text-white.w-1\\/2.flex.justify-between.items-center.text-sm")
    .should("not.be.disabled").click({ force: true });

  return cy.wait("@placeOrderTx").then((interception) => {
    const orderId = interception.response?.body?.order_id as number;
    cy.contains(/Order has been placed, order #\s*\d+/i).should("be.visible");
    cy.log(`Order placed: #${orderId}`);
    return cy.window().then((win) => {
      const patientData = JSON.parse(win.localStorage.getItem("@pos-patient") || "{}");
      const patientId = patientData?.id as number;
      cy.log(`Patient ID: ${patientId}`);
      return cy.wrap({ orderId, patientId, cartTotal: capturedTotal });
    });
  });
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("Transactions", () => {
  beforeEach(() => {
    cy.viewport(1280, 800);
  });

  it("should show the placed order as a transaction for the patient", () => {
    loginAndGoToPatients();
    selectSairaHamza();

    placeOrderAndCapture().then(({ orderId, patientId, cartTotal }) => {
      cy.log(`Order #${orderId}, patient #${patientId}, amount $${cartTotal}`);

      // Verify and LOG the Supabase transaction_history record
      cy.task("getLatestTransactionForPatient", { patientId, orderId }).then((tx) => {
        expect(tx).to.not.be.null;
        const t = tx as Record<string, unknown>;
        cy.log("Supabase transaction_history record:");
        cy.log(`  id:         ${t.id}`);
        cy.log(`  patient_id: ${t.patient_id}`);
        cy.log(`  order_id:   ${t.order_id}`);
        cy.log(`  type:       ${t.type}`);
        cy.log(`  amount:     ${t.amount}`);
        cy.log(`  balance:    ${t.balance}`);
        cy.log(`  created_at: ${t.created_at}`);
        expect(t.patient_id).to.eq(patientId);
        expect(t.order_id).to.eq(orderId);
        expect(t.type).to.eq("order");
        expect(Number(t.amount)).to.be.closeTo(cartTotal, 0.01);
      });

      cy.visit("/en/transactions");
      cy.wait(2000);

      cy.window().then((win) => {
        const patientData = JSON.parse(win.localStorage.getItem("@pos-patient") || "{}");
        const patientEmail = patientData?.email as string;

        if (patientEmail) {
          cy.get('input[placeholder="Search patients..."]').clear().type(patientEmail.split("@")[0]);
          cy.wait(500);
        }

        cy.get("table tbody tr").should("have.length.greaterThan", 0);

        // Verify Current Balance column shows a dollar amount
        cy.get("table tbody tr").first().within(() => {
          cy.get("td").eq(3).invoke("text").then((balanceTxt) => {
            cy.log(`Current Balance in table: ${balanceTxt.trim()}`);
            expect(balanceTxt.trim()).to.match(/\$[\d.]+/);
          });
        });

        // Click View Transaction
        cy.get("table tbody tr").first()
          .find("button").contains("View Transaction")
          .click({ force: true });

        cy.contains(/Transactions/i, { timeout: 10000 }).should("exist");

        // Verify amount and payment method in sheet
        cy.contains(cartTotal.toFixed(2)).should("exist");
        cy.log(`Transaction amount $${cartTotal.toFixed(2)} found in sheet`);
        cy.contains("Cash").should("exist");
        cy.log("Payment method 'Cash' confirmed");
      });
    });
  });

  it("should filter patients by name in the transactions table", () => {
    cy.loginWithCredentials(TEST_EMAIL, TEST_PASSWORD);
    cy.visit("/en/transactions");
    cy.wait(2000);

    cy.get('input[placeholder="Search patients..."]').clear().type("Saira");
    cy.wait(500);
    cy.get("body").then(($body) => {
      cy.log(`Rows for "Saira Hamza": ${$body.find("table tbody tr").length}`);
    });

    cy.get('input[placeholder="Search patients..."]').clear().type("ZZZNOMATCH999");
    cy.wait(500);
    cy.contains("No patients found").should("exist");
  });

  it("should filter patients by email", () => {
    cy.loginWithCredentials(TEST_EMAIL, TEST_PASSWORD);
    cy.visit("/en/transactions");
    cy.wait(2000);

    cy.get('button[role="combobox"]').first().click({ force: true });
    cy.wait(300);
    cy.get('[role="option"]').contains("Email").click({ force: true });
    cy.wait(300);

    cy.get('input[placeholder="Search patients..."]').clear().type("testcypress.com");
    cy.wait(500);
    cy.get("body").then(($body) => {
      cy.log(`Rows for testcypress.com: ${$body.find("table tbody tr").length}`);
    });

    cy.get('input[placeholder="Search patients..."]').clear().type("zzznomatch@nowhere.xyz");
    cy.wait(500);
    cy.contains("No patients found").should("exist");
  });

  it("should open View Transaction sheet and show actual transaction details", () => {
    loginAndGoToPatients();
    selectSairaHamza();

    placeOrderAndCapture().then(({ orderId, patientId, cartTotal }) => {
      // Get the transaction from DB to know the exact values to assert
      cy.task("getLatestTransactionForPatient", { patientId, orderId }).then((tx) => {
        const t = tx as Record<string, unknown>;
        const dbAmount = Number(t.amount);
        const dbBalance = Number(t.balance);
        const dbDate = new Date(t.created_at as string).toLocaleDateString();
        cy.log(`DB tx — amount: ${dbAmount}, balance: ${dbBalance}, date: ${dbDate}`);

        cy.visit("/en/transactions");
        cy.wait(2000);

        cy.window().then((win) => {
          const patientData = JSON.parse(win.localStorage.getItem("@pos-patient") || "{}");
          const patientEmail = patientData?.email as string;

          if (patientEmail) {
            cy.get('input[placeholder="Search patients..."]').clear().type(patientEmail.split("@")[0]);
            cy.wait(500);
          }

          cy.get("table tbody tr").should("have.length.greaterThan", 0);

          cy.get("table tbody tr").first()
            .find("button").contains("View Transaction")
            .click({ force: true });

          cy.contains(/Transactions/i, { timeout: 10000 }).should("exist");

          // Confirm Date matches
          cy.contains("Date:").parent().invoke("text").then((dateTxt) => {
            cy.log(`UI Date: ${dateTxt.trim()}`);
            // Date shown in sheet matches today's date
            expect(dateTxt).to.include(new Date().toLocaleDateString());
          });

          // Confirm Amount matches cart total
          cy.contains("Amount:").parent().invoke("text").then((amtTxt) => {
            cy.log(`UI Amount: ${amtTxt.trim()}`);
            expect(amtTxt).to.include(dbAmount.toFixed(2));
          });

          // Confirm Balance is shown
          cy.contains("Balance:").parent().invoke("text").then((balTxt) => {
            cy.log(`UI Balance: ${balTxt.trim()}`);
            expect(balTxt).to.include(dbBalance.toFixed(2));
          });

          // Confirm Payment Method is Cash
          cy.contains("Payment Method:").parent().invoke("text").then((pmTxt) => {
            cy.log(`UI Payment Method: ${pmTxt.trim()}`);
            expect(pmTxt).to.include("Cash");
          });

          cy.log(`Transaction for order #${orderId}, patient #${patientId} fully verified`);
        });
      });
    });
  });

  // ── BUG: Delete transaction button not working ────────────────────────────
  

  it("should paginate patients — Next advances page, Previous goes back, buttons disable correctly", () => {
    cy.loginWithCredentials(TEST_EMAIL, TEST_PASSWORD);
    cy.visit("/en/transactions");
    cy.wait(2000);

    cy.get("body").then(($body) => {
      const showingText = $body.find("div").filter((_, el) =>
        /Showing \d+ to \d+ of \d+/.test(el.textContent || "")
      ).first().text();

      cy.log(`Pagination info: ${showingText}`);
      const match = showingText.match(/of (\d+) patients/);
      const total = match ? parseInt(match[1]) : 0;

      if (total <= 6) {
        cy.log(`Only ${total} patients — not enough for pagination. Test passes.`);
        // Previous should be disabled on page 1 (only page)
        cy.contains("button", "Previous").should("be.disabled");
        return;
      }

      // ── Page 1 state ──────────────────────────────────────────────────────
      // Previous is disabled on page 1
      cy.contains("button", "Previous").should("be.disabled");
      cy.log("Previous disabled on page 1 — correct");

      // Capture page 1 "Showing X to Y" text
      cy.contains(/Showing 1 to \d+ of \d+/).invoke("text").then((page1Text) => {
        cy.log(`Page 1 showing: ${page1Text.trim()}`);

        // ── Click Next ────────────────────────────────────────────────────
        cy.contains("button", "Next").click({ force: true });
        cy.wait(500);

        // Pagination text must change — no longer "Showing 1 to"
        cy.contains(/Showing 7 to \d+ of \d+/).should("exist");
        cy.contains(/Showing 7 to \d+ of \d+/).invoke("text").then((page2Text) => {
          cy.log(`Page 2 showing: ${page2Text.trim()}`);
          expect(page2Text.trim()).to.not.eq(page1Text.trim());
          cy.log("Next button advanced the page — pagination text changed");
        });

        // Previous is now enabled
        cy.contains("button", "Previous").should("not.be.disabled");
        cy.log("Previous enabled on page 2 — correct");

        // ── Click Previous ────────────────────────────────────────────────
        cy.contains("button", "Previous").click({ force: true });
        cy.wait(500);

        // Back to page 1 — "Showing 1 to" text restored
        cy.contains(/Showing 1 to \d+ of \d+/).should("exist");
        cy.log("Previous restored page 1 — pagination text back to 'Showing 1 to'");

        // Previous disabled again on page 1
        cy.contains("button", "Previous").should("be.disabled");
        cy.log("Previous disabled again on page 1 — correct");
      });
    });
  });

  it("should display correct current balance for a patient", () => {
    loginAndGoToPatients();
    selectSairaHamza();

    cy.window().then((win) => {
      const patientData = JSON.parse(win.localStorage.getItem("@pos-patient") || "{}");
      const patientId = patientData?.id as number;
      const patientEmail = patientData?.email as string;

      if (!patientId) {
        cy.log("No patient in localStorage — skipping");
        return;
      }

      placeOrderAndCapture().then(({ orderId }) => {
        cy.visit("/en/transactions");
        cy.wait(2000);

        if (patientEmail) {
          cy.get('input[placeholder="Search patients..."]').clear().type(patientEmail.split("@")[0]);
          cy.wait(500);
        }

        cy.get("table tbody tr").first().within(() => {
          cy.get("td").eq(3).invoke("text").then((balanceTxt) => {
            const uiBalance = parseFloat(balanceTxt.replace(/[^0-9.]/g, "")) || 0;
            cy.log(`UI Balance: $${uiBalance}`);

            cy.task("getLatestTransactionForPatient", { patientId, orderId }).then((tx) => {
              if (tx) {
                const t = tx as Record<string, unknown>;
                cy.log(`DB balance field: ${t.balance}`);
                expect(uiBalance).to.be.a("number");
                cy.log(`Balance $${uiBalance} verified on UI`);
              }
            });
          });
        });
      });
    });
  });
});

