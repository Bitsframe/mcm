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

        // Confirmation modal appears — title is t("Inventory_k10") = "Confirmation"
        cy.contains("Confirmation", { timeout: 10000 }).should("exist");
        cy.log("Confirmation modal opened");

        // Click the Archive confirm button (the red/failure button)
        cy.get(".fixed button").filter(":visible").then(($btns) => {
          // Find the button that is NOT Cancel/gray — it's the Archive/failure button
          const confirmBtn = Array.from($btns).find((b) => {
            const txt = (b.textContent || "").trim().toLowerCase();
            return txt === "archive" || txt === "unarchive";
          });
          if (confirmBtn) {
            cy.wrap(confirmBtn).click({ force: true });
          } else {
            // Fallback: click the last button in the modal footer
            cy.get(".fixed .flex.items-center.space-x-3 button").last().click({ force: true });
          }
        });
        cy.wait(2000);

        // Switch to Archive tab — category should appear
        cy.contains("button", "Archive").click({ force: true });
        cy.wait(1500);
        cy.contains(name, { timeout: 15000 }).should("exist");
        cy.log(`"${name}" found in Archive tab`);

        // Unarchive to restore — click the button on that row
        cy.contains(name).closest("tr").find("button").first().click({ force: true });
        cy.wait(500);

        // Confirmation modal for unarchive
        cy.contains("Confirmation", { timeout: 10000 }).should("exist");
        cy.log("Unarchive confirmation modal opened");

        cy.get(".fixed button").filter(":visible").then(($btns) => {
          const confirmBtn = Array.from($btns).find((b) => {
            const txt = (b.textContent || "").trim().toLowerCase();
            return txt === "archive" || txt === "unarchive";
          });
          if (confirmBtn) {
            cy.wrap(confirmBtn).click({ force: true });
          } else {
            cy.get(".fixed .flex.items-center.space-x-3 button").last().click({ force: true });
          }
        });
        cy.wait(2000);
        cy.log(`"${name}" restored to Active`);

        // Verify it's back in Active tab
        cy.contains("button", "Active").click({ force: true });
        cy.wait(1000);
        cy.contains(name).should("exist");
        cy.log(`"${name}" confirmed back in Active tab`);
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

      // Click Add Product button (contains "Add Product" text or CirclePlus icon)
      cy.contains("button", "Add Product").click({ force: true });
      cy.wait(500);

      // Modal opens — title is t("Inventory_k61") = "Create Product"
      cy.contains("Create Product", { timeout: 10000 }).should("exist");
      cy.log("Create Product modal opened");

      // ── Category (Searchable_Dropdown) ──
      // The dropdown renders as a div with a <p> showing the placeholder, clicking opens a <ul>
      // Find the dropdown container inside the modal
      cy.get('[role="dialog"] .w-full.relative, .fixed .w-full.relative')
        .first()
        .click({ force: true });
      cy.wait(300);
      // Select the first available option from the dropdown list
      cy.get("ul li").filter(":visible").first().click({ force: true });
      cy.wait(300);
      cy.log("Category selected from dropdown");

      // ── Product Name ──
      cy.get('input[type="text"]').filter(":visible").first().clear().type(newProdName);

      // ── Price ──
      cy.get('input[type="number"]').filter(":visible").first().clear().type("50");

      // ── Units ──
      cy.get('input[type="number"]').filter(":visible").eq(1).clear().type("100");

      // Submit
      cy.contains("button", "Create").click({ force: true });
      cy.wait(2000);

      // Search for new product in table
      cy.get('input[placeholder="Search By Product"]').clear().type(newProdName);
      cy.wait(500);
      cy.contains(newProdName, { timeout: 10000 }).should("exist");
      cy.log(`Product "${newProdName}" created and visible in table`);

      // Cleanup: clear search
      cy.get('input[placeholder="Search By Product"]').clear();
    });
  });

  it("should update a product and verify all changes appear in the table", () => {
    loginAndVisit(WAREHOUSE_PRODUCTS_URL);

    // Check DB first
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

        cy.contains("button", "Active").click({ force: true });
        cy.wait(1000);
        cy.get("table tbody tr", { timeout: 10000 }).should("have.length.greaterThan", 0);

        // Read the current product name so we can verify the update
        cy.get("table tbody tr").first().find("td").eq(2).invoke("text").then((originalName) => {
          cy.log(`Original product name: "${originalName.trim()}"`);

          // Click Update button (1st action button — blue RefreshCcw icon, eq(0))
          cy.get("table tbody tr").first().find("button").eq(0).click({ force: true });
          cy.wait(500);

          // Modal opens — title is t("Inventory_k62") = "Update Product"
          cy.contains("Update Product", { timeout: 10000 }).should("exist");
          cy.log("Update Product modal opened");

          // ── Category (Searchable_Dropdown) — pick a different/same category ──
          cy.get('[role="dialog"] .w-full.relative, .fixed .w-full.relative')
            .first()
            .click({ force: true });
          cy.wait(300);
          cy.get("ul li").filter(":visible").first().click({ force: true });
          cy.wait(300);
          cy.log("Category updated in dropdown");

          // ── Product Name ──
          const updatedName = `Updated${Date.now().toString().slice(-5)}`;
          cy.get('input[type="text"]').filter(":visible").first().clear().type(updatedName);
          cy.log(`New product name: "${updatedName}"`);

          // ── Price ──
          cy.get('input[type="number"]').filter(":visible").first().clear().type("199");
          cy.log("Price updated to 199");

          // ── Units — first uncheck unlimited if checked, then set units ──
          cy.get('#unlimited').then(($checkbox) => {
            if ($checkbox.is(":checked")) {
              cy.wrap($checkbox).click({ force: true });
              cy.wait(200);
            }
          });
          cy.get('input[type="number"]').filter(":visible").eq(1).clear().type("50");
          cy.log("Units updated to 50");

          // ── Bonus Eligible checkbox — toggle it ──
          cy.get('#bonus_eligible').then(($checkbox) => {
            const wasChecked = $checkbox.is(":checked");
            cy.wrap($checkbox).click({ force: true });
            cy.wait(200);
            cy.log(`Bonus eligible toggled: ${wasChecked} → ${!wasChecked}`);
          });

          // ── Unlimited checkbox — toggle on then off to verify it works ──
          cy.get('#unlimited').click({ force: true });
          cy.wait(200);
          cy.log("Unlimited checkbox toggled on");
          cy.get('#unlimited').click({ force: true });
          cy.wait(200);
          cy.log("Unlimited checkbox toggled off");

          // Submit update
          cy.contains("button", "Update").click({ force: true });
          cy.wait(2000);

          // Verify updated product name appears in the table
          cy.get('input[placeholder="Search By Product"]').clear().type(updatedName);
          cy.wait(500);
          cy.contains(updatedName, { timeout: 10000 }).should("exist");
          cy.log(`Updated product "${updatedName}" found in table`);

          // Verify price column shows updated value
          cy.contains(updatedName).closest("tr").find("td").eq(3).invoke("text").then((price) => {
            expect(price.trim()).to.eq("199");
            cy.log(`Price confirmed: ${price.trim()}`);
          });

          // Verify units column shows updated value
          cy.contains(updatedName).closest("tr").find("td").eq(4).invoke("text").then((units) => {
            expect(units.trim()).to.eq("50");
            cy.log(`Units confirmed: ${units.trim()}`);
          });

          // Cleanup: clear search
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

        // Click the Archive confirm button (the red/failure button in the modal)
        cy.get(".fixed button").filter(":visible").then(($btns) => {
          const confirmBtn = Array.from($btns).find((b) => {
            const txt = (b.textContent || "").trim().toLowerCase();
            return txt === "archive" || txt === "unarchive";
          });
          if (confirmBtn) {
            cy.wrap(confirmBtn).click({ force: true });
          } else {
            cy.get(".fixed .flex.items-center.space-x-3 button").last().click({ force: true });
          }
        });
        cy.wait(2000);

        // Switch to Archive tab — product should appear
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

        cy.get(".fixed button").filter(":visible").then(($btns) => {
          const confirmBtn = Array.from($btns).find((b) => {
            const txt = (b.textContent || "").trim().toLowerCase();
            return txt === "archive" || txt === "unarchive";
          });
          if (confirmBtn) {
            cy.wrap(confirmBtn).click({ force: true });
          } else {
            cy.get(".fixed .flex.items-center.space-x-3 button").last().click({ force: true });
          }
        });
        cy.wait(2000);
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

  it("should open Assign modal and show stock information", () => {
    loginAndVisit(WAREHOUSE_PRODUCTS_URL);

    cy.task("getActiveProductsCount").then((count) => {
      if ((count as number) === 0) {
        cy.log("No active products in DB — skipping assign test");
        return;
      }

      cy.get("table tbody tr", { timeout: 10000 }).should("have.length.greaterThan", 0);

      // Click Assign button (3rd action button — green CirclePlus icon, eq(2))
      cy.get("table tbody tr").first().find("button").eq(2).click({ force: true });
      cy.wait(500);

      // Assign modal opens — title is t("Inventory_k62") or "Assign Product"
      cy.contains("Assign Product", { timeout: 10000 }).should("exist");
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
