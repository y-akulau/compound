[← Back to Index](../../index.md#9-container)

# Container — Settings

> **Part I** | **Question: Container** | *Article 3*

Application settings are just components. Their source doesn't matter.

```ts
// config.ts
import { readFile } from "node:fs/promises";
import { parseArgs } from "node:util";
import { z } from "zod";

function prune<T extends Record<string, unknown>>(obj: T): T {
    return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as T;
}

const File = z.object({
    port: z.number().optional(),
    dbUrl: z.string().optional(),
});

const Env = z.object({
    PORT: z.coerce.number().optional(),
    DATABASE_URL: z.string().optional(),
}).transform(({ PORT: port, DATABASE_URL: dbUrl }) => prune({ port, dbUrl }));

const Cli = z.object({
    port: z.coerce.number().optional(),
    "db-url": z.string().optional(),
}).transform(({ port, "db-url": dbUrl }) => prune({ port, dbUrl }));

export async function parseConfig() {
    const rawFile = await readFile("./config.json", "utf-8");
    const file = await File.parseAsync(JSON.parse(rawFile));

    const env = await Env.parseAsync(process.env);
    const cli = await Cli.parseAsync(parseArgs({
        options: { port: { type: "string" }, "db-url": { type: "string" } },
    }).values);

    return {
        port: 3000,
        dbUrl: "postgres://localhost:5432",
        ...file,
        ...env,
        ...cli,
    };
}
```

```ts
// main.ts
import { compound } from "compound";
import { parseConfig } from "./config.js";

const ctx = compound();
ctx.attach("config", await parseConfig());
```
