[← Back to Index](../../index.md#1-registration)

# Registration — Instance Registration

> **Part I** | **Question: Registration** | *Article 2*

---

`attach` stores the value as-is. The exact reference passed to `attach` is what `app.components[name]` returns — no wrapping, no proxying, no deferred creation.

## Instance identity

```ts
import { SimpleCompound } from "compound";

const app: SimpleCompound = new SimpleCompound();

const obj = { x: 1 };
app.attach("obj", obj);

app.components.obj === obj; // true
```

## Mutable instances

`app.components` is read-only (reassigning or deleting properties throws), but the attached **value** itself can be mutated.

```ts
import { SimpleCompound } from "compound";

const app: SimpleCompound = new SimpleCompound();

const items = [1];
app.attach("items", items);

app.components.items.push(2);
// `items` is now [1, 2].
```

## Eager creation

The instance is constructed at the `attach` call site, not deferred until access.

```ts
import { SimpleCompound } from "compound";
import { Pool } from "pg";

const app: SimpleCompound = new SimpleCompound();

// Pool is constructed here, not later on access.
app.attach("db", new Pool({ connectionString: "postgres://..." }));
```
