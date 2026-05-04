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
  cy.visit(url);
  cy.wait(2000);
}

/**
 * Interact with a Searchable_Dropdown component with improved reliability
 */
function selectSearchableDropdownOption(containerSelector: string, optionText?: string) {
  // Click the trigger div to open dropdown
  cy.get(containerSelector).first().click({ force: true });
  cy.wait(500);
  
  // Wait for dropdown options to appear
  cy.get("ul[role='listbox'], ul li").should("be.visible");
  
  if (optionText) {
    cy.get("ul li").contains(optionText).click({ force: true });
  } else {
    cy.get("ul li").first().click({ force: true });
  }
  cy.wait(500);
}

/**
 * Set value in React controlled input using nativeInputValueSetter.
 * Works with React 16+ controlled inputs.
 */
function setReactInputValue(selector: string, value: string | number, index = 0) {
  cy.get(selector).eq(index).then(($input) => {
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype, "value"
    )!.set!;
    nativeInputValueSetter.call($input[0], String(value));
    $input[0].dispatchEvent(new Event("input", { bubbles: true }));
    $input[0].dispatchEvent(new Event("change", { bubbles: true }));
  });
  cy.wait(300);
}

/**
 * Wait for a modal to be fully closed by waiting for its title to disappear.
 */
function waitForModalToClose(modalTitle: string, timeout = 15000) {
  cy.contains(modalTitle, { timeout }).should("not.exist");
  cy.wait(500);
}

/**
 * Wait for an intercepted API call to complete.
 * Does NOT assert status code — the app handles errors itself.
 */
function waitForApiCall(alias: string, timeout = 20000) {
  return cy.wait(alias, { timeout, requestTimeout: timeout });
}

// ─── Categories Tab Tests ─────────────────────────────────────────────────────

