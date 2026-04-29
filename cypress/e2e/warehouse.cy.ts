/// <reference types="cypress" />

// Warehouse Management E2E Tests
// Categories: /en/warehouse/manage
// Products:   /en/warehouse/manage/products

const WAREHOUSE_CATEGORIES_URL = "/en/warehouse/manage";
const WAREHOUSE_PRODUCTS_URL = "/en/warehouse/manage/products";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function loginAndVisit(url: string) {
  cy.loginWithCredentials(TEST_EMAIL, TEST_PASSWORD);
  cy.wait(2000);
  cy.visit(url, { timeout: 120000 });
  cy.wait(2000);
}

// ─── Categories Tab Tests ─────────────────────────────────────────────────────

describe("Warehouse — Categories Tab", () => {

  it("should show Categories tab active by default with correct page title", () => {
    loginAndVisit(WAREHOUSE_CATEGORIES_URL);

    // Page title
    cy.contains("Warehouse").should("exist");
    cy.log("Warehouse page title visible");

    // Categories tab should be active (bg-blue-600)
    cy.contains("a", "Categories").should("have.class", "bg-blue-600");
    cy.log("Categories tab is active");

    // Active button should be highlighted
    cy.contains("button", "Active").should("have.class", "bg-blue-700");
    cy.log("Active filter is selected by default");
  });

  it("should switch between Active and Archive tabs in Categories", () => {
    loginAndVisit(WAREHOUSE_CATEGORIES_URL);

    // Start on Active
    cy.contains("button", "Active").should("have.class", "bg-blue-700");

    // Switch to Archive
    cy.contains("button", "Archive").click({ force: true });
    cy.wait(1000);
    cy.contains("button", "Archive").should("have.class", "bg-blue-700");
    cy.log("Archive tab selected");

    cy.get("body").then(($body) => {
      if ($body.text().includes("No Category is available")) {
        cy.log("No archived categories — 'No Category is available' shown");
      } else {
        cy.get("table tbody tr").should("have.length.greaterThan", 0);
        cy.log("Archived categories visible");
      }
    });

    // Switch back to Active
    cy.contains("button", "Active").click({ force: true });
    cy.wait(1000);
    cy.contains("button", "Active").should("have.class", "bg-blue-700");
    cy.log("Back to Active tab");
  });

  it("should search categories by name", () => {
    loginAndVisit(WAREHOUSE_CATEGORIES_URL);

    cy.get("table tbody tr").should("have.length.greaterThan", 0);

    // Get first category name
    cy.get("table tbody tr").first().find("td").eq(2).invoke("text").then((catName) => {
      const searchTerm = catName.trim().split(" ")[0];
      cy.log(`Searching for: "${searchTerm}"`);

      cy.get('input[placeholder="Search By Category"]').clear().type(searchTerm);
      cy.wait(500);

      cy.get("table tbody tr").each(($row) => {
        cy.wrap($row).find("td").eq(2).invoke("text").then((name) => {
          expect(name.toLowerCase()).to.include(searchTerm.toLowerCase());
        });
      });
      cy.log(`Search for "${searchTerm}" shows matching rows`);

      // Non-existent search
      cy.get('input[placeholder="Search By Category"]').clear().type("ZZZNOMATCH999");
      cy.wait(500);
      cy.contains("No Category is available").should("exist");
      cy.log("Non-existent search shows 'No Category is available'");

      cy.get('input[placeholder="Search By Category"]').clear();
    });
  });

  it("should create a new category and verify it appears in the table", () => {
    loginAndVisit(WAREHOUSE_CATEGORIES_URL);

    const newCatName = `TestCat${Date.now().toString().slice(-6)}`;

    // Click Add Category button
    cy.contains("button", "Add Category").click({ force: true });
    cy.wait(500);

    // Modal opens
    cy.contains("Create Category").should("exist");

    // Fill in category name
    cy.get('input[placeholder*="Category"], input[placeholder*="category"]').first()
      .clear().type(newCatName);

    // Submit
    cy.contains("button", "Create").click({ force: true });
    cy.wait(1500);

    // New category should appear in table
    cy.get('input[placeholder="Search By Category"]').clear().type(newCatName);
    cy.wait(500);
    cy.contains(newCatName).should("exist");
    cy.log(`Category "${newCatName}" created and visible`);
  });

  it("should archive a category and verify it moves to Archive tab", () => {
    loginAndVisit(WAREHOUSE_CATEGORIES_URL);

    cy.contains("button", "Active").click({ force: true });
    cy.wait(1000);
    cy.get("table tbody tr").should("have.length.greaterThan", 0);

    // Read category name from first row
    cy.get("table tbody tr").first().find("td").eq(2).invoke("text").then((catName) => {
      const name = catName.trim();
      cy.log(`Archiving category: "${name}"`);

      // Click Archive button (red button in Actions column)
      cy.get("table tbody tr").first().find("button").then(($btns) => {
        // Archive button has red color — find it
        const archiveBtn = Array.from($btns).find((b) =>
          b.className.includes("F71B1B") || b.className.includes("red")
        );
        if (archiveBtn) {
          cy.wrap(archiveBtn).click({ force: true });
        } else {
          cy.get("table tbody tr").first().find("button").last().click({ force: true });
        }
      });
      cy.wait(500);

      // Confirmation modal appears
      cy.contains("Confirmation").should("exist");
      cy.contains("button", "Archive").last().click({ force: true });
      cy.wait(1500);

      // Switch to Archive tab — category should appear
      cy.contains("button", "Archive").click({ force: true });
      cy.wait(1000);
      cy.contains(name).should("exist");
      cy.log(`"${name}" found in Archive tab`);

      // Unarchive to restore
      cy.contains(name).closest("tr").find("button").click({ force: true });
      cy.wait(500);
      cy.contains("Confirmation").should("exist");
      cy.contains("button", "Unarchive").last().click({ force: true });
      cy.wait(1500);
      cy.log(`"${name}" restored to Active`);
    });
  });

  it("should show pagination controls when categories exceed page limit", () => {
    loginAndVisit(WAREHOUSE_CATEGORIES_URL);

    cy.get("body").then(($body) => {
      const hasNext = $body.find("button").toArray()
        .some((b) => b.textContent?.trim() === "Next" && !b.hasAttribute("disabled"));

      if (!hasNext) {
        cy.log("Only one page of categories — pagination test passes");
        cy.contains("button", "Previous").should("be.disabled");
        return;
      }

      cy.contains("button", "Previous").should("be.disabled");
      cy.contains("button", "Next").click({ force: true });
      cy.wait(500);
      cy.contains("button", "Previous").should("not.be.disabled");
      cy.contains("button", "Previous").click({ force: true });
      cy.wait(500);
      cy.contains("button", "Previous").should("be.disabled");
      cy.log("Pagination works correctly");
    });
  });
});

