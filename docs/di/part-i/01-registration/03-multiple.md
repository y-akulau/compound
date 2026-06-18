[← Back to Index](../../index.md#1-registration)

# Registration — Multiple Registrations

> **Part I** | **Question: Registration** | *Article 3*

---

## Multiple values of the same interface

`compound` uses names to resolve components. Two different values never collide when resolved, even when they implement the same interface.

```ts
// app/email.ts
export interface IEmailSender {
    send(to: string, body: string): Promise<void>;
}
```

```ts
// infra/smtp.ts
import type { IEmailSender } from "../app/email.js";

export class Smtp implements IEmailSender {
    public async send(to: string, body: string): Promise<void> {
        // ...
    }
}
```

```ts
// infra/send-grid.ts
import type { IEmailSender } from "../app/email.js";

export class SendGrid implements IEmailSender {
    public async send(to: string, body: string): Promise<void> {
        // ...
    }
}
```

```ts
// infra/notification.ts
import type { IEmailSender } from "../app/email.js";

export class Notifier {
    public constructor(
        private readonly deps: {
            readonly primaryEmail: IEmailSender;
            readonly backupEmail: IEmailSender;
        },
    ) {}

    public async notify(to: string, body: string): Promise<void> {
        try {
            await this.deps.primaryEmail.send(to, body);
        } catch(primaryError) {
            try {
                await this.deps.backupEmail.send(to, body);
            } catch(backupError) {
                throw new AggregateError([primaryError, backupError]);
            }
        }
    }
}
```

```ts
// main.ts
import { compound } from "compound";

import { Smtp } from "./infra/smtp.js";
import { SendGrid } from "./infra/send-grid.js";
import { Notifier } from "./infra/notification.js";

const ctx = compound();

ctx.attach("primaryEmail", new Smtp());
ctx.attach("backupEmail", new SendGrid());

ctx.attach("notifier", new Notifier(ctx.components));
```

## Array component

To inject a collection of components, store them as an array in the compound.

```ts
// db/migration.ts
import type { PoolClient } from "pg";

export interface IMigration {
    readonly name: string;

    up(db: PoolClient): Promise<void>;

    down(db: PoolClient): Promise<void>;
}
```

```ts
// db/migrations/001-create-users.ts
import type { PoolClient } from "pg";

import type { IMigration } from "../migration.js";

export class CreateUsersMigration implements IMigration {
    public readonly name = "001-create-users";

    public async up(db: PoolClient): Promise<void> {
        await db.query(`
            CREATE TABLE users (
                id UUID PRIMARY KEY,
                email TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
        `);
    }

    public async down(db: PoolClient): Promise<void> {
        await db.query("DROP TABLE users");
    }
}
```

```ts
// db/migrations/002-add-roles.ts
import type { PoolClient } from "pg";

import type { IMigration } from "../migration.js";

export class AddRolesMigration implements IMigration {
    public readonly name = "002-add-roles";

    public async up(db: PoolClient): Promise<void> {
        await db.query(
            "ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'user'",
        );
    }

    public async down(db: PoolClient): Promise<void> {
        await db.query("ALTER TABLE users DROP COLUMN role");
    }
}
```

```ts
// db/migrations/003-create-posts.ts
import type { PoolClient } from "pg";

import type { IMigration } from "../migration.js";

export class CreatePostsMigration implements IMigration {
    public readonly name = "003-create-posts";

    public async up(db: PoolClient): Promise<void> {
        await db.query(`
            CREATE TABLE posts (
                id UUID PRIMARY KEY,
                user_id UUID NOT NULL REFERENCES users(id),
                title TEXT NOT NULL,
                body TEXT NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
        `);
    }

    public async down(db: PoolClient): Promise<void> {
        await db.query("DROP TABLE posts");
    }
}
```

```ts
// db/migrator.ts
import type { Pool } from "pg";

import type { IMigration } from "./migration.js";

export class Migrator {
    private migrations: readonly IMigration[];

    public constructor(
        private readonly deps: {
            readonly db: Pool;
            readonly migrations: readonly IMigration[];
        },
    ) {
        this.migrations = deps.migrations.toSorted((a, b) =>
            a.name.localeCompare(b.name),
        );
    }

    public async migrate(): Promise<void> {
        const applied = await this.getApplied();
        for (const migration of this.migrations) {
            if (applied.has(migration.name)) continue;

            const client = await this.deps.db.connect();
            try {
                await client.query("BEGIN");
                await migration.up(client);
                await client.query(
                    "INSERT INTO _migrations (name) VALUES ($1)",
                    [migration.name],
                );
                await client.query("COMMIT");
            } catch (e) {
                await client.query("ROLLBACK");
                throw e;
            } finally {
                client.release();
            }
        }
    }

    private async ensureTable(): Promise<void> {
        await this.deps.db.query(`
            CREATE TABLE IF NOT EXISTS _migrations (
                name TEXT PRIMARY KEY,
                applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
        `);
    }

    private async getApplied(): Promise<Set<string>> {
        await this.ensureTable();
        const { rows } = await this.deps.db.query<{ name: string }>(
            "SELECT name FROM _migrations ORDER BY name",
        );

        return new Set(rows.map(r => r.name));
    }
}
```

```ts
// main.ts
import { compound } from "compound";
import { Pool } from "pg";

import { Migrator } from "./db/migrator.js";
import { CreateUsersMigration } from "./db/migrations/001-create-users.js";
import { AddRolesMigration } from "./db/migrations/002-add-roles.js";
import { CreatePostsMigration } from "./db/migrations/003-create-posts.js";

import type { IMigration } from "./db/migration.js";

const ctx = compound();

ctx.attach("db", new Pool({ connectionString: "postgres://..." }));

const migrations: IMigration[] = [];
ctx.attach("migrations", migrations);

migrations.push(new CreateUsersMigration());
migrations.push(new AddRolesMigration());
migrations.push(new CreatePostsMigration());

ctx.attach("migrator", new Migrator(ctx.components));

await ctx.components.migrator.migrate();
```

## Collecting by convention

If there is a good way to determine the kind of components to collect (e.g. base class), then an array can be collected automatically — collect by `instanceof` at the point of use instead of maintaining a dedicated array.

```ts
// db/migration.ts
import type { PoolClient } from "pg";

export abstract class Migration {
    public abstract readonly name: string;

    public abstract up(db: PoolClient): Promise<void>;

    public abstract down(db: PoolClient): Promise<void>;
}
```

```ts
// db/migrations/001-create-users.ts
import { Migration } from "../migration.js";

export class CreateUsersMigration extends Migration {
    // ...
}
```

```ts
// db/migrations/002-add-roles.ts
import { Migration } from "../migration.js";

export class AddRolesMigration extends Migration {
    // ...
}
```

```ts
// db/migrations/003-create-posts.ts
import { Migration } from "../migration.js";

export class CreatePostsMigration extends Migration {
    // ...
}
```

```ts
// main.ts
import { compound } from "compound";
import { Pool } from "pg";

import { Migration } from "./db/migration.js";
import { Migrator } from "./db/migrator.js";
import { CreateUsersMigration } from "./db/migrations/001-create-users.js";
import { AddRolesMigration } from "./db/migrations/002-add-roles.js";
import { CreatePostsMigration } from "./db/migrations/003-create-posts.js";

const ctx = compound();

ctx.attach("db", new Pool({ connectionString: "postgres://..." }));

ctx.attach("createUsersMigration", new CreateUsersMigration());
ctx.attach("addRolesMigrations", new AddRolesMigration());
ctx.attach("createPostsMigrations", new CreatePostsMigration());

ctx.attach("migrations", Object.values(ctx.components).filter(
    (v): v is Migration => v instanceof Migration,
));

ctx.attach("migrator", new Migrator(ctx.components));

await ctx.components.migrator.migrate();
```
