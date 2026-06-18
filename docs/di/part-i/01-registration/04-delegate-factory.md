[← Back to Index](../../index.md#1-registration)

# Registration — Delegate / Factory

> **Part I** | **Question: Registration** | *Article 4*

---

Components are created manually to add to `compound`, so no special mechanism (factory / delegate registering) is needed to explain how to create component.

## Custom component creation

Write any code before `attach` — no special API needed.

```ts
import { compound } from "compound";
import { Pool } from "pg";
import { readFileSync } from "fs";
import { z } from "zod";

const Config = z.object({
    db: z.object({
        connectionString: z.string(),
    })
});

const ctx = compound();

const raw = JSON.parse(readFileSync("config.json", "utf-8"));
const config = Config.parse(raw);
ctx.attach("config", config);

const pool = new Pool(ctx.components.config.db);
pool.on("error", (err) => console.error("pool error", err));
ctx.attach("db", pool);
```

## Async component creation

`await` before `attach` — same pattern.

```ts
import { compound } from "compound";
import { Pool } from "pg";
import { readFile } from "fs/promises";
import { z } from "zod";

const Config = z.object({
    db: z.object({
        connectionString: z.string(),
    })
});

const ctx = compound();

const raw = JSON.parse(await readFile("config.json", "utf-8"));
const config = await Config.parseAsync(raw);
ctx.attach("config", config);

ctx.attach("db", new Pool(ctx.components.config.db);
```

## Registering actual factories

When deferred creation is needed, attach a function.

```ts
import { compound } from "compound";
import { Pool } from "pg";

const ctx = compound();

ctx.attach("db", new Pool({ connectionString: "postgres://..." }));

ctx.attach("createClient", async () => await ctx.components.db.connect());

const client = await ctx.components.createClient();
// ...
client.release();
```
