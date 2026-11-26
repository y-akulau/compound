[← Back to Index](../../index.md#3-lifetimes)

# Lifetimes — Singleton

> **Part I** | **Question: Lifetimes** | *Article 1*

---

Every component in `compound` is a singleton — `attach` stores a value, and that same value is always returned. No special registration needed.

```ts
import assert from "node:assert";
import { SimpleCompound } from "compound";

import { Logger } from "./logger.js";

const app: SimpleCompound = new SimpleCompound();

app.attach("logger", new Logger());

assert(app.components.logger === app.components.logger);
```
