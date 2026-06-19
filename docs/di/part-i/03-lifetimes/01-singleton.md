[← Back to Index](../../index.md#3-lifetimes)

# Lifetimes — Singleton

> **Part I** | **Question: Lifetimes** | *Article 1*

---

Every component in `compound` is a singleton — `attach` stores a value, and that same value is always returned. No special registration needed.

```ts
import assert from "node:assert";
import { compound } from "compound";

import { Logger } from "./logger.js";

const ctx = compound();

ctx.attach("logger", new Logger());

assert(ctx.components.logger === ctx.components.logger);
```
