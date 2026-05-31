import { defineConfig } from "cypress";
import { supabaseTasks } from "./cypress/support/tasks";
import * as dotenv from "dotenv";

/**
 * Cypress Configuration for Supabase Contact Form Tests
 *
 * ENVIRONMENT VARIABLES:
 * - CYPRESS_TEST_EMAIL: Provide a custom email for testing (e.g., user@example.com)
 *   Usage: CYPRESS_TEST_EMAIL=john.doe@company.com npx cypress run
 *   If not provided, tests will generate unique emails with timestamps
 *
 * Example commands:
 * 1. Run tests with default generated emails:
 *    npx cypress run cypress/e2e/supabase-contact-form.cy.ts
 *
 * 2. Run tests with custom email:
 *    CYPRESS_TEST_EMAIL=testuser@example.com npx cypress run cypress/e2e/supabase-contact-form.cy.ts
 *
 * 3. Open Cypress UI with custom email:
 *    CYPRESS_TEST_EMAIL=testuser@example.com npx cypress open
 */
dotenv.config({ path: ".env.local" });

export default defineConfig({
  projectId: "ibms4h",
  e2e: {
    env: {
      E2E_EMAIL: process.env.CYPRESS_E2E_EMAIL,
      E2E_PASSWORD: process.env.CYPRESS_E2E_PASSWORD,
    },
    baseUrl: process.env.CYPRESS_BASE_URL || "http://localhost:3000",
    viewportWidth: 1280,
    viewportHeight: 800,
    video: false,
    screenshotOnRunFailure: false,
    defaultCommandTimeout: 60000,
    pageLoadTimeout: 300000,
    retries: {
      runMode: 0,
      openMode: 0,
    },
    // Multi-reporter: spec for console, mochawesome for JSON results
    reporter: "cypress-multi-reporters",
    reporterOptions: {
      configFile: "cypress/reporter-config.json",
    },
    setupNodeEvents(on, config) {
      // Register Supabase tasks
      on("task", supabaseTasks);
      config.env.E2E_EMAIL =
        config.env.E2E_EMAIL || process.env.CYPRESS_E2E_EMAIL;
      config.env.E2E_PASSWORD =
        config.env.E2E_PASSWORD || process.env.CYPRESS_E2E_PASSWORD;
      // Wire record key from .env.local so cy.prompt auth works in headless mode
      if (process.env.CYPRESS_RECORD_KEY) {
        config.env.CYPRESS_RECORD_KEY = process.env.CYPRESS_RECORD_KEY;
      }
      return config;
    },
    allowCypressEnv: false,
    supportFile: "cypress/support/e2e.ts",
  },
});
