import { SnapshotOptions } from '@percy/core';

declare namespace Cypress {
  interface Chainable<Subject> {
    percySnapshot(
      name?: string,
      options?: SnapshotOptions
    ): Chainable<Subject>
  }
}
