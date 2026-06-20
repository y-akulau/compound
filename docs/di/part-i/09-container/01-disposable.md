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
import { ComponentName } from "compound";

import { type Logger } from "./logger.js";

// The convention can be any: Symbol.asyncDispose, "onShutdown" method, or ON_SHUTDOWN symbol.
export async function dispose(components: Readonly<Record<string, unknown> & { logger?: Logger }>): Promise<void> {
    const errors: unknown[] = [];
    // NOTE: Or Promise.allSettled if disposal can happen in parallel.
    for (const [name, component] of Object.entries(components)) {
        try {
            type Dispose = () => PromiseLike<void> | void;
            const dispose: Dispose | undefined =
                (component as any)?.[Symbol.dispose] ??
                (component as any)?.[Symbol.asyncDispose];

            if (typeof dispose !== "function") continue;

            await dispose.call(component);
        } catch (error) {
            components.logger?.log(`Failed to dispose a component ${ComponentName.stringify(name)}`, error);
            errors.push(error);
        }
    }

    if (errors.length > 0) {
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
