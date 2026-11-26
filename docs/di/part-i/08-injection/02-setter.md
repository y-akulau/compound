[← Back to Index](../../index.md#8-injection)

# Injection — Setter

> **Part I** | **Question: Injection** | *Article 2*

---

Setter injection assigns a dependency after the object exists. Container frameworks often do this implicitly through reflection or decorators. `compound` has no runtime setter injection mechanism; assignment is plain code.

Consider using constructors, pal.

## Field

```ts
// app/user-service.ts
import type { ILogger } from "./logger.js";

export class UserService {
    public logger!: ILogger;

    public register(email: string): void {
        // NOTE: Dangerous -- this.logger can be missing.
        this.logger.info(`Registering ${email}`);
        // ...
    }
}
```

```ts
// main.ts
import { SimpleCompound } from "compound";

import { UserService } from "./app/user-service.js";
import { ConsoleLogger } from "./infra/console-logger.js";

const ctx: SimpleCompound = new SimpleCompound();

ctx.attach("logger", new ConsoleLogger(ctx.components));

ctx.attach("userService", new UserService(ctx.components));
ctx.components.userService.logger = ctx.components.logger;

```

## Property

The same idea through a setter:

```ts
export class UserService {
    private logger: ILogger | undefined;

    public set logger(logger: ILogger) {
        this.logger = logger;
    }
}
```

## Method call

Or through an initialization method:

```ts
export class UserService {
    private logger: ILogger | undefined;

    public setLogger(logger: ILogger): void {
        this.logger = logger;
    }
}
```
