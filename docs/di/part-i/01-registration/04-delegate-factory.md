[← Back to Index](../../index.md#1-registration)

# Registration — Delegate / Factory

> **Part I** | **Question: Registration** | *Article 4*

---

Components are created manually to add to `compound`, so no special mechanism (factory / delegate registering) is needed to explain how to create component.

## Custom component creation

Write any code before `attach` — no special API needed.

```ts
import { SimpleCompound } from "compound";
import { Pool } from "pg";
import { readFileSync } from "fs";
import { z } from "zod";

const Config = z.object({
    db: z.object({
        connectionString: z.string(),
    })
});

const app: SimpleCompound = new SimpleCompound();

const raw = JSON.parse(readFileSync("config.json", "utf-8"));
const config = Config.parse(raw);
app.attach("config", config);

const pool = new Pool(app.components.config.db);
pool.on("error", (err) => console.error("pool error", err));
app.attach("db", pool);
```

## Async component creation

`await` before `attach` — same pattern.

```ts
import { SimpleCompound } from "compound";
import { Pool } from "pg";
import { readFile } from "fs/promises";
import { z } from "zod";

const Config = z.object({
    db: z.object({
        connectionString: z.string(),
    })
});

const app: SimpleCompound = new SimpleCompound();

const raw = JSON.parse(await readFile("config.json", "utf-8"));
const config = await Config.parseAsync(raw);
app.attach("config", config);

app.attach("db", new Pool(app.components.config.db);
```

## Registering actual factories

When deferred creation is needed, attach a function.

```ts
import { SimpleCompound } from "compound";
import { Pool } from "pg";

const app: SimpleCompound = new SimpleCompound();

app.attach("db", new Pool({ connectionString: "postgres://..." }));

app.attach("createClient", async () => await app.components.db.connect());

const client = await app.components.createClient();
// ...
client.release();
```
