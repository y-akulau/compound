[← Back to Index](../../index.md#1-registration)

# Registration — Self & Circular Dependencies

> **Part I** | **Question: Registration** | *Article 7*

---

`compound` is designed to prevent circular dependencies. `attach` narrows the context only after its value argument has been evaluated, so that argument can use only the names attached earlier.

A cycle such as `A → B → A` cannot be wired directly: whichever component is constructed first has to read a name that does not exist yet. TypeScript reports the missing property.

```ts
// a.ts
import type { B } from "./b.js";

type Deps = Readonly<{ b: B }>;

export class A {
    private readonly b: B;

    public constructor(deps: Deps) {
        this.b = deps.b;
    }
}

// b.ts
import type { A } from "./a.js";

type Deps = Readonly<{ a: A }>;

export class B {
    private readonly a: A;

    public constructor(deps: Deps) {
        this.a = deps.a;
    }
}

// main.ts
import { SimpleCompound, type Compound } from "compound";

import { A } from "./a.js";

const app: SimpleCompound = new SimpleCompound();

app.attach("a", new A(app.components)); // Type error: `b` is missing
```

And then:

```ts
// main.ts
import { SimpleCompound, type Compound } from "compound";

import { A } from "./a.js";
import { B } from "./b.js";

const app: SimpleCompound = new SimpleCompound();

app.attach("b", new B(app.components)); // Type error: `a` is missing
app.attach("a", new A(app.components));
```

The error is the feature: dependency order is checked while wiring the object, not at runtime.

When a genuine cycle is unavoidable, move one side of it out of construction: pass a getter, inject later with a setter, or use another late-bound reference. These are deliberate escapes from the normal type-checked order.

## Setter after construction

Attach `A` without `B`, build `B` from `A`, attach `B`, then link `B` into `A` with a setter. The link is completed before application code starts using the compound.

```ts
// a.ts
import type { B } from "./b.js";

type Deps = Readonly<{}>;

export class A {
    private b?: B;

    public constructor(_deps: Deps) {}

    public setB(b: B): void {
        this.b = b;
    }
}

// b.ts
import type { A } from "./a.js";

type Deps = Readonly<{ a: A }>;

export class B {
    private readonly a: A;

    public constructor(deps: Deps) {
        this.a = deps.a;
    }
}

// main.ts
import { SimpleCompound, type Compound } from "compound";

import { A } from "./a.js";
import { B } from "./b.js";

const app: SimpleCompound = new SimpleCompound();

app.attach("a", new A(app.components));
app.attach("b", new B(app.components));
app.components.a.setB(app.components.b);
```

A mutable holder works the same way: attach the holder early, attach both services, then fill the holder after both values exist.

```ts
// provider.ts
const provider = <T>() => {
    let value: T;
    let initialized = false;

    return {
        provide: (newValue: T): void => {
            value = newValue;
            initialized = true;
        },
        resolve: (): T => {
            if (!initialized) throw new Error("Value is not provided");
            return value;
        },
    };
}

// a.ts
import type { B } from "./b.js";

type Deps = Readonly<{
    resolveB: () => B;
}>;

export class A {
    private readonly resolveB: () => B;

    public constructor(deps: Deps) {
        this.resolveB = deps.resolveB;
    }

    // ...

    public foo(): void {
        // ...
    }

    public bar(): void {
        this.resolveB().baz();
    }
}

// b.ts
import type { A } from "./a.js";

type Deps = Readonly<{
    a: A;
}>;

export class B {
    private readonly a: A;

    public constructor(deps: Deps) {
        this.a = deps.a;
    }

    // ...

    public baz(): void {
        this.a.bar();
    }
}

// main.ts
import { SimpleCompound, type Compound } from "compound";

import { A } from "./a.js";
import { B } from "./b.js";
import { Holder } from "./holder.js";

const app: SimpleCompound = new SimpleCompound();

const b = provider<B>();

app.attach("resolveB", b.resolve);
app.attach("a", new A(app.components));
app.attach("b", new B(app.components));
b.provide(app.components.b);
```

## Proxy

Last resort, hard mode: when an existing constructor insists on receiving a concrete `B` during construction, pass a `Proxy` that forwards calls to a target resolved later.

```ts
// utils/lateinit.ts
export const lateinit = <T extends object>() => {
    let value: T;
    let initialized = false;

    return {
        value: new Proxy({} as T, {
            get: (_object, property) => {
                if (!initialized) throw new Error("Lateinit is not initialized");

                const result = Reflect.get(value, property, value);
                return typeof result === "function" ? result.bind(value) : result;
            },
            set: (_object, property, next) => {
                if (!initialized) throw new Error("Lateinit is not initialized");

                return Reflect.set(value, property, next, value);
            },
            // ...
        }),
        init: (newValue) => {
            if (initialized) throw new Error("Lateinit is already initialized");

            value = newValue;
            initialized = true;
        }
    };
};

// main.ts
import { SimpleCompound, type Compound } from "compound";

import { A } from "./a.js";
import { B } from "./b.js";
import { Lateinit } from "./utils/lateinit.js";

const app: SimpleCompound = new SimpleCompound();

const late: typeof app = app.derive();
const b = lateinit<B>();
late.attach("b", b.value);
app.attach("a", new A(late.components));

app.attach("b", new B(app.components));
b.init(app.components.b);
```

The proxy preserves the declared interface, binds method calls to the resolved target, and throws if used too early. Its identity is still different from the target, so identity checks, `Object.keys`, and APIs that inspect own properties are fragile.
