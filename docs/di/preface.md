[← Back to Index](index.md)

# Preface

This compendium contains instructions and examples on how to implement various DI features with `compound` since `compound` itself is minimalistic.

`compound` is based on immediate dependency creation and _object slicing_, not on a metadata registry container. It is immediate in that sense: components are created as they go, and nothing is retained — no definitions, descriptors, or metadata are stored in the container to build component later.

It's a different take and could seem not similar to DI in Java or C#, but appears much simpler and more idiomatic in JavaScript/TypeScript.

`compound` offers compile-time check of dependencies, preventing type mismatches and circular dependencies. Wiring dependencies manually in the composite root offers the same thing though. The only convenience `compound` gives is purely syntactical: if you want to extend a later component's dependencies, you can simply demand any earlier component and the wiring code can stay unchanged.

Basic example:

```ts
// logger.ts
export interface Logger {
    log(...data: any[]): void;
}
```

```ts
// auth.ts
interface AuthenticatorConfig {
    readonly jwtSecret: string;
}

interface AuthenticatorDeps {
    readonly config: AuthenticatorConfig;
}

// Class with dependencies.
export class Authenticator {
    readonly #secret: string;

    constructor(deps: AuthenticatorDeps) {
        this.#secret = deps.config.jwtSecret;
    }

    parse(authHeader?: string): string | null {
        if (!authHeader?.startsWith("Bearer ")) return null;

        // Decode JWT with this.#secret — simplified.
        return "user_123";
    }
}
```

```ts
// use-cases/get-profile.ts
import { z } from "zod";
import type { Pool } from "pg";

import type { Logger } from "../logger.js";

const Profile = z.object({
    id: z.number(),
    name: z.string(),
    email: z.string(),
});

type Context = Readonly<{
    logger: Logger;
    db: Pool;
    userId: string;
}>;

export const getProfile = async ({ logger, db, userId }: Context) => {
    logger.log(`Fetching profile for user ${userId}`);
    const { rows } = await db.query(
        "SELECT id, name, email FROM users WHERE id = $1",
        [userId],
    );

    const profile = Profile.parse(rows[0]);

    return profile;
};
```

```ts
// main.ts
import { createServer } from "node:http";
import { Pool } from "pg";
import { compound, type Compound } from "compound";

import { Authenticator } from "./auth.js";
import { getProfile } from "./use-cases/get-profile.js";

const app: Compound = compound();

// Custom object.
app.attach("config", {
    port: 3000,
    db: {
        connectionString: "postgres://localhost:5432/myapp",
    },
    jwtSecret: "s3cr3t"
});

// Existing instance.
app.attach("logger", console);
// External class.
app.attach("db", new Pool(app.components.config.db));
// Own class.
app.attach("authenticator", new Authenticator(app.components));

const server = createServer(async (request, response) => {
    try {
        if (request.method === "GET" && request.url === "/profile") {
            const userId = app.components.authenticator.parse(request.headers.authorization);
            if (!userId) {
                response.writeHead(401);
                response.end("Unauthorized");
                return;
            }

            // Own scope: has both shared app components and its own scoped ones.
            const scope: typeof app = app.derive();
            // Scoped component.
            scope.attach("userId", userId);

            const profile = await getProfile(scope.components);
            response.writeHead(200, { "Content-Type": "application/json" });
            response.end(JSON.stringify(profile));
            return;
        }

        response.writeHead(404);
        response.end("Not Found");
    } catch(error) {
        app.components.logger.log(error);

        response.writeHead(500);
        response.end("Internal Server Error");
    }
});

server.listen(app.components.config.port);
```
