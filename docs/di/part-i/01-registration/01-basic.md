[← Back to Index](../../index.md#1-registration)

# Registration — Basic

> **Part I** | **Question: Registration** | *Article 1*

---

Despite the conventional DI term, `attach` does not register a component in the usual sense. Nothing is stored for later resolution — the value is assigned **immediately** to a property on a compound. The word "registration" is used here only as a familiar entry point; the mechanism is assignment.

## Attach a value

```ts
import { SimpleCompound } from "compound";

const app: SimpleCompound = new SimpleCompound();

app.attach("logger", console);
app.attach("port", 3000);

app.components.logger.log(app.components.port);
```

## Symbol names

```ts
import { SimpleCompound } from "compound";
import { Pool } from "pg";

const DB = Symbol("db");

app.attach(DB, new Pool());

app.components[DB];
```

## Dependent component

```ts
app.attach("config", {
    db: {
        url: "postgres://..."
    },
});

// `config` is already there!
app.attach("pool", new Pool(app.components.config.db));
```

## Class tree

```ts
// domain.ts
import { z } from "zod";

export const UserSchema = z.object({
    id: z.string(),
    email: z.string(),
    passwordHash: z.string(),
});

export type User = z.infer<typeof UserSchema>;

export interface IUserRepository {
    add(email: string, passwordHash: string): Promise<User>;
}
```

```ts
// app/hasher.ts
export interface IHasher {
    hash(password: string): Promise<string>;
}
```

```ts
// infra/user-repository.ts
import { Pool } from "pg";

import { UserSchema, type IUserRepository, type User } from "../domain.js";

export class PostgresUserRepository implements IUserRepository {
    public constructor(
        private readonly deps: {
            readonly db: Pool;
        },
    ) {}

    public async add(email: string, passwordHash: string): Promise<User> {
        const { rows } = await this.deps.db.query(
            "INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, password_hash",
            [email, passwordHash],
        );

        const { success, data: user } = UserSchema.safeParse(rows[0]);
        if (!success) throw new Error("Invalid user data");

        return user;
    }
}
```

```ts
// infra/hasher.ts
import bcrypt from "bcrypt";

import type { IHasher } from "../app/hasher.js";

export class BcryptHasher implements IHasher {
    public async hash(password: string): Promise<string> {
        const hash = await bcrypt.hash(password, 12);
        return hash;
    }
}
```

```ts
// app/user-service.ts
import type { IUserRepository } from "../domain.js";
import type { IHasher } from "./hasher.js";

export class UserService {
    public constructor(
        private readonly deps: {
            readonly userRepository: IUserRepository;
            readonly hasher: IHasher;
        },
    ) {}

    public async register(email: string, password: string): Promise<void> {
        const passwordHash = await this.deps.hasher.hash(password);
        await this.deps.userRepository.add(email, passwordHash);
    }
}
```

```ts
// main.ts
import { SimpleCompound } from "compound";
import { Pool } from "pg";

import { UserService } from "./app/user-service.js";
import { PostgresUserRepository } from "./infra/user-repository.js";
import { BcryptHasher } from "./infra/hasher.js";

const app: SimpleCompound = new SimpleCompound();

app.attach("config", { dbUrl: "postgres://..." });
app.attach("db", new Pool(app.components.config.dbUrl));
app.attach("userRepository", new PostgresUserRepository(app.components));
app.attach("hasher", new BcryptHasher());
app.attach("userService", new UserService(app.components));
```

## Re-attachment is rejected

```ts
app.attach("a", 1);

// Compilation error: Argument of type '"a"' is not assignable to parameter of type 'never'.
// Runtime: ComponentAlreadyAttached is thrown.
app.attach("a", 2);
```
