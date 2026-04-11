import "./commands";

declare global {
  namespace Cypress {
    interface Chainable {
      task(
        event: "waitForPatientInDB",
        arg: { email: string; maxAttempts?: number; intervalMs?: number },
      ): Chainable<Record<string, unknown> | null>;
    }
  }
}
