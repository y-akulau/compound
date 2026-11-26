[← Back to Index](../../index.md#3-lifetimes)

# Lifetimes — Transient

> **Part I** | **Question: Lifetimes** | *Article 2*

---

For a new instance every time, attach a factory function and call it on demand.

```ts
import assert from "node:assert";
import { SimpleCompound } from "compound";

const app: SimpleCompound = new SimpleCompound();

app.attach("createId", () => crypto.randomUUID());

assert(app.components.createId() !== app.components.createId());
```
