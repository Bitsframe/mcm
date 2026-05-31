// cypress/e2e/login.cy.js
// Cypress test for login functionality on production

describe("Login Page - Production", () => {
  beforeEach(() => {
    cy.viewport(1280, 800); // Desktop viewport
  });
  it("should successfully log in with valid credentials", () => {
    cy.visit("/login");
    // Replace selectors and credentials with actual values
    cy.get("input[placeholder='Email']")
      .filter(":visible")
      .first()
      .type("mackjmart@gmail.com");
    cy.get("input[placeholder='Password']")
      .filter(":visible")
      .first()
      .type("Create123!");
    cy.get('button[type="submit"]').filter(":visible").first().click();
    // Assert successful login (update selector/text as per your app)
    cy.url().should("not.include", "/login");
    cy.contains("Dashboard"); // or any element/text visible after login
  });

  it("should show error on invalid credentials", () => {
    cy.visit("/login");
    cy.get("input[placeholder='Email']")
      .filter(":visible")
      .first()
      .type("wrong@example.com");
    cy.get("input[placeholder='Password']")
      .filter(":visible")
      .first()
      .type("wrongpassword");
    cy.get('button[type="submit"]').filter(":visible").first().click();
    // Assert error message (update selector/text as per your app)
    cy.contains("Invalid email or password");
  });

  it("should show browser validation for both fields empty", () => {
    cy.visit("/login");
    cy.get('button[type="submit"]').filter(":visible").first().click();
    cy.get("input[placeholder='Email']")
      .filter(":visible")
      .first()
      .then(($input) => {
        expect($input[0].checkValidity()).to.be.false;
        expect($input[0].validationMessage).to.eq(
          "Please fill out this field.",
        );
      });
  });

  it("should show browser validation for empty email", () => {
    cy.visit("/login");
    cy.get("input[placeholder='Password']")
      .filter(":visible")
      .first()
      .type("Create123!");
    cy.get('button[type="submit"]').filter(":visible").first().click();
    cy.get("input[placeholder='Email']")
      .filter(":visible")
      .first()
      .then(($input) => {
        expect($input[0].checkValidity()).to.be.false;
        expect($input[0].validationMessage).to.eq(
          "Please fill out this field.",
        );
      });
  });

  it("should show browser validation for empty password", () => {
    cy.visit("/login");
    cy.get("input[placeholder='Email']")
      .filter(":visible")
      .first()
      .type("mackjmart@gmail.com");
    cy.get('button[type="submit"]').filter(":visible").first().click();
    cy.get("input[placeholder='Password']")
      .filter(":visible")
      .first()
      .then(($input) => {
        expect($input[0].checkValidity()).to.be.false;
        expect($input[0].validationMessage).to.eq(
          "Please fill out this field.",
        );
      });
  });
});
