[← Back to Index](../../index.md#3-lifetimes)

# Lifetimes — Transient

> **Part I** | **Question: Lifetimes** | *Article 2*

---

For a new instance every time, attach a factory function and call it on demand.

```ts
import assert from "node:assert";
import { compound } from "compound";

const ctx = compound();

ctx.attach("createId", () => crypto.randomUUID());

assert(ctx.components.createId() !== ctx.components.createId());
```
