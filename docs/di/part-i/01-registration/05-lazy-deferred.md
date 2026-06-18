[← Back to Index](../../index.md#1-registration)

# Registration — Lazy / Deferred

> **Part I** | **Question: Registration** | *Article 5*

---

In `compound` every component is an eager value. For deferred computation with caching, attach a memoized thunk.

## Lazy helper

```ts
// utils/lazy.ts
export const lazy = <T>(thunk: () => T): (() => T) => {
    let value: T | undefined;
    let hasValue = false;

    let error: unknown = null;
    let hasError = false;

    return () => {
        if (hasValue) return value!;
        if (hasError) throw error;

        try {
            value = thunk();
            hasValue = true;

            return value;
        } catch (e) {
            error = e;
            hasError = true;

            throw e;
        }
    };
}

// main.ts
import assert from "node:assert";
import { Redis } from "ioredis";

import { lazy } from "./utils/lazy.js";
import { compound } from "compound";

const ctx = compound();

ctx.attach("getRedis", lazy(() => new Redis("redis://...")));

const redis = ctx.components.getRedis();
const same = ctx.components.getRedis();
assert(redis === same);
```

## Factory vs Lazy

A factory returns a fresh value on every call. A lazy thunk computes once and caches.

```ts
import assert from "node:assert";
import { compound } from "compound";

import { lazy } from "./utils/lazy.js";

const ctx = compound();

// Factory — fresh value each call.
ctx.attach("createId", () => crypto.randomUUID());
assert(ctx.components.createId() !== ctx.components.createId());

// Lazy — computed once, cached.
ctx.attach("getId", lazy(() => crypto.randomUUID()));
assert(ctx.components.getId() === ctx.components.getId());
```
