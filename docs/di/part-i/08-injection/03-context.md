[← Back to Index](../../index.md#8-injection)

# Injection — Context

> **Part I** | **Question: Injection** | *Article 3*

---

Context injection passes a context object with dependencies instead of listing them as separate parameters. The function reads what it needs from that context.

```ts
// app/create-user.ts
import type { IUserRepository } from "../domain.js";
import type { IHasher } from "./hasher.js";

type Context = Readonly<{
    userRepository: IUserRepository;
    hasher: IHasher;
}>;

export const createUser = async (ctx: Context, email: string, password: string): Promise<void> => {
    const passwordHash = await ctx.hasher.hash(password);
    await ctx.userRepository.add(email, passwordHash);
};
```

```ts
// main.ts
import { createServer } from "node:http";

import { SimpleCompound } from "compound";
import { z } from "zod";

import { createUser } from "./app/create-user.js";
import { PostgresUserRepository } from "./infra/user-repository.js";
import { BcryptHasher } from "./infra/hasher.js";

const app: SimpleCompound = new SimpleCompound();

app.attach("userRepository", new PostgresUserRepository(app.components));
app.attach("hasher", new BcryptHasher(app.components));

const createUserRequestSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
});

const server = createServer(async (request, response) => {
    if (request.method !== "POST" || request.url !== "/users") {
        response.writeHead(404);
        response.end();
        return;
    }

    try {
        let body = "";
        for await (const chunk of request) body += chunk;

        const parsed = createUserRequestSchema.safeParse(JSON.parse(body));
        if (!parsed.success) {
            response.writeHead(400, { "content-type": "application/json" });
            response.end(JSON.stringify({ error: parsed.error.flatten() }));
            return;
        }

        await createUser(app.components, parsed.data.email, parsed.data.password);

        response.writeHead(201);
        response.end();
    } catch (error) {
        console.error(error);
        response.writeHead(500);
        response.end();
    }
});

server.listen(3000);
```
