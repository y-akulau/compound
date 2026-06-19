[← Back to Index](../../index.md#9-container)

# Container — Disposable

> **Part I** | **Question: Container** | *Article 1*

Nothing is disposed automatically — the application decides when and how to clean up.

## Manual cleanup

```ts
import { compound } from "compound";
import { Pool } from "pg";

const ctx = compound();
ctx.attach("db", new Pool({ connectionString: "postgres://..." }));

// ...

await ctx.components.db.end();
```

## Dispose by convention

Components that implement `Symbol.dispose` / `Symbol.asyncDispose` declare their own cleanup. A single utility call finds and runs them.

```ts
// app-events.ts

// The convention can be any: Symbol.asyncDispose, "onShutdown" method, or ON_SHUTDOWN symbol.
export async function dispose(components: Record<string, unknown>): Promise<void> {
    const errors: unknown[] = [];
    for (const component of Object.values(components)) {
        if (component !== null && Symbol.dispose in component) {
            try {
                component[Symbol.dispose]();
            } catch (error) {
                errors.push(error);
            }
        }

        if (component !== null && Symbol.asyncDispose in component) {
            // NOTE: Or Promise.allSettled if disposal can happen in parallel.
            await component[Symbol.asyncDispose]().catch(error => errors.push(error));
        }
    }

    if (error.length > 0) {
        throw new AggregateError(errors);
    }
}
```

```ts
import { compound } from "compound";
import { Worker } from "node:worker_threads";

import { dispose } from "./app-events.js";

const ctx = compound();
ctx.attach("emailJob", new Worker("./scripts/email-job.js"));
ctx.attach("exportJob", new Worker("./scripts/export-job.js"));

await dispose(ctx.components);
```

## Cleanup as component

When a component has no disposal of its own, attach a dedicated cleanup component. The convention stays the same.

```ts
import { compound } from "compound";
import { Pool } from "pg";

import { dispose } from "./app-events.js";

const ctx = compound();
ctx.attach("db", new Pool({ connectionString: "postgres://..." }));
ctx.attach("db.end", {
    [Symbol.asyncDispose]: async () => await ctx.components.db.end(),
});

// ...

await dispose(ctx.components);
```
