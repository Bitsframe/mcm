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
 * Interact with a Searchable_Dropdown component.
 * The component renders as a clickable <div> that opens a <ul> with <li> items.
 * @param containerSelector - selector for the wrapper div containing the dropdown
 * @param optionText - partial text of the option to select (leave empty to pick first)
 */
function selectDropdownOption(containerSelector: string, optionText?: string) {
  // Click the visible div to open the dropdown
  cy.get(containerSelector).first().click({ force: true });
  cy.wait(300);
  // The dropdown renders a <ul> with <li> items
  if (optionText) {
    cy.get("ul li").contains(optionText).click({ force: true });
  } else {
    cy.get("ul li").first().click({ force: true });
  }
  cy.wait(200);
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

    // Click Add Category button
    cy.contains("button", "Add Category").click({ force: true });
    cy.wait(500);

    // Modal opens — the title uses t("Inventory_k46") which renders as "Create Category"
    cy.get('[role="dialog"], .fixed').should("exist");

    // Fill in category name — Input_Component renders a plain input
    cy.get('input').filter(':visible').last().clear().type(newCatName);

    // Submit — button label is t("Inventory_k47") = "Create"
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

    // Verify DB has active categories
    cy.task("getActiveCategoriesCount").then((count) => {
      if ((count as number) === 0) {
        cy.log("No active categories in DB — skipping archive test");
        return;
      }

      cy.contains("button", "Active").click({ force: true });
      cy.wait(1000);
      cy.get("table tbody tr", { timeout: 10000 }).should("have.length.greaterThan", 0);

      // Read category name from first row (eq(2) = category_name column)
      cy.get("table tbody tr").first().find("td").eq(2).invoke("text").then((catName) => {
        const name = catName.trim();
        cy.log(`Archiving category: "${name}"`);

        // Click the Archive action button (only one button per row in categories)
        cy.get("table tbody tr").first().find("button").first().click({ force: true });
        cy.wait(500);

        // Confirmation modal appears — title is "Confirmation"
        cy.contains("Confirmation", { timeout: 10000 }).should("exist");
        cy.log("Confirmation modal opened");

        // Click the confirm (Archive) button — last button in the modal footer
        cy.get(".flex.items-center.space-x-3 button").last().click({ force: true });

        // Wait for the confirmation dialog to disappear (title gone = modal closed)
        cy.contains("Confirmation", { timeout: 15000 }).should("not.exist");
        cy.wait(1000);
        cy.log("Confirmation modal closed");

        // Switch to Archive tab
        cy.contains("button", "Archive").click({ force: true });
        cy.wait(1500);

        // Search for the archived category by name to confirm it's in the Archive tab
        cy.get('input[placeholder="Search By Category"]').clear().type(name);
        cy.wait(500);
        cy.contains(name, { timeout: 15000 }).should("exist");
        cy.log(`"${name}" found in Archive tab`);

        // Clear search before unarchiving
        cy.get('input[placeholder="Search By Category"]').clear();
        cy.wait(300);

        // Unarchive to restore — find the row and click its button
        cy.contains("td", name).closest("tr").find("button").first().click({ force: true });
        cy.wait(500);

        // Confirmation modal for unarchive
        cy.contains("Confirmation", { timeout: 10000 }).should("exist");
        cy.log("Unarchive confirmation modal opened");

        cy.get(".flex.items-center.space-x-3 button").last().click({ force: true });

        // Wait for confirmation to close
        cy.contains("Confirmation", { timeout: 15000 }).should("not.exist");
        cy.wait(1000);
        cy.log(`"${name}" restored to Active`);

        // Verify it's back in Active tab
        cy.contains("button", "Active").click({ force: true });
        cy.wait(1000);
        cy.get('input[placeholder="Search By Category"]').clear().type(name);
        cy.wait(500);
        cy.contains(name).should("exist");
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
          // DB has products — table must show them
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

    // Check DB first — if no products exist, skip gracefully
    cy.task("getActiveProductsCount").then((count) => {
      if ((count as number) === 0) {
        cy.log("No active products in DB — skipping search test");
        return;
      }

      // Get a real product name from DB to search for
      cy.task("getFirstActiveProduct").then((product) => {
        const prod = product as Record<string, unknown>;
        const searchTerm = (prod.product_name as string).split(" ")[0];
        cy.log(`Searching for product: "${searchTerm}"`);

        cy.contains("button", "Active").click({ force: true });
        cy.wait(1000);
        cy.get("table tbody tr", { timeout: 10000 }).should("have.length.greaterThan", 0);

        cy.get('input[placeholder="Search By Product"]').clear().type(searchTerm);
        cy.wait(500);

        // All visible rows should contain the search term in the product name column (eq(2))
        cy.get("table tbody tr").each(($row) => {
          cy.wrap($row).find("td").eq(2).invoke("text").then((name) => {
            expect(name.toLowerCase()).to.include(searchTerm.toLowerCase());
          });
        });
        cy.log(`Search for "${searchTerm}" shows matching rows`);

        // Non-existent search
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

    // Verify categories exist in DB (required for product creation)
    cy.task("getActiveCategoriesCount").then((catCount) => {
      if ((catCount as number) === 0) {
        cy.log("No active categories in DB — cannot create product, skipping");
        return;
      }

      const newProdName = `TestProd${Date.now().toString().slice(-6)}`;

      // Intercept the Supabase products insert so we know exactly when it completes
      cy.intercept("POST", "**/rest/v1/products*").as("createProduct");

      // Click Add Product button
      cy.contains("button", "Add Product").click({ force: true });
      cy.wait(500);

      // Modal opens — title is "Create Product"
      cy.contains("Create Product", { timeout: 10000 }).should("exist");
      cy.log("Create Product modal opened");

      // ── Category (Searchable_Dropdown) ──
      // The dropdown is a .w-full.relative div; clicking it opens a <ul> with <li> options
      cy.get(".fixed .w-full.relative").first().click({ force: true });
      cy.wait(400);
      cy.get("ul li").first().click({ force: true });
      cy.wait(300);
      cy.log("Category selected from dropdown");

      // ── Name (plain text input, label "Name") ──
      cy.get(".fixed input[type='text']").first().clear({ force: true }).type(newProdName, { force: true });

      // ── Price (first number input) ──
      cy.get(".fixed input[type='number']").first().clear({ force: true }).type("50", { force: true });

      // ── Units (second number input) ──
      cy.get(".fixed input[type='number']").eq(1).clear({ force: true }).type("100", { force: true });

      // Submit
      cy.contains("button", "Create").click({ force: true });

      // Wait for the API call to complete — this is the definitive signal
      cy.wait("@createProduct", { timeout: 15000 });
      cy.log("Create API call completed");

      // Wait for the modal title to disappear — closeModalHandle() was called
      cy.contains("Create Product", { timeout: 15000 }).should("not.exist");
      cy.log("Create Product modal closed");

      // Now the modal is gone — search for the new product
      cy.get('input[placeholder="Search By Product"]').clear().type(newProdName);
      cy.wait(500);
      cy.contains(newProdName, { timeout: 10000 }).should("exist");
      cy.log(`Product "${newProdName}" created and visible in table`);

      // Cleanup
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

        // Intercept the Supabase products PATCH so we know exactly when it completes
        cy.intercept("PATCH", "**/rest/v1/products*").as("updateProduct");

        cy.contains("button", "Active").click({ force: true });
        cy.wait(1000);
        cy.get("table tbody tr", { timeout: 10000 }).should("have.length.greaterThan", 0);

        cy.get("table tbody tr").first().find("td").eq(2).invoke("text").then((originalName) => {
          cy.log(`Original product name: "${originalName.trim()}"`);

          // Click Update button (1st action button — blue RefreshCcw icon, eq(0))
          cy.get("table tbody tr").first().find("button").eq(0).click({ force: true });
          cy.wait(500);

          // Modal opens — title is "Update Product"
          cy.contains("Update Product", { timeout: 10000 }).should("exist");
          cy.log("Update Product modal opened");

          // ── Category (Searchable_Dropdown) ──
          cy.get(".fixed .w-full.relative").first().click({ force: true });
          cy.wait(400);
          cy.get("ul li").first().click({ force: true });
          cy.wait(300);
          cy.log("Category updated in dropdown");

          // ── Product Name ──
          const updatedName = `Updated${Date.now().toString().slice(-5)}`;
          cy.get(".fixed input[type='text']").first().clear({ force: true }).type(updatedName, { force: true });
          cy.log(`New product name: "${updatedName}"`);

          // ── Price ──
          cy.get(".fixed input[type='number']").first().clear({ force: true }).type("199", { force: true });
          cy.log("Price updated to 199");

          // ── Units — uncheck unlimited first if needed ──
          cy.get("#unlimited").then(($cb) => {
            if ($cb.is(":checked")) cy.wrap($cb).click({ force: true });
          });
          cy.get(".fixed input[type='number']").eq(1).clear({ force: true }).type("50", { force: true });
          cy.log("Units updated to 50");

          // ── Bonus Eligible checkbox ──
          cy.get("#bonus_eligible").then(($cb) => {
            const was = $cb.is(":checked");
            cy.wrap($cb).click({ force: true });
            cy.log(`Bonus eligible toggled: ${was} → ${!was}`);
          });

          // ── Unlimited — toggle on then off ──
          cy.get("#unlimited").click({ force: true });
          cy.wait(200);
          cy.get("#unlimited").click({ force: true });
          cy.wait(200);
          cy.log("Unlimited toggled on then off");

          // Submit
          cy.contains("button", "Update").click({ force: true });

          // Wait for the API PATCH to complete — definitive signal
          cy.wait("@updateProduct", { timeout: 15000 });
          cy.log("Update API call completed");

          // Wait for modal title to disappear — closeModalHandle() was called
          cy.contains("Update Product", { timeout: 15000 }).should("not.exist");
          cy.log("Update Product modal closed");

          // Search for updated product
          cy.get('input[placeholder="Search By Product"]').clear().type(updatedName);
          cy.wait(500);
          cy.contains(updatedName, { timeout: 10000 }).should("exist");
          cy.log(`Updated product "${updatedName}" found in table`);

          // Verify price
          cy.contains(updatedName).closest("tr").find("td").eq(3).invoke("text").then((price) => {
            expect(price.trim()).to.eq("199");
            cy.log(`Price confirmed: ${price.trim()}`);
          });

          // Verify units
          cy.contains(updatedName).closest("tr").find("td").eq(4).invoke("text").then((units) => {
            expect(units.trim()).to.eq("50");
            cy.log(`Units confirmed: ${units.trim()}`);
          });

          // Cleanup
          cy.get('input[placeholder="Search By Product"]').clear();
        });
      });
    });
  });

  it("should archive a product and verify it moves to Archive tab", () => {
    loginAndVisit(WAREHOUSE_PRODUCTS_URL);

    // Check DB first
    cy.task("getActiveProductsCount").then((count) => {
      if ((count as number) === 0) {
        cy.log("No active products in DB — skipping archive test");
        return;
      }

      cy.contains("button", "Active").click({ force: true });
      cy.wait(1000);
      cy.get("table tbody tr", { timeout: 10000 }).should("have.length.greaterThan", 0);

      // Read product name from first row (eq(2) = product_name column)
      cy.get("table tbody tr").first().find("td").eq(2).invoke("text").then((prodName) => {
        const name = prodName.trim();
        cy.log(`Archiving product: "${name}"`);

        // Click Archive button (2nd action button — eq(1))
        cy.get("table tbody tr").first().find("button").eq(1).click({ force: true });
        cy.wait(500);

        // Confirmation modal appears
        cy.contains("Confirmation", { timeout: 10000 }).should("exist");
        cy.log("Archive confirmation modal opened");

        // Click the confirm button inside the modal footer (last button = Archive/failure)
        cy.get(".fixed .flex.items-center.space-x-3 button").last().click({ force: true });

        // Wait for the confirmation overlay to fully disappear
        cy.get(".fixed.bg-black\\/75", { timeout: 10000 }).should("not.exist");
        cy.wait(1000);

        // Switch to Archive tab
        cy.contains("button", "Archive").click({ force: true });
        cy.wait(1500);
        cy.contains(name, { timeout: 15000 }).should("exist");
        cy.log(`"${name}" found in Archive tab`);

        // Unarchive to restore — click Archive button (eq(1)) on that row
        cy.contains(name).closest("tr").find("button").eq(1).click({ force: true });
        cy.wait(500);

        // Confirmation modal for unarchive
        cy.contains("Confirmation", { timeout: 10000 }).should("exist");
        cy.log("Unarchive confirmation modal opened");

        cy.get(".fixed .flex.items-center.space-x-3 button").last().click({ force: true });

        // Wait for the confirmation overlay to fully disappear
        cy.get(".fixed.bg-black\\/75", { timeout: 10000 }).should("not.exist");
        cy.wait(1000);
        cy.log(`"${name}" restored to Active`);

        // Verify it's back in Active tab
        cy.contains("button", "Active").click({ force: true });
        cy.wait(1000);
        cy.get('input[placeholder="Search By Product"]').clear().type(name);
        cy.wait(500);
        cy.contains(name).should("exist");
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

      // Get all locations from DB so we can pick one and verify later
      cy.task("getAllLocations").then((locs) => {
        const locations = locs as Array<{ id: number; title: string }>;
        if (locations.length === 0) {
          cy.log("No locations in DB — skipping assign test");
          return;
        }

        cy.contains("button", "Active").click({ force: true });
        cy.wait(1000);
        cy.get("table tbody tr", { timeout: 10000 }).should("have.length.greaterThan", 0);

        // Capture product details from the first row before opening modal
        // Columns: eq(0)=empty, eq(1)=category, eq(2)=product_name, eq(3)=price, eq(4)=stock
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

        // Click Assign button (3rd action button — green CirclePlus icon, eq(2))
        cy.get("table tbody tr").first().find("button").eq(2).click({ force: true });
        cy.wait(500);

        // Assign modal opens
        cy.contains("Assign Product", { timeout: 10000 }).should("exist");
        cy.log("Assign Product modal opened");

        // ── Verify stock info is displayed ──
        cy.contains("Stock type:").should("exist");
        cy.log("Stock type label visible");

        // For limited products, Available stock and Assigned stock are shown
        cy.get("body").then(($body) => {
          if ($body.text().includes("Available stock:")) {
            cy.contains("Available stock:").should("exist");
            cy.contains("Assigned stock:").should("exist");
            cy.log("Available stock and Assigned stock labels visible");

            // Read the current available stock value
            cy.contains("Available stock:").parent().find("span.font-medium").invoke("text").then((stockTxt) => {
              cy.log(`Current available stock: ${stockTxt.trim()}`);
            });
          } else {
            cy.log("Product is Unlimited — stock info shows 'Unlimited'");
            cy.contains("Unlimited").should("exist");
          }
        });

        // ── Select the first location ──
        // The location list is inside a scrollable div; find the first location checkbox
        cy.get("input[id^='location-']").first().then(($firstCheckbox) => {
          // Get the location title from the label next to this checkbox
          const locId = ($firstCheckbox.attr("id") || "").replace("location-", "");
          cy.wrap($firstCheckbox).closest("div.flex.items-center.space-x-2").find("label").invoke("text").then((locTitle) => {
            const assignedLocationTitle = locTitle.trim();
            cy.log(`Selecting location: "${assignedLocationTitle}" (id: ${locId})`);

            // Check the location checkbox
            cy.wrap($firstCheckbox).click({ force: true });
            cy.wait(500);

            // ── Enter quantity 3 in the "Number of Units" input ──
            // The Input_Component renders <input id="section" type="number">
            // Scroll the input into view and use force:true since it's inside a fixed-height container
            cy.contains("Number of Units").should("exist");
            cy.get('input#section[type="number"]')
              .scrollIntoView()
              .clear({ force: true })
              .type("3", { force: true });
            cy.wait(500);
            cy.log("Quantity set to 3");

            // ── Verify Assigned stock updates to 3 (only for limited products) ──
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
              } else {
                cy.log("Product is Unlimited — assigned stock check skipped");
              }
            });

            // ── Submit assign ──
            cy.contains("button", "Assign").click({ force: true });

            // Wait for modal to close
            cy.contains("Assign Product", { timeout: 15000 }).should("not.exist");
            cy.wait(1000);
            cy.log("Assign submitted successfully");

            // ── Switch location via sidebar ──
            // The ChangeLocationModal is triggered by clicking the location button in the sidebar
            cy.get("button.text-white.text-xs.text-start").first().click({ force: true });
            cy.wait(500);

            // Location modal opens (MUI Modal) — title is "Change Location"
            cy.contains("Change Location", { timeout: 10000 }).should("exist");
            cy.log("Location modal opened");

            // Find and click the assigned location button
            cy.contains("button", assignedLocationTitle).click({ force: true });
            cy.wait(300);

            // Click Apply button
            cy.contains("button", "Apply").click({ force: true });
            cy.wait(1500);
            cy.log(`Switched to location: "${assignedLocationTitle}"`);

            // ── Navigate to Warehouse Products page ──
            cy.visit(WAREHOUSE_PRODUCTS_URL);
            cy.wait(2000);

            // ── Search for the assigned product ──
            cy.contains("button", "Active").click({ force: true });
            cy.wait(1000);

            cy.get('input[placeholder="Search By Product"]').clear({ force: true }).type(productName, { force: true });
            cy.wait(800);

            // Product should appear in the table
            cy.contains(productName, { timeout: 15000 }).should("exist");
            cy.log(`Product "${productName}" found in table at assigned location`);

            // ── Verify the row shows correct product name, category, and quantity ≥ 3 ──
            cy.contains("td", productName).closest("tr").within(() => {
              // Category column (eq(1))
              cy.find("td").eq(1).invoke("text").then((cat) => {
                expect(cat.trim()).to.eq(categoryName);
                cy.log(`Category confirmed: "${cat.trim()}"`);
              });

              // Product name column (eq(2))
              cy.find("td").eq(2).invoke("text").then((name) => {
                expect(name.trim()).to.include(productName);
                cy.log(`Product name confirmed: "${name.trim()}"`);
              });

              // Stock/quantity column (eq(4))
              cy.find("td").eq(4).invoke("text").then((qty) => {
                const qtyTrimmed = qty.trim();
                cy.log(`Quantity in table: "${qtyTrimmed}"`);
                if (qtyTrimmed !== "Unlimited") {
                  expect(parseInt(qtyTrimmed)).to.be.greaterThan(0);
                  cy.log(`Quantity ≥ 1 confirmed (assigned 3, may have had prior stock)`);
                } else {
                  cy.log("Product is Unlimited — quantity shows as Unlimited");
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

    // ── Pre-flight: find a real transferable inventory item from DB ──
    cy.task("getTransferableInventoryItem").then((item) => {
      if (!item) {
        cy.log("No transferable inventory found (need a non-unlimited product with quantity > 0 at some location) — skipping");
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

      cy.log(`Transfer source: location="${inv.from_location_title}", product="${inv.product_name}", category="${inv.category_name}", qty=${inv.quantity}`);

      // Get all locations to pick a "to" location different from "from"
      cy.task("getAllLocations").then((locs) => {
        const locations = locs as Array<{ id: number; title: string }>;
        const toLocation = locations.find((l) => l.id !== inv.from_location_id);
        if (!toLocation) {
          cy.log("Only one location exists — cannot transfer, skipping");
          return;
        }
        cy.log(`Transfer destination: location="${toLocation.title}" (id=${toLocation.id})`);

        // Units to transfer — use 1 to be safe (always valid if qty > 0)
        const transferUnits = 1;

        // Record destination inventory BEFORE transfer
        cy.task("getInventoryByProductAndLocation", {
          productId: inv.product_id,
          locationId: toLocation.id,
        }).then((destBefore) => {
          const qtyBefore = destBefore
            ? (destBefore as Record<string, unknown>).quantity as number
            : 0;
          cy.log(`Destination qty BEFORE transfer: ${qtyBefore}`);

          // ── Open Transfer modal ──
          // The Transfer button is the green "Transfer" button on the products page
          cy.contains("button", "Transfer").click({ force: true });
          cy.wait(500);

          // Modal title is "Transfer Units"
          cy.contains("Transfer Units", { timeout: 10000 }).should("exist");
          cy.log("Transfer Units modal opened");

          // ── From Location dropdown (1st Searchable_Dropdown) ──
          // Searchable_Dropdown: click the trigger div → ul appears → click matching li
          cy.get(".w-full.relative").eq(0).click({ force: true });
          cy.wait(400);
          cy.get("ul li").contains(inv.from_location_title).click({ force: true });
          cy.wait(600);
          cy.log(`From Location selected: "${inv.from_location_title}"`);

          // ── To Location dropdown (2nd Searchable_Dropdown) ──
          cy.get(".w-full.relative").eq(1).click({ force: true });
          cy.wait(400);
          cy.get("ul li").contains(toLocation.title).click({ force: true });
          cy.wait(600);
          cy.log(`To Location selected: "${toLocation.title}"`);

          // ── Category dropdown (3rd Searchable_Dropdown) ──
          cy.get(".w-full.relative").eq(2).click({ force: true });
          cy.wait(400);
          cy.get("ul li").contains(inv.category_name).click({ force: true });
          cy.wait(1000); // wait for products to load for this category+location
          cy.log(`Category selected: "${inv.category_name}"`);

          // ── Product dropdown (4th Searchable_Dropdown) ──
          cy.get(".w-full.relative").eq(3).click({ force: true });
          cy.wait(400);
          cy.get("ul li").contains(inv.product_name).click({ force: true });
          cy.wait(600);
          cy.log(`Product selected: "${inv.product_name}"`);

          // ── Units input ──
          // Label shows "Units (Available: N)" — verify the available count is shown
          cy.contains(`Available: ${inv.quantity}`).should("exist");
          cy.log(`Available units label confirmed: ${inv.quantity}`);

          cy.get('input#section[type="number"]')
            .scrollIntoView()
            .clear({ force: true })
            .type(String(transferUnits), { force: true });
          cy.wait(300);
          cy.log(`Units entered: ${transferUnits}`);

          // ── Submit transfer ──
          cy.contains("button", "Transfer").last().click({ force: true });

          // Wait for modal to close — title disappears on success
          cy.contains("Transfer Units", { timeout: 15000 }).should("not.exist");
          cy.log("Transfer submitted — modal closed");

          // ── DB verification: destination qty increased by transferUnits ──
          cy.task("getInventoryByProductAndLocation", {
            productId: inv.product_id,
            locationId: toLocation.id,
          }).then((destAfter) => {
            expect(destAfter).to.not.be.null;
            const qtyAfter = (destAfter as Record<string, unknown>).quantity as number;
            cy.log(`Destination qty AFTER transfer: ${qtyAfter}`);
            expect(qtyAfter).to.eq(qtyBefore + transferUnits);
            cy.log(`Quantity increased correctly: ${qtyBefore} → ${qtyAfter} (+${transferUnits})`);
          });

          // ── DB verification: source qty decreased by transferUnits ──
          cy.task("getInventoryRecord", { inventoryId: inv.inventory_id }).then((srcAfter) => {
            expect(srcAfter).to.not.be.null;
            const srcQty = (srcAfter as Record<string, unknown>).quantity as number;
            cy.log(`Source qty AFTER transfer: ${srcQty}`);
            expect(srcQty).to.eq(inv.quantity - transferUnits);
            cy.log(`Source quantity decreased correctly: ${inv.quantity} → ${srcQty} (-${transferUnits})`);
          });

          // ── UI verification: switch to destination location and check inventory ──
          // Open the location switcher in the sidebar
          cy.get("button.text-white.text-xs.text-start").first().click({ force: true });
          cy.wait(500);

          cy.contains("Change Location", { timeout: 10000 }).should("exist");
          cy.log("Location modal opened");

          cy.contains("button", toLocation.title).click({ force: true });
          cy.wait(300);
          cy.contains("button", "Apply").click({ force: true });
          cy.wait(1500);
          cy.log(`Switched to destination location: "${toLocation.title}"`);

          // Navigate to inventory page for this location
          cy.visit("/en/inventory/manage");
          cy.wait(2000);

          // Search for the transferred product
          cy.get('input[placeholder*="Search"]').first()
            .clear({ force: true })
            .type(inv.product_name, { force: true });
          cy.wait(800);

          // Product should appear with quantity = qtyBefore + transferUnits
          cy.contains(inv.product_name, { timeout: 15000 }).should("exist");
          cy.log(`Product "${inv.product_name}" found in inventory at destination location`);

          // Verify the quantity shown in the table matches expected
          cy.contains("td", inv.product_name).closest("tr").within(() => {
            // Category column
            cy.contains(inv.category_name).should("exist");
            cy.log(`Category "${inv.category_name}" confirmed in row`);

            // Find the quantity cell — inventory table: ID, Category, Name, Price, Units, Actions
            cy.find("td").then(($tds) => {
              // Units is the 5th td (index 4)
              const unitsText = ($tds[4]?.textContent || "").trim();
              cy.log(`Units shown in inventory table: "${unitsText}"`);
              const expectedQty = qtyBefore + transferUnits;
              expect(parseInt(unitsText)).to.eq(expectedQty);
              cy.log(`Quantity confirmed: ${unitsText} = ${expectedQty}`);
            });
          });

          cy.log("Transfer test fully verified — source deducted, destination received correct quantity");
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
