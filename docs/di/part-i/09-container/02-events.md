[← Back to Index](../../index.md#9-container)

# Container — Events

> **Part I** | **Question: Container** | *Article 2*

The application can call relevant methods of the components in response to events.

## Manual

```ts
import { compound } from "compound";
import { Pool } from "pg";

const ctx = compound();
ctx.attach("db", new Pool({ connectionString: "postgres://..." }));

// ...

// On the application shutdown.
await ctx.components.db.end();
```

## Convention

Components can expose a method to handle an event. A single utility call finds those components and runs them.

```ts
// app-events.ts
import { ComponentName } from "compound";

import { type Logger } from "./logger.js";

// The convention can be any: e.g. method with name "start", Method with ON_START symbol or @OnStart decorator to store metadata.
export async function start(components: Readonly<Record<string, unknown> & { logger?: Logger }>): Promise<void> {
    const errors: unknown[] = [];
    for (const [name, component] of Object.entries(components)) {
        try {
            type Start = () => void;
            const start: Start | undefined = (component as any)?.start;
            if (typeof start !== "function") continue;

            await start.call(component);
        } catch (error) {
            components.logger?.log(`Failed to start component ${ComponentName.stringify(name)}`, error);
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
import { Pool, type PoolConfig } from "pg";

import { start } from "./app-events.js";

export class Db {
    #pool: Pool;

    constructor(deps: { readonly config: { readonly db: PoolConfig } }) {
        this.#pool = new Pool(deps.config.db);
    }

    async start() {
        await this.#migrate();
    }

    async #migrate() {
        // ...
    }
}

const ctx = compound();
ctx.attach("config", { db: { connectionString: "postgres://..." } });
ctx.attach("db", new Db(ctx.components));

await start(ctx.components);
```

## Base class

By extending a base class, a component declares its role in the application. The system finds it by `instanceof` and use.

```ts
// background-worker.ts
export abstract class BackgroundWorker {
    async [Symbol.asyncDispose](): Promise<void> {
        await this.stop();
    }

    abstract start(): Promise<void>;

    abstract stop(): Promise<void>;
}
```

```ts
import { connect, type Connection } from "amqplib";

// queue-consumer.worker.ts
export class QueueConsumer extends BackgroundWorker {
    #amqpUrl: string;
    #connection: Connection | null = null;

    constructor(deps: {
        readonly config: { readonly amqpUrl: string },
    }) {
        super();
        this.#amqpUrl = deps.config.amqpUrl;
    }

    async start(): Promise<void> {
        const connection = await connect(this.#amqpUrl);
        this.#connection = connection;

        const channel = await connection.createChannel();
        await channel.consume("ch1", (message) => {
            // ...
        });
    }

    async stop(): Promise<void> {
        await this.#connection?.close();
        this.#connection = null;
    }
}
```

```ts
// app-events.ts
import { ComponentName } from "compound";

import { type Logger } from "./logger.js";
import { BackgroundWorker } from "./background-worker.js";


export async function startWorkers(components: Readonly<Record<string, unknown> & { logger?: Logger }>): Promise<void> {
    const errors: unknown[] = [];
    for (const [name, component] of Object.entries(components)) {
        if (!(component instanceof BackgroundWorker)) continue;

        try {
            await component.start();
        } catch (error) {
            components.logger?.log(`Failed to start worker ${ComponentName.stringify(name)}`, error);
            errors.push(error);
        }
    }

    if (errors.length > 0) {
        throw new AggregateError(errors);
    }
}
```

```ts
// main.ts
import { compound } from "compound";

import { startWorkers, dispose } from "./app-events.js";

const ctx = compound();
ctx.attach("config", { amqpUrl: "amqp://localhost" });
ctx.attach("queueConsumer", new QueueConsumer(ctx.components));

await startWorkers(ctx.components);

// ...

await dispose(ctx.components);
```
