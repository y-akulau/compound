[← Back to Index](../../index.md#3-lifetimes)

# Lifetimes — Scoped

> **Part I** | **Question: Lifetimes** | *Article 3*

---

For instances tied to a scope boundary (e.g. HTTP request, unit of work), use `derive()` to create a child compound and attach scope-specific values.

```ts
// logger.ts
export interface Logger {
    log(...args: unknown[]): void;
}
```

```ts
// user-repository.ts
import type { PoolClient } from "pg";

export class UserRepository {
    public constructor(
        private readonly deps: { readonly tx: PoolClient },
    ) {}

    public async insert(name: string): Promise<string> {
        const { rows } = await this.deps.tx.query<{ id: string }>(
            "INSERT INTO users (name) VALUES ($1) RETURNING id",
            [name],
        );

        return rows[0].id;
    }
}
```

```ts
// event-repository.ts
import type { PoolClient } from "pg";

export class EventRepository {
    public constructor(
        private readonly deps: { readonly tx: PoolClient },
    ) {}

    public async insert(event: string, entityId: string): Promise<void> {
        await this.deps.tx.query(
            "INSERT INTO events (event, entity_id) VALUES ($1, $2)",
            [event, entityId],
        );
    }
}
```

```ts
// create-user.ts
import { z } from "zod";

import type { Logger } from "./logger.js";
import type { UserRepository } from "./user-repository.js";
import type { EventRepository } from "./event-repository.js";

export const CreateUserInput = z.object({ name: z.string().min(1) });
export type CreateUserInput = z.infer<typeof CreateUserInput>;

export interface CreateUserContext {
    // Singleton dependencies
    readonly logger: Logger;
    // Scoped dependencies
    readonly userRepository: UserRepository;
    readonly eventRepository: EventRepository;
    readonly requestId: string;
    // Arguments
    readonly input: CreateUserInput;
}

export async function createUser(ctx: CreateUserContext): Promise<void> {
    ctx.logger.log("creating user", { requestId: ctx.requestId, name: ctx.input.name });

    const userId = await ctx.userRepository.insert(ctx.input.name);
    await ctx.eventRepository.insert("user-created", userId);

    ctx.logger.log("user created", { userId, name: ctx.input.name });
}
```

```ts
// main.ts
import http from "node:http";
import { compound } from "compound";
import { Pool } from "pg";

import { UserRepository } from "./user-repository.js";
import { EventRepository } from "./event-repository.js";
import { CreateUserInput, createUser } from "./create-user.js";

const app = compound();
// Singleton components
app.attach("config", {
    http: {
        port: 3000,
    },
    db: {
        connectionString: "postgres://...",
    },
});
app.attach("logger", console);
app.attach("db", new Pool(app.components.config.db));

const server = http.createServer(async (request, response) => {
    const ctx = app.derive();
    // Scoped components
    ctx.attach("requestId", crypto.randomUUID());
    ctx.attach("tx", await ctx.components.db.connect());
    ctx.attach("userRepository", new UserRepository(ctx.components));
    ctx.attach("eventRepository", new EventRepository(ctx.components));

    try {
        await ctx.components.tx.query("BEGIN");

        if (request.method === "POST" && request.url === "/users") {
            const chunks: Buffer[] = [];
            for await (const chunk of request) chunks.push(chunk);
            const input = CreateUserInput.parse(
                JSON.parse(Buffer.concat(chunks).toString()),
            );

            await createUser({ ...ctx.components, input });
            response.writeHead(201);
            response.end("Created");
        } else {
            response.writeHead(404);
            response.end("Not found");
        }

        await ctx.components.tx.query("COMMIT");
    } catch {
        await ctx.components.tx.query("ROLLBACK");
        response.writeHead(500);
        response.end("Internal error");
    } finally {
        ctx.components.tx.release();
    }
});

server.listen(app.components.config.http.port);
```