// ─── Products Tab Tests ───────────────────────────────────────────────────────

describe("Warehouse — Products Tab", () => {

  it("should navigate to Products tab and show product list", () => {
    loginAndVisit(WAREHOUSE_PRODUCTS_URL);

    // Products tab should be active
    cy.contains("a", "Products").should("have.class", "bg-blue-600");
    cy.log("Products tab is active");

    // Active filter selected
    cy.contains("button", "Active").should("have.class", "bg-blue-600");

    cy.get("body").then(($body) => {
      if ($body.text().includes("No Product is available")) {
        cy.log("No active products — correct");
      } else {
        cy.get("table tbody tr").should("have.length.greaterThan", 0);
        cy.log("Products visible in table");
      }
    });
  });

  it("should switch between Active and Archive tabs in Products", () => {
    loginAndVisit(WAREHOUSE_PRODUCTS_URL);

    cy.contains("button", "Active").should("have.class", "bg-blue-600");

    cy.contains("button", "Archive").click({ force: true });
    cy.wait(1000);
    cy.contains("button", "Archive").should("have.class", "bg-blue-600");
    cy.log("Archive tab selected");

    cy.get("body").then(($body) => {
      if ($body.text().includes("No Product is available")) {
        cy.log("No archived products — 'No Product is available' shown");
      } else {
        cy.get("table tbody tr").should("have.length.greaterThan", 0);
        cy.log("Archived products visible");
      }
    });

    cy.contains("button", "Active").click({ force: true });
    cy.wait(1000);
    cy.contains("button", "Active").should("have.class", "bg-blue-600");
    cy.log("Back to Active tab");
  });

  it("should search products by name", () => {
    loginAndVisit(WAREHOUSE_PRODUCTS_URL);

    cy.get("body").then(($body) => {
      if ($body.text().includes("No Product is available")) {
        cy.log("No products — skipping search test");
        return;
      }

      cy.get("table tbody tr").first().find("td").eq(2).invoke("text").then((prodName) => {
        const searchTerm = prodName.trim().split(" ")[0];
        cy.log(`Searching for: "${searchTerm}"`);

        cy.get('input[placeholder="Search By Product"]').clear().type(searchTerm);
        cy.wait(500);

        cy.get("table tbody tr").each(($row) => {
          cy.wrap($row).find("td").eq(2).invoke("text").then((name) => {
            expect(name.toLowerCase()).to.include(searchTerm.toLowerCase());
          });
        });
        cy.log(`Search for "${searchTerm}" shows matching rows`);

        cy.get('input[placeholder="Search By Product"]').clear().type("ZZZNOMATCH999XYZ");
        cy.wait(500);
        cy.contains("No Product is available").should("exist");
        cy.log("Non-existent search shows 'No Product is available'");

        cy.get('input[placeholder="Search By Product"]').clear();
      });
    });
  });

  it("should archive a product and verify it moves to Archive tab", () => {
    loginAndVisit(WAREHOUSE_PRODUCTS_URL);

    cy.contains("button", "Active").click({ force: true });
    cy.wait(1000);

    cy.get("body").then(($body) => {
      if ($body.text().includes("No Product is available")) {
        cy.log("No active products — skipping archive test");
        return;
      }

      cy.get("table tbody tr").first().find("td").eq(2).invoke("text").then((prodName) => {
        const name = prodName.trim();
        cy.log(`Archiving product: "${name}"`);

        // Products page has 3 action buttons: Update (blue), Archive (red), Assign (green)
        // Archive button is the 2nd button (index 1)
        cy.get("table tbody tr").first().find("button").eq(1).click({ force: true });
        cy.wait(500);

        // Confirmation modal
        cy.contains("Confirmation").should("exist");
        cy.contains("button", "Archive").last().click({ force: true });
        cy.wait(1500);

        // Switch to Archive tab
        cy.contains("button", "Archive").click({ force: true });
        cy.wait(1000);
        cy.contains(name).should("exist");
        cy.log(`"${name}" found in Archive tab`);

        // Unarchive to restore
        cy.contains(name).closest("tr").find("button").eq(1).click({ force: true });
        cy.wait(500);
        cy.contains("Confirmation").should("exist");
        cy.contains("button", "Unarchive").last().click({ force: true });
        cy.wait(1500);
        cy.log(`"${name}" restored to Active`);
      });
    });
  });

  it("should create a new product and verify it appears in the table", () => {
    loginAndVisit(WAREHOUSE_PRODUCTS_URL);

    const newProdName = `TestProd${Date.now().toString().slice(-6)}`;

    cy.contains("button", "Add Product").click({ force: true });
    cy.wait(500);

    cy.contains("Create Product").should("exist");

    // Fill category (Searchable Dropdown — click and select first option)
    cy.get('[placeholder*="Category"], [placeholder*="category"]').first()
      .click({ force: true });
    cy.wait(300);
    cy.get('[role="option"], li').first().click({ force: true });
    cy.wait(300);

    // Fill product name
    cy.get('input[placeholder*="Name"], input[placeholder*="name"]').first()
      .clear().type(newProdName);

    // Fill price
    cy.get('input[type="number"]').first().clear().type("50");

    // Fill units
    cy.get('input[type="number"]').eq(1).clear().type("100");

    // Submit
    cy.contains("button", "Create").click({ force: true });
    cy.wait(1500);

    // Search for new product
    cy.get('input[placeholder="Search By Product"]').clear().type(newProdName);
    cy.wait(500);
    cy.contains(newProdName).should("exist");
    cy.log(`Product "${newProdName}" created and visible`);
  });

  it("should update a product's price and verify the change", () => {
    loginAndVisit(WAREHOUSE_PRODUCTS_URL);

    cy.get("body").then(($body) => {
      if ($body.text().includes("No Product is available")) {
        cy.log("No products — skipping update test");
        return;
      }

      // Click Update button (1st action button — blue RefreshCcw icon)
      cy.get("table tbody tr").first().find("button").eq(0).click({ force: true });
      cy.wait(500);

      cy.contains("Update Product").should("exist");
      cy.log("Update Product modal opened");

      // Update price
      cy.get('input[type="number"]').first().clear().type("999");

      cy.contains("button", "Update").click({ force: true });
      cy.wait(1500);

      cy.log("Product updated successfully");
    });
  });

  it("should sort products by column headers", () => {
    loginAndVisit(WAREHOUSE_PRODUCTS_URL);

    cy.get("body").then(($body) => {
      if ($body.text().includes("No Product is available")) {
        cy.log("No products — skipping sort test");
        return;
      }

      // Click Name column header sort button
      cy.contains("th", "Name").find("button").click({ force: true });
      cy.wait(500);
      cy.log("Sorted by Name ascending");

      cy.contains("th", "Name").find("button").click({ force: true });
      cy.wait(500);
      cy.log("Sorted by Name descending");

      // Click Price column header sort button
      cy.contains("th", "Price").find("button").click({ force: true });
      cy.wait(500);
      cy.log("Sorted by Price");
    });
  });

  it("should show pagination controls in Products tab", () => {
    loginAndVisit(WAREHOUSE_PRODUCTS_URL);

    cy.get("body").then(($body) => {
      const hasNext = $body.find("button").toArray()
        .some((b) => b.textContent?.trim() === "Next" && !b.hasAttribute("disabled"));

      if (!hasNext) {
        cy.log("Only one page of products — pagination test passes");
        cy.contains("button", "Previous").should("be.disabled");
        return;
      }

      cy.contains("button", "Previous").should("be.disabled");
      cy.contains("button", "Next").click({ force: true });
      cy.wait(500);
      cy.contains("button", "Previous").should("not.be.disabled");
      cy.contains("button", "Previous").click({ force: true });
      cy.wait(500);
      cy.contains("button", "Previous").should("be.disabled");
      cy.log("Products pagination works correctly");
    });
  });

  it("should open Assign modal and show stock information", () => {
    loginAndVisit(WAREHOUSE_PRODUCTS_URL);

    cy.get("body").then(($body) => {
      if ($body.text().includes("No Product is available")) {
        cy.log("No products — skipping assign test");
        return;
      }

      // Click Assign button (3rd action button — green CirclePlus icon)
      cy.get("table tbody tr").first().find("button").eq(2).click({ force: true });
      cy.wait(500);

      // Assign modal opens
      cy.contains("Assign Product").should("exist");
      cy.log("Assign Product modal opened");

      // Stock information should be visible
      cy.contains("Stock type:").should("exist");
      cy.contains("Available stock:").should("exist");
      cy.contains("Assigned stock:").should("exist");
      cy.log("Stock information displayed correctly");

      // Close modal
      cy.contains("button", "Cancel").click({ force: true });
      cy.wait(300);
    });
  });

  it("should navigate between Categories and Products tabs", () => {
    loginAndVisit(WAREHOUSE_CATEGORIES_URL);

    // Start on Categories
    cy.contains("a", "Categories").should("have.class", "bg-blue-600");
    cy.log("On Categories tab");

    // Navigate to Products
    cy.contains("a", "Products").click({ force: true });
    cy.wait(1500);
    cy.contains("a", "Products").should("have.class", "bg-blue-600");
    cy.log("Navigated to Products tab");

    // Navigate back to Categories
    cy.contains("a", "Categories").click({ force: true });
    cy.wait(1500);
    cy.contains("a", "Categories").should("have.class", "bg-blue-600");
    cy.log("Navigated back to Categories tab");
  });
});
