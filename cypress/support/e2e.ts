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
    }
  }
}

// @ts-ignore
globalThis.TEST_EMAIL = "mackjmart@gmail.com";
// @ts-ignore
globalThis.TEST_PASSWORD = "Create123!";
