/// <reference types="cypress" />

Cypress.Commands.add("loginByUi", () => {
  cy.env(["E2E_EMAIL", "E2E_PASSWORD"]).then(({ E2E_EMAIL, E2E_PASSWORD }) => {
    const email = E2E_EMAIL as string | undefined;
    const password = E2E_PASSWORD as string | undefined;

    if (!email || !password) {
      throw new Error(
        "Missing credentials. Set CYPRESS_E2E_EMAIL and CYPRESS_E2E_PASSWORD before running Cypress.",
      );
    }

    cy.session(
      [email],
      () => {
        cy.visit("/en/login");

        cy.get('input[name="email"]:visible', { timeout: 20000 })
          .should("be.visible")
          .first()
          .clear()
          .type(email);
        cy.get('input[name="password"]:visible')
          .should("be.visible")
          .first()
          .clear()
          .type(password, { log: false });

        cy.get('button[type="submit"]:visible')
          .should("be.enabled")
          .first()
          .click();

        cy.location("pathname", { timeout: 60000 }).should((pathname) => {
          expect(pathname.toLowerCase()).to.not.match(
            /\/(?:[a-z]{2}\/)?login\/?$/,
          );
        });
      },
      {
        validate: () => {
          cy.visit("/en/pos/sales/patients");
          cy.location("pathname", { timeout: 60000 }).should(
            "include",
            "/pos/sales/patients",
          );
        },
      },
    );
  });
});

Cypress.Commands.add("loginWithCredentials", (email: string, password: string) => {
  cy.session(
    [email],
    () => {
      cy.visit("/en/login");

      cy.get('input[name="email"]:visible', { timeout: 20000 })
        .should("be.visible")
        .first()
        .clear()
        .type(email);
      cy.get('input[name="password"]:visible')
        .should("be.visible")
        .first()
        .clear()
        .type(password, { log: false });

      cy.get('button[type="submit"]:visible')
        .should("be.enabled")
        .first()
        .click();

      cy.location("pathname", { timeout: 60000 }).should((pathname) => {
        expect(pathname.toLowerCase()).to.not.match(
          /\/(?:[a-z]{2}\/)?login\/?$/,
        );
      });
    },
    {
      cacheAcrossSpecs: false,
      validate: () => {
        cy.visit("/en/pos/sales/patients");
        cy.location("pathname", { timeout: 60000 }).should(
          "include",
          "/pos/sales/patients",
        );
      },
    },
  );
});

declare global {
  namespace Cypress {
    interface Chainable {
      loginByUi(): Chainable<void>;
      loginWithCredentials(email: string, password: string): Chainable<void>;
    }
  }
}

export {};
