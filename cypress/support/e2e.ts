import "./commands";

// Shared test credentials — available in all spec files
declare global {
  const TEST_EMAIL: string;
  const TEST_PASSWORD: string;

  namespace Cypress {
    interface Chainable {
      task(
        event: "waitForPatientInDB",
        arg: { email: string; maxAttempts?: number; intervalMs?: number },
      ): Chainable<Record<string, unknown> | null>;
      task(
        event: "verifyOrderDeleted",
        arg: { orderId: number },
      ): Chainable<boolean>;
      task(
        event: "getReturnBySalesId",
        arg: { salesId: number },
      ): Chainable<Record<string, unknown> | null>;
      task(
        event: "getArchivedInventoryCount",
        arg: { locationId: number },
      ): Chainable<number>;
      task(
        event: "getInventoryRecord",
        arg: { inventoryId: number },
      ): Chainable<Record<string, unknown> | null>;
      task(
        event: "getInventoryByProductName",
        arg: { productName: string; locationId: number },
      ): Chainable<Record<string, unknown> | null>;
      task(
        event: "getInventoryQuantity",
        arg: { inventoryId: number },
      ): Chainable<number>;
      task(
        event: "getLatestTransactionForPatient",
        arg: { patientId: number; orderId?: number },
      ): Chainable<Record<string, unknown> | null>;
      task(
        event: "getPatientsCountByLocation",
        arg: { locationid: number },
      ): Chainable<number>;
      task(
        event: "getActiveBonusConfig",
        arg: { locationId: number },
      ): Chainable<Record<string, unknown> | null>;
      task(
        event: "getBonusRowForLocationAndDate",
        arg: { locationId: number; date: string },
      ): Chainable<Record<string, unknown> | null>;
      task(
        event: "getBonusConfigHistory",
        arg: { locationId: number },
      ): Chainable<Record<string, unknown>[]>;
      task(
        event: "getBonusRowsForLocation",
        arg: { locationId: number; limit?: number },
      ): Chainable<Record<string, unknown>[]>;
    }
  }
}

// @ts-ignore
globalThis.TEST_EMAIL = "mackjmart@gmail.com";
// @ts-ignore
globalThis.TEST_PASSWORD = "Create123!";
