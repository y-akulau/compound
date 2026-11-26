[← Back to Index](../../index.md#9-container)

# Container — Events

> **Part I** | **Question: Container** | *Article 2*

The application can call relevant methods of the components in response to events.

## Manual

```ts
import { SimpleCompound } from "compound";
import { Pool } from "pg";

const app: SimpleCompound = new SimpleCompound();
app.attach("db", new Pool({ connectionString: "postgres://..." }));

// ...

// On the application shutdown.
await app.components.db.end();
```

## Convention

Components can expose a method to handle an event. A single utility call finds those components and runs them.

```ts
// app-events.ts
import { SimpleCompound, ComponentName } from "compound";

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
import { SimpleCompound } from "compound";
import { Pool, type PoolConfig } from "pg";

import { start } from "./app-events.js";

export class Db {
    private readonly pool: Pool;

    public constructor(deps: { readonly config: { readonly db: PoolConfig } }) {
        this.pool = new Pool(deps.config.db);
    }

    public async start(): Promise<void> {
        await this.migrate();
    }

    private async migrate(): Promise<void> {
        // ...
    }
}

const app: SimpleCompound = new SimpleCompound();
app.attach("config", { db: { connectionString: "postgres://..." } });
app.attach("db", new Db(app.components));

await start(app.components);
```

## Base class

By extending a base class, a component declares its role in the application. The system finds it by `instanceof` and use.

```ts
// background-worker.ts
export abstract class BackgroundWorker {
    public async [Symbol.asyncDispose](): Promise<void> {
        await this.stop();
    }

    public abstract start(): Promise<void>;

    public abstract stop(): Promise<void>;
}
```

```ts
import { connect, type Connection } from "amqplib";

// queue-consumer.worker.ts
export class QueueConsumer extends BackgroundWorker {
    private readonly amqpUrl: string;
    private connection: Connection | null = null;

    public constructor(deps: {
        readonly config: { readonly amqpUrl: string };
    }) {
        super();
        this.amqpUrl = deps.config.amqpUrl;
    }

    public override async start(): Promise<void> {
        const connection = await connect(this.amqpUrl);
        this.connection = connection;

        const channel = await connection.createChannel();
        await channel.consume("ch1", (message) => {
            // ...
        });
    }

    public override async stop(): Promise<void> {
        await this.connection?.close();
        this.connection = null;
    }
}
```

```ts
// app-events.ts
import { SimpleCompound, ComponentName } from "compound";

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
import { SimpleCompound } from "compound";

import { startWorkers, dispose } from "./app-events.js";

const app: SimpleCompound = new SimpleCompound();
app.attach("config", { amqpUrl: "amqp://localhost" });
app.attach("queueConsumer", new QueueConsumer(app.components));

await startWorkers(app.components);

// ...

await dispose(app.components);
```
