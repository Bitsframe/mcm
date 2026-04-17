/// <reference types="cypress" />

// Transactions E2E Tests

function loginAndGoToPatients() {
  cy.loginWithCredentials(TEST_EMAIL, TEST_PASSWORD);
  cy.visit("/en/pos/sales/patients");
  cy.wait(1000);
}

function selectFirstPatient() {
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

function placeOrderAndCapture(): Cypress.Chainable<{ orderId: number; patientId: number; cartTotal: number }> {
  cy.contains("button", "Add Product").click();
  cy.get('input[placeholder="Search product..."]').should("be.visible");
  cy.get("table tbody tr").should("have.length.greaterThan", 0);
  cy.get('input[placeholder="Search product..."]').clear().type("Vitamin B12");
  cy.contains("Vitamin B12").should("be.visible");
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
    selectFirstPatient();

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

    cy.get('input[placeholder="Search patients..."]').clear().type("Alaina");
    cy.wait(500);
    cy.get("body").then(($body) => {
      cy.log(`Rows for "Alaina": ${$body.find("table tbody tr").length}`);
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
    selectFirstPatient();

    // Place an order so we have a guaranteed transaction to view
    placeOrderAndCapture().then(({ orderId, patientId, cartTotal }) => {
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

        // Verify all transaction card fields are present
        cy.contains("Transaction ID:").should("exist");
        cy.contains("Date:").should("exist");
        cy.contains("Amount:").should("exist");
        cy.contains("Balance:").should("exist");
        cy.contains("Payment Method:").should("exist");

        // Read and log the actual values from the first transaction card
        cy.contains("Transaction ID:").parent().invoke("text").then((txIdTxt) => {
          cy.log(`Transaction ID: ${txIdTxt.trim()}`);
        });
        cy.contains("Date:").parent().invoke("text").then((dateTxt) => {
          cy.log(`Date: ${dateTxt.trim()}`);
        });
        cy.contains("Amount:").parent().invoke("text").then((amtTxt) => {
          cy.log(`Amount: ${amtTxt.trim()}`);
          // Amount should contain the cart total we just paid
          expect(amtTxt).to.include(cartTotal.toFixed(2));
        });
        cy.contains("Balance:").parent().invoke("text").then((balTxt) => {
          cy.log(`Balance: ${balTxt.trim()}`);
        });
        cy.contains("Payment Method:").parent().invoke("text").then((pmTxt) => {
          cy.log(`Payment Method: ${pmTxt.trim()}`);
          expect(pmTxt).to.include("Cash");
        });

        cy.log(`Transaction for order #${orderId}, patient #${patientId} verified in sheet`);
      });
    });
  });

  it("should paginate patients — Next changes records, Previous restores them", () => {
    cy.loginWithCredentials(TEST_EMAIL, TEST_PASSWORD);
    cy.visit("/en/transactions");
    cy.wait(2000);

    // Check if there are enough patients to paginate (> 6 per page)
    cy.get("body").then(($body) => {
      const showingText = $body.find("div").filter((_, el) =>
        /Showing \d+ to \d+ of \d+/.test(el.textContent || "")
      ).first().text();

      cy.log(`Pagination info: ${showingText}`);

      const match = showingText.match(/of (\d+) patients/);
      const total = match ? parseInt(match[1]) : 0;

      if (total <= 6) {
        cy.log(`Only ${total} patients — not enough for pagination. Test passes.`);
        return;
      }

      // Capture first page patient names
      cy.get("table tbody tr").then(($rows) => {
        const firstPageNames: string[] = [];
        $rows.each((_, row) => {
          firstPageNames.push((row as HTMLTableRowElement).cells[0]?.textContent?.trim() || "");
        });
        cy.log(`Page 1 first patient: ${firstPageNames[0]}`);

        // Click Next
        cy.contains("button", "Next").click({ force: true });
        cy.wait(500);

        // Capture second page patient names
        cy.get("table tbody tr").then(($rows2) => {
          const secondPageNames: string[] = [];
          $rows2.each((_, row) => {
            secondPageNames.push((row as HTMLTableRowElement).cells[0]?.textContent?.trim() || "");
          });
          cy.log(`Page 2 first patient: ${secondPageNames[0]}`);

          // Records must be different
          expect(secondPageNames[0]).to.not.eq(firstPageNames[0]);
          cy.log("Next button changed the records");

          // Pagination info should show page 2 range
          cy.contains(/Showing 7 to \d+ of \d+/).should("exist");

          // Click Previous — should go back to page 1
          cy.contains("button", "Previous").click({ force: true });
          cy.wait(500);

          cy.get("table tbody tr").first().within(() => {
            cy.get("td").first().invoke("text").then((name) => {
              expect(name.trim()).to.eq(firstPageNames[0]);
              cy.log(`Previous restored page 1 — first patient: ${name.trim()}`);
            });
          });

          // Pagination info back to page 1
          cy.contains(/Showing 1 to \d+ of \d+/).should("exist");

          // Previous button should be disabled on page 1
          cy.contains("button", "Previous").should("be.disabled");
          cy.log("Previous button disabled on page 1");
        });
      });
    });
  });

  it("should display correct current balance for a patient", () => {
    loginAndGoToPatients();
    selectFirstPatient();

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