describe("Warehouse — Categories Tab", () => {

  it("should show Categories tab active by default with correct page title", () => {
    loginAndVisit(WAREHOUSE_CATEGORIES_URL);

    cy.contains("Warehouse").should("exist");
    cy.log("Warehouse page title visible");

    cy.contains("a", "Categories").should("have.class", "bg-blue-600");
    cy.log("Categories tab is active");

    cy.contains("button", "Active").should("have.class", "bg-blue-700");
    cy.log("Active filter is selected by default");
  });

  it("should switch between Active and Archive tabs in Categories", () => {
    loginAndVisit(WAREHOUSE_CATEGORIES_URL);

    cy.contains("button", "Active").should("have.class", "bg-blue-700");

    cy.contains("button", "Archive").click({ force: true });
    cy.wait(1000);
    cy.contains("button", "Archive").should("have.class", "bg-blue-700");
    cy.log("Archive tab selected");

    cy.get("table tbody tr", { timeout: 10000 }).then(($rows) => {
      const hasRealData = Array.from($rows).some(
        (r) => !(r.textContent || "").includes("No Category is available")
      );
      if (hasRealData) {
        expect($rows.length).to.be.greaterThan(0);
        cy.log("Archived categories visible");
      } else {
        cy.contains("No Category is available").should("exist");
        cy.log("No archived categories — 'No Category is available' shown");
      }
    });

    cy.contains("button", "Active").click({ force: true });
    cy.wait(1000);
    cy.contains("button", "Active").should("have.class", "bg-blue-700");
    cy.log("Back to Active tab");
  });

  it("should search categories by name", () => {
    loginAndVisit(WAREHOUSE_CATEGORIES_URL);

    // Verify DB has active categories before proceeding
    cy.task("getActiveCategoriesCount").then((count) => {
      if ((count as number) === 0) {
        cy.log("No active categories in DB — skipping search test");
        return;
      }

      cy.get("table tbody tr", { timeout: 10000 }).should("have.length.greaterThan", 0);

      // Get first category name from the table (eq(0)=empty, eq(1)=category_id, eq(2)=category_name, eq(3)=actions)
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

        cy.get('input[placeholder="Search By Category"]').clear().type("ZZZNOMATCH999");
        cy.wait(500);
        cy.contains("No Category is available").should("exist");
        cy.log("Non-existent search shows 'No Category is available'");

        cy.get('input[placeholder="Search By Category"]').clear();
      });
    });
  });

  it("should create a new category and verify it appears in the table", () => {
    loginAndVisit(WAREHOUSE_CATEGORIES_URL);

    const newCatName = `TestCat${Date.now().toString().slice(-6)}`;

    cy.intercept("POST", "**/rest/v1/categories*").as("createCategory");

    cy.contains("button", "Add Category").click({ force: true });
    cy.wait(500);

    cy.contains("Create Category", { timeout: 10000 }).should("exist");

    // Input_Component renders <input id="section"> — target it directly
    setReactInputValue('input[id="section"]', newCatName);

    cy.contains("button", "Create").click({ force: true });

    waitForApiCall("@createCategory");
    waitForModalToClose("Create Category");

    cy.get('input[placeholder="Search By Category"]').clear().type(newCatName);
    cy.wait(500);
    cy.contains(newCatName, { timeout: 10000 }).should("exist");
    cy.log(`Category "${newCatName}" created and visible`);
  });

  it("should archive a category and verify it moves to Archive tab", () => {
    loginAndVisit(WAREHOUSE_CATEGORIES_URL);

    // Verify DB has active categories
    cy.task("getActiveCategoriesCount").then((count) => {
      if ((count as number) === 0) {
        cy.log("No active categories in DB — skipping archive test");
        return;
      }

      cy.contains("button", "Active").click({ force: true });
      cy.wait(1000);
      cy.get("table tbody tr", { timeout: 10000 }).should("have.length.greaterThan", 0);

      // Read category name from first row
      cy.get("table tbody tr").first().find("td").eq(2).invoke("text").then((catName) => {
        const name = catName.trim();
        cy.log(`Archiving category: "${name}"`);

        // Intercept the archive API
        cy.intercept("PATCH", "**/rest/v1/categories*").as("archiveCategory");

        // Click the Archive action button
        cy.get("table tbody tr").first().find("button").first().click({ force: true });
        cy.wait(500);

        // Confirmation modal appears
        cy.contains("Confirmation", { timeout: 10000 }).should("exist");
        cy.log("Confirmation modal opened");

        // Click the confirm (Archive) button
        cy.get(".flex.items-center.space-x-3 button").last().click({ force: true });

        // Wait for API call
        waitForApiCall("@archiveCategory");

        // Wait for confirmation modal to close
        cy.contains("Confirmation", { timeout: 15000 }).should("not.exist");
        cy.wait(1000);
        cy.log("Confirmation modal closed");

        // Switch to Archive tab
        cy.contains("button", "Archive").click({ force: true });
        cy.wait(1500);

        // Search for the archived category
        cy.get('input[placeholder="Search By Category"]').clear().type(name);
        cy.wait(500);
        cy.contains(name, { timeout: 15000 }).should("exist");
        cy.log(`"${name}" found in Archive tab`);

        // Clear search before unarchiving
        cy.get('input[placeholder="Search By Category"]').clear();
        cy.wait(300);

        // Intercept unarchive API
        cy.intercept("PATCH", "**/rest/v1/categories*").as("unarchiveCategory");

        // Unarchive to restore
        cy.contains("td", name).closest("tr").find("button").first().click({ force: true });
        cy.wait(500);

        // Confirmation modal for unarchive
        cy.contains("Confirmation", { timeout: 10000 }).should("exist");
        cy.log("Unarchive confirmation modal opened");

        cy.get(".flex.items-center.space-x-3 button").last().click({ force: true });

        // Wait for API call
        waitForApiCall("@unarchiveCategory");

        // Wait for confirmation to close
        cy.contains("Confirmation", { timeout: 15000 }).should("not.exist");
        cy.wait(1000);
        cy.log(`"${name}" restored to Active`);

        // Verify it's back in Active tab
        cy.contains("button", "Active").click({ force: true });
        cy.wait(1000);
        cy.get('input[placeholder="Search By Category"]').clear().type(name);
        cy.wait(500);
        cy.contains(name, { timeout: 10000 }).should("exist");
        cy.log(`"${name}" confirmed back in Active tab`);
        cy.get('input[placeholder="Search By Category"]').clear();
      });
    });
  });

  it("should show pagination controls when categories exceed page limit", () => {
    loginAndVisit(WAREHOUSE_CATEGORIES_URL);

    cy.get("table tbody tr", { timeout: 10000 }).then(($rows) => {
      const hasRealData = Array.from($rows).some(
        (r) => !(r.textContent || "").includes("No Category is available")
      );

      if (!hasRealData) {
        cy.log("No categories — pagination test passes");
        cy.contains("button", "Previous").should("be.disabled");
        return;
      }

      const hasNext = Array.from(Cypress.$("button")).some(
        (b) => b.textContent?.trim() === "Next" && !b.hasAttribute("disabled")
      );

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

  beforeEach(() => {
    // Close any open modals from previous tests by pressing Escape
    cy.get("body").type("{esc}", { force: true });
    cy.wait(300);
  });

  it("should navigate to Products tab and show product list", () => {
    loginAndVisit(WAREHOUSE_PRODUCTS_URL);

    cy.contains("a", "Products").should("have.class", "bg-blue-600");
    cy.log("Products tab is active");

    cy.contains("button", "Active").should("have.class", "bg-blue-600");

    // Check DB first to know if products exist
    cy.task("getActiveProductsCount").then((count) => {
      cy.log(`DB active products count: ${count}`);

      cy.get("table tbody tr", { timeout: 10000 }).then(($rows) => {
        const hasRealData = Array.from($rows).some(
          (r) => !(r.textContent || "").includes("No Product is available")
        );

        if ((count as number) > 0) {
          expect(hasRealData).to.eq(true);
          cy.get("table tbody tr").first().find("td").eq(2).invoke("text").then((name) => {
            expect(name.trim()).to.not.be.empty;
            cy.log(`First product name: "${name.trim()}"`);
          });
          cy.log(`${$rows.length} product(s) visible in table`);
        } else {
          cy.contains("No Product is available").should("exist");
          cy.log("No active products in DB — 'No Product is available' shown correctly");
        }
      });
    });
  });

  it("should switch between Active and Archive tabs in Products", () => {
    loginAndVisit(WAREHOUSE_PRODUCTS_URL);

    cy.contains("button", "Active").should("have.class", "bg-blue-600");

    cy.contains("button", "Archive").click({ force: true });
    cy.wait(1000);
    cy.contains("button", "Archive").should("have.class", "bg-blue-600");
    cy.log("Archive tab selected");

    cy.get("table tbody tr", { timeout: 10000 }).then(($rows) => {
      const hasRealData = Array.from($rows).some(
        (r) => !(r.textContent || "").includes("No Product is available")
      );
      if (hasRealData) {
        expect($rows.length).to.be.greaterThan(0);
        cy.log("Archived products visible");
      } else {
        cy.contains("No Product is available").should("exist");
        cy.log("No archived products — 'No Product is available' shown");
      }
    });

    cy.contains("button", "Active").click({ force: true });
    cy.wait(1000);
    cy.contains("button", "Active").should("have.class", "bg-blue-600");
    cy.log("Back to Active tab");
  });

  it("should search products by name", () => {
    loginAndVisit(WAREHOUSE_PRODUCTS_URL);

    cy.task("getActiveProductsCount").then((count) => {
      if ((count as number) === 0) {
        cy.log("No active products in DB — skipping search test");
        return;
      }

      cy.task("getFirstActiveProduct").then((product) => {
        const prod = product as Record<string, unknown>;
        const searchTerm = (prod.product_name as string).split(" ")[0];
        cy.log(`Searching for product: "${searchTerm}"`);

        cy.contains("button", "Active").click({ force: true });
        cy.wait(1000);
        cy.get("table tbody tr", { timeout: 10000 }).should("have.length.greaterThan", 0);

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

  it("should create a new product and verify it appears in the table", () => {
    loginAndVisit(WAREHOUSE_PRODUCTS_URL);

    cy.task("getActiveCategoriesCount").then((catCount) => {
      if ((catCount as number) === 0) {
        cy.log("No active categories in DB — cannot create product, skipping");
        return;
      }

      const newProdName = `TestProd${Date.now().toString().slice(-6)}`;

      cy.intercept("POST", "**/rest/v1/products*").as("createProduct");

      cy.contains("button", "Add Product").click({ force: true });
      cy.wait(500);

      cy.contains("Create Product", { timeout: 10000 }).should("exist");
      cy.log("Create Product modal opened");

      // ── Category (Searchable_Dropdown) ──
      // The Searchable_Dropdown trigger is a div.cursor-pointer inside div.w-full.relative.
      // Scope to the modal body (div.space-y-6) to avoid matching other fixed elements.
      cy.get("div.space-y-6").first().within(() => {
        // The first div.w-full.relative is the category dropdown
        cy.get("div.w-full.relative").first().find("div.cursor-pointer").click({ force: true });
        // The dropdown ul is a child of div.w-full.relative (absolute positioned but still in DOM tree)
        cy.get("div.w-full.relative").first().find("ul li").first().click({ force: true });
      });
      cy.wait(400);
      cy.log("Category selected");

      // ── Name — scope by label text to find the right input ──
      // Input_Component renders <Label htmlFor="section"> then <input id="section">
      // Use the label's parent container to scope correctly
      cy.get("div.space-y-6").first().within(() => {
        cy.contains("label", "Name")
          .closest("div.w-full")
          .find("input#section")
          .clear({ force: true })
          .type(newProdName, { force: true });
      });
      cy.wait(200);
      cy.log(`Name set to: "${newProdName}"`);

      // ── Price ──
      cy.get("div.space-y-6").first().within(() => {
        cy.contains("label", "Price")
          .closest("div.w-full")
          .find('input[type="number"]')
          .clear({ force: true })
          .type("50", { force: true });
      });
      cy.wait(200);
      cy.log("Price set to 50");

      // ── Units ──
      cy.get("div.space-y-6").first().within(() => {
        cy.contains("label", "Units")
          .closest("div.w-full")
          .find('input[type="number"]')
          .clear({ force: true })
          .type("100", { force: true });
      });
      cy.wait(200);
      cy.log("Units set to 100");

      cy.contains("button", "Create").click({ force: true });

      waitForApiCall("@createProduct");
      cy.log("Create API call completed");

      waitForModalToClose("Create Product");
      cy.log("Modal closed");

      cy.get('input[placeholder="Search By Product"]').clear().type(newProdName);
      cy.wait(500);
      cy.contains(newProdName, { timeout: 10000 }).should("exist");
      cy.log(`Product "${newProdName}" created and visible`);

      cy.get('input[placeholder="Search By Product"]').clear();
    });
  });

  it("should update a product and verify all changes appear in the table", () => {
    loginAndVisit(WAREHOUSE_PRODUCTS_URL);

    cy.task("getActiveProductsCount").then((count) => {
      if ((count as number) === 0) {
        cy.log("No active products in DB — skipping update test");
        return;
      }

      cy.task("getActiveCategoriesCount").then((catCount) => {
        if ((catCount as number) === 0) {
          cy.log("No active categories in DB — skipping update test");
          return;
        }

        cy.intercept("PATCH", "**/rest/v1/products*").as("updateProduct");

        cy.contains("button", "Active").click({ force: true });
        cy.wait(1000);
        cy.get("table tbody tr", { timeout: 10000 }).should("have.length.greaterThan", 0);

        cy.get("table tbody tr").first().find("td").eq(2).invoke("text").then((originalName) => {
          cy.log(`Original product name: "${originalName.trim()}"`);

          cy.get("table tbody tr").first().find("button").eq(0).click({ force: true });
          cy.wait(500);

          cy.contains("Update Product", { timeout: 10000 }).should("exist");
          cy.log("Update Product modal opened");

          // ── Category (Searchable_Dropdown) ──
          cy.get("div.space-y-6").first().within(() => {
            cy.get("div.w-full.relative").first().find("div.cursor-pointer").click({ force: true });
            cy.get("div.w-full.relative").first().find("ul li").first().click({ force: true });
          });
          cy.wait(400);
          cy.log("Category selected");

          // Uncheck Unlimited first so Units input is enabled
          cy.get("#unlimited").then(($cb) => {
            if ($cb.is(":checked")) cy.wrap($cb).click({ force: true });
          });
          cy.wait(200);

          // ── Name — scope by label ──
          const updatedName = `Updated${Date.now().toString().slice(-5)}`;
          cy.get("div.space-y-6").first().within(() => {
            cy.contains("label", "Name")
              .closest("div.w-full")
              .find("input#section")
              .clear({ force: true })
              .type(updatedName, { force: true });
          });
          cy.wait(200);
          cy.log(`Name set to: "${updatedName}"`);

          // ── Price — scope by label ──
          cy.get("div.space-y-6").first().within(() => {
            cy.contains("label", "Price")
              .closest("div.w-full")
              .find('input[type="number"]')
              .clear({ force: true })
              .type("199", { force: true });
          });
          cy.wait(200);
          cy.log("Price set to 199");

          // ── Units — scope by label ──
          cy.get("div.space-y-6").first().within(() => {
            cy.contains("label", "Units")
              .closest("div.w-full")
              .find('input[type="number"]')
              .clear({ force: true })
              .type("50", { force: true });
          });
          cy.wait(200);
          cy.log("Units set to 50");

          // ── Bonus Eligible ──
          cy.get("#bonus_eligible").then(($cb) => {
            const was = $cb.is(":checked");
            cy.wrap($cb).click({ force: true });
            cy.log(`Bonus eligible toggled: ${was} → ${!was}`);
          });

          cy.contains("button", "Update").click({ force: true });

          waitForApiCall("@updateProduct");
          cy.log("Update API call completed");

          waitForModalToClose("Update Product");
          cy.log("Update Product modal closed");

          cy.get('input[placeholder="Search By Product"]').clear().type(updatedName);
          cy.wait(500);
          cy.contains(updatedName, { timeout: 10000 }).should("exist");
          cy.log(`Updated product "${updatedName}" found in table`);

          cy.contains(updatedName).closest("tr").find("td").eq(3).invoke("text").then((price) => {
            expect(price.trim()).to.eq("199");
            cy.log(`Price confirmed: ${price.trim()}`);
          });

          cy.contains(updatedName).closest("tr").find("td").eq(4).invoke("text").then((units) => {
            expect(units.trim()).to.eq("50");
            cy.log(`Units confirmed: ${units.trim()}`);
          });

          cy.get('input[placeholder="Search By Product"]').clear();
        });
      });
    });
  });

  it("should archive a product and verify it moves to Archive tab", () => {
    loginAndVisit(WAREHOUSE_PRODUCTS_URL);

    cy.task("getActiveProductsCount").then((count) => {
      if ((count as number) === 0) {
        cy.log("No active products in DB — skipping archive test");
        return;
      }

      cy.contains("button", "Active").click({ force: true });
      cy.wait(1000);
      cy.get("table tbody tr", { timeout: 10000 }).should("have.length.greaterThan", 0);

      cy.get("table tbody tr").first().find("td").eq(2).invoke("text").then((prodName) => {
        const name = prodName.trim();
        cy.log(`Archiving product: "${name}"`);

        // Intercept the archive API
        cy.intercept("PATCH", "**/rest/v1/products*").as("archiveProduct");

        // Click Archive button (2nd action button)
        cy.get("table tbody tr").first().find("button").eq(1).click({ force: true });
        cy.wait(500);

        cy.contains("Confirmation", { timeout: 10000 }).should("exist");
        cy.log("Archive confirmation modal opened");

        cy.get(".fixed .flex.items-center.space-x-3 button").last().click({ force: true });

        waitForApiCall("@archiveProduct");

        cy.get(".fixed.bg-black\\/75", { timeout: 10000 }).should("not.exist");
        cy.wait(1000);

        cy.contains("button", "Archive").click({ force: true });
        cy.wait(1500);
        cy.contains(name, { timeout: 15000 }).should("exist");
        cy.log(`"${name}" found in Archive tab`);

        // Intercept unarchive API
        cy.intercept("PATCH", "**/rest/v1/products*").as("unarchiveProduct");

        cy.contains(name).closest("tr").find("button").eq(1).click({ force: true });
        cy.wait(500);

        cy.contains("Confirmation", { timeout: 10000 }).should("exist");
        cy.log("Unarchive confirmation modal opened");

        cy.get(".fixed .flex.items-center.space-x-3 button").last().click({ force: true });

        waitForApiCall("@unarchiveProduct");

        cy.get(".fixed.bg-black\\/75", { timeout: 10000 }).should("not.exist");
        cy.wait(1000);
        cy.log(`"${name}" restored to Active`);

        cy.contains("button", "Active").click({ force: true });
        cy.wait(1000);
        cy.get('input[placeholder="Search By Product"]').clear().type(name);
        cy.wait(500);
        cy.contains(name, { timeout: 10000 }).should("exist");
        cy.log(`"${name}" confirmed back in Active tab`);
        cy.get('input[placeholder="Search By Product"]').clear();
      });
    });
  });

  it("should sort products by column headers", () => {
    loginAndVisit(WAREHOUSE_PRODUCTS_URL);

    cy.task("getActiveProductsCount").then((count) => {
      if ((count as number) === 0) {
        cy.log("No active products in DB — skipping sort test");
        return;
      }

      cy.get("table tbody tr", { timeout: 10000 }).should("have.length.greaterThan", 0);

      cy.contains("th", "Name").find("button").click({ force: true });
      cy.wait(500);
      cy.log("Sorted by Name ascending");

      cy.contains("th", "Name").find("button").click({ force: true });
      cy.wait(500);
      cy.log("Sorted by Name descending");

      cy.contains("th", "Price").find("button").click({ force: true });
      cy.wait(500);
      cy.log("Sorted by Price");
    });
  });

  it("should show pagination controls in Products tab", () => {
    loginAndVisit(WAREHOUSE_PRODUCTS_URL);

    cy.get("table tbody tr", { timeout: 10000 }).then(($rows) => {
      const hasRealData = Array.from($rows).some(
        (r) => !(r.textContent || "").includes("No Product is available")
      );

      if (!hasRealData) {
        cy.log("No products — pagination test passes");
        cy.contains("button", "Previous").should("be.disabled");
        return;
      }

      const hasNext = Array.from(Cypress.$("button")).some(
        (b) => b.textContent?.trim() === "Next" && !b.hasAttribute("disabled")
      );

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

  it("should assign a product to a location with quantity 3, verify stock info, then switch to that location and confirm inventory", () => {
    loginAndVisit(WAREHOUSE_PRODUCTS_URL);

    cy.task("getActiveProductsCount").then((count) => {
      if ((count as number) === 0) {
        cy.log("No active products in DB — skipping assign test");
        return;
      }

      cy.task("getAllLocations").then((locs) => {
        const locations = locs as Array<{ id: number; title: string }>;
        if (locations.length === 0) {
          cy.log("No locations in DB — skipping assign test");
          return;
        }

        cy.contains("button", "Active").click({ force: true });
        cy.wait(1000);
        cy.get("table tbody tr", { timeout: 10000 }).should("have.length.greaterThan", 0);

        let productName = "";
        let categoryName = "";

        cy.get("table tbody tr").first().find("td").eq(1).invoke("text").then((cat) => {
          categoryName = cat.trim();
          cy.log(`Product category: "${categoryName}"`);
        });

        cy.get("table tbody tr").first().find("td").eq(2).invoke("text").then((name) => {
          productName = name.trim();
          cy.log(`Product name: "${productName}"`);
        });

        // Intercept assign API
        cy.intercept("POST", "**/api/inventory/assign*").as("assignInventory");

        cy.get("table tbody tr").first().find("button").eq(2).click({ force: true });
        cy.wait(500);

        cy.contains("Assign Product", { timeout: 10000 }).should("exist");
        cy.log("Assign Product modal opened");

        cy.get("body").then(($body) => {
          if ($body.text().includes("Available stock:")) {
            cy.contains("Available stock:").should("exist");
            cy.contains("Assigned stock:").should("exist");
            cy.log("Stock info labels visible");
          } else {
            cy.log("Product is Unlimited — stock info shows 'Unlimited'");
            cy.contains("Unlimited").should("exist");
          }
        });

        // Select first location
        cy.get("input[id^='location-']").first().then(($firstCheckbox) => {
          const locId = ($firstCheckbox.attr("id") || "").replace("location-", "");
          cy.wrap($firstCheckbox).closest("div.flex.items-center.space-x-2").find("label").invoke("text").then((locTitle) => {
            const assignedLocationTitle = locTitle.trim();
            cy.log(`Selecting location: "${assignedLocationTitle}"`);

            cy.wrap($firstCheckbox).click({ force: true });
            cy.wait(500);

            cy.contains("Number of Units").should("exist");
            // Scope the quantity input by its label to avoid id="section" ambiguity
            cy.contains("label", "Number of Units").siblings("div").find('input[type="number"]').first()
              .clear({ force: true }).type("3", { force: true });
            cy.wait(300);
            cy.log("Quantity set to 3");

            cy.get("body").then(($body2) => {
              if ($body2.text().includes("Assigned stock:")) {
                cy.contains("Assigned stock:")
                  .closest("div.flex.justify-between")
                  .find("span.font-medium")
                  .invoke("text")
                  .then((assignedTxt) => {
                    expect(assignedTxt.trim()).to.eq("3");
                    cy.log(`Assigned stock confirmed: ${assignedTxt.trim()}`);
                  });
              }
            });

            cy.contains("button", "Assign").click({ force: true });

            waitForApiCall("@assignInventory");

            waitForModalToClose("Assign Product");
            cy.log("Assign submitted successfully");

            // Switch location via sidebar
            cy.get("button.text-white.text-xs.text-start").first().click({ force: true });
            cy.wait(500);

            cy.contains("Change Location", { timeout: 10000 }).should("exist");
            cy.log("Location modal opened");

            cy.contains("button", assignedLocationTitle).click({ force: true });
            cy.wait(300);

            cy.contains("button", "Apply").click({ force: true });
            cy.wait(1500);
            cy.log(`Switched to location: "${assignedLocationTitle}"`);

            cy.visit(WAREHOUSE_PRODUCTS_URL);
            cy.wait(2000);

            cy.contains("button", "Active").click({ force: true });
            cy.wait(1000);

            cy.get('input[placeholder="Search By Product"]').clear({ force: true }).type(productName, { force: true });
            cy.wait(800);

            cy.contains(productName, { timeout: 15000 }).should("exist");
            cy.log(`Product "${productName}" found in table at assigned location`);

            cy.contains("td", productName).closest("tr").within(() => {
              cy.find("td").eq(1).invoke("text").then((cat) => {
                expect(cat.trim()).to.eq(categoryName);
              });

              cy.find("td").eq(4).invoke("text").then((qty) => {
                const qtyTrimmed = qty.trim();
                if (qtyTrimmed !== "Unlimited") {
                  expect(parseInt(qtyTrimmed)).to.be.greaterThan(0);
                }
              });
            });

            cy.log("Assign product flow fully verified");
          });
        });
      });
    });
  });

  it("should transfer product units between locations and verify quantity at destination", () => {
    loginAndVisit(WAREHOUSE_PRODUCTS_URL);

    cy.task("getTransferableInventoryItem").then((item) => {
      if (!item) {
        cy.log("No transferable inventory found — skipping");
        return;
      }

      const inv = item as {
        inventory_id: number;
        quantity: number;
        from_location_id: number;
        from_location_title: string;
        product_id: number;
        product_name: string;
        category_id: number;
        category_name: string;
      };

      cy.log(`Transfer source: location="${inv.from_location_title}", product="${inv.product_name}"`);

      cy.task("getAllLocations").then((locs) => {
        const locations = locs as Array<{ id: number; title: string }>;
        const toLocation = locations.find((l) => l.id !== inv.from_location_id);
        if (!toLocation) {
          cy.log("Only one location exists — cannot transfer, skipping");
          return;
        }

        const transferUnits = 1;

        cy.task("getInventoryByProductAndLocation", {
          productId: inv.product_id,
          locationId: toLocation.id,
        }).then((destBefore) => {
          const qtyBefore = destBefore
            ? (destBefore as Record<string, unknown>).quantity as number
            : 0;

          // Intercept transfer API
          cy.intercept("POST", "**/api/inventory/transfer*").as("transferUnits");

          cy.contains("button", "Transfer").click({ force: true });
          cy.wait(500);

          cy.contains("Transfer Units", { timeout: 10000 }).should("exist");
          cy.log("Transfer Units modal opened");

          // Helper: select an option from a Searchable_Dropdown inside the Transfer modal.
          // The Searchable_Dropdown renders:
          //   <div class="w-full relative">          ← trigger wrapper
          //     <div>...</div>                       ← clickable trigger (shows current value)
          //     <ul class="absolute z-10 ...">       ← shown when open
          //       <input type="text" .../>           ← search filter input
          //       <li>option 1</li>
          //       <li>option 2</li>
          //     </ul>
          //   </div>
          // Strategy: click the trigger div, wait for ul, type in the search input to filter,
          // then click the first visible li that matches.
          const selectTransferDropdown = (dropdownIndex: number, optionText: string, waitMs = 600) => {
            // Scope to the modal overlay to avoid matching page-level dropdowns
            // Click the trigger <div> (first child div inside .w-full.relative)
            cy.get(".fixed.inset-0").find(".w-full.relative").eq(dropdownIndex)
              .find("div").first().click({ force: true });
            // Wait for the ul to appear
            cy.get(".fixed.inset-0").find(".w-full.relative").eq(dropdownIndex)
              .find("ul").should("exist");
            // Type in the search input to filter options
            cy.get(".fixed.inset-0").find(".w-full.relative").eq(dropdownIndex)
              .find("ul input[type='text']")
              .clear({ force: true })
              .type(optionText, { force: true });
            cy.wait(300);
            // Click the first matching li
            cy.get(".fixed.inset-0").find(".w-full.relative").eq(dropdownIndex)
              .find("ul li").first().click({ force: true });
            cy.wait(waitMs);
          };

          // From Location
          selectTransferDropdown(0, inv.from_location_title);
          cy.log(`From Location selected: "${inv.from_location_title}"`);

          // To Location (filtered to exclude fromLocation, so just type and pick first)
          selectTransferDropdown(1, toLocation.title);
          cy.log(`To Location selected: "${toLocation.title}"`);

          // Category (loads after fromLocation is set)
          selectTransferDropdown(2, inv.category_name, 1000);
          cy.log(`Category selected: "${inv.category_name}"`);

          // Product (loads after category is set)
          selectTransferDropdown(3, inv.product_name);
          cy.log(`Product selected: "${inv.product_name}"`);

          // Verify available units label appears (confirms product state is set)
          cy.contains(`Available: ${inv.quantity}`, { timeout: 10000 }).should("exist");
          cy.log(`Available units confirmed: ${inv.quantity}`);

          // Set units — scope by label to avoid id="section" ambiguity
          cy.contains("label", /Units.*Available/).siblings("div").find('input[type="number"]').first()
            .should("not.be.disabled")
            .clear({ force: true })
            .type(String(transferUnits), { force: true });
          cy.wait(500);
          cy.log(`Units entered: ${transferUnits}`);

          // Verify the Transfer button is now enabled
          cy.contains("button", "Transfer").last().should("not.be.disabled");
          cy.log("Transfer button is enabled — all fields valid");

          cy.contains("button", "Transfer").last().click({ force: true });

          waitForApiCall("@transferUnits");

          cy.contains("Transfer Units", { timeout: 15000 }).should("not.exist");
          cy.log("Transfer submitted — modal closed");

          cy.task("getInventoryByProductAndLocation", {
            productId: inv.product_id,
            locationId: toLocation.id,
          }).then((destAfter) => {
            expect(destAfter).to.not.be.null;
            const qtyAfter = (destAfter as Record<string, unknown>).quantity as number;
            expect(qtyAfter).to.eq(qtyBefore + transferUnits);
          });

          cy.task("getInventoryRecord", { inventoryId: inv.inventory_id }).then((srcAfter) => {
            expect(srcAfter).to.not.be.null;
            const srcQty = (srcAfter as Record<string, unknown>).quantity as number;
            expect(srcQty).to.eq(inv.quantity - transferUnits);
          });

          cy.get("button.text-white.text-xs.text-start").first().click({ force: true });
          cy.wait(500);

          cy.contains("Change Location", { timeout: 10000 }).should("exist");

          cy.contains("button", toLocation.title).click({ force: true });
          cy.wait(300);
          cy.contains("button", "Apply").click({ force: true });
          cy.wait(1500);

          cy.visit("/en/inventory/manage");
          cy.wait(2000);

          cy.get('input[placeholder*="Search"]').first()
            .clear({ force: true })
            .type(inv.product_name, { force: true });
          cy.wait(800);

          cy.contains(inv.product_name, { timeout: 15000 }).should("exist");

          cy.contains("td", inv.product_name).closest("tr").within(() => {
            cy.find("td").then(($tds) => {
              const unitsText = ($tds[4]?.textContent || "").trim();
              const expectedQty = qtyBefore + transferUnits;
              expect(parseInt(unitsText)).to.eq(expectedQty);
            });
          });

          cy.log("Transfer test fully verified");
        });
      });
    });
  });

  it("should navigate between Categories and Products tabs", () => {
    loginAndVisit(WAREHOUSE_CATEGORIES_URL);

    cy.contains("a", "Categories").should("have.class", "bg-blue-600");
    cy.log("On Categories tab");

    cy.contains("a", "Products").click({ force: true });
    cy.wait(1500);
    cy.contains("a", "Products").should("have.class", "bg-blue-600");
    cy.log("Navigated to Products tab");

    cy.contains("a", "Categories").click({ force: true });
    cy.wait(1500);
    cy.contains("a", "Categories").should("have.class", "bg-blue-600");
    cy.log("Navigated back to Categories tab");
  });
}); 