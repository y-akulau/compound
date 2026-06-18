[← Back to Index](../../index.md#1-registration)

# Registration — Instance Registration

> **Part I** | **Question: Registration** | *Article 2*

---

`attach` stores the value as-is. The exact reference passed to `attach` is what `ctx.components[name]` returns — no wrapping, no proxying, no deferred creation.

## Instance identity

```ts
import { compound } from "compound";

const ctx = compound();

const obj = { x: 1 };
ctx.attach("obj", obj);

ctx.components.obj === obj; // true
```

## Mutable instances

`ctx.components` is read-only (reassigning or deleting properties throws), but the attached **value** itself can be mutated.

```ts
import { compound } from "compound";

const ctx = compound();

const items = [1];
ctx.attach("items", items);

ctx.components.items.push(2);
// `items` is now [1, 2].
```

## Eager creation

The instance is constructed at the `attach` call site, not deferred until access.

```ts
import { compound } from "compound";
import { Pool } from "pg";

const ctx = compound();

// Pool is constructed here, not later on access.
ctx.attach("db", new Pool({ connectionString: "postgres://..." }));
```
