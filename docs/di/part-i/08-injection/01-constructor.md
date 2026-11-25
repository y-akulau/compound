[← Back to Index](../../index.md#8-injection)

# Injection — Constructor

> **Part I** | **Question: Injection** | *Article 1*

---

## Constructors

Constructor injection passes dependencies when the object is created. In `compound`, this is the default: construct the component with the dependencies it needs, then `attach` the result.

You should design your classes constructor parameters as an options object to benefit from the object slicing.

```ts
// app/user-service.ts
import type { IUserRepository } from "../domain.js";
import type { IHasher } from "./hasher.js";

type Deps = Readonly<{
    userRepository: IUserRepository;
    hasher: IHasher;
}>;

export class UserService {
    constructor(private readonly deps: Deps) {}

    async register(email: string, password: string): Promise<void> {
        const passwordHash = await this.deps.hasher.hash(password);
        await this.deps.userRepository.add(email, passwordHash);
    }
}
```

```ts
// main.ts
import { compound } from "compound";

import { UserService } from "./app/user-service.js";
import { PostgresUserRepository } from "./infra/user-repository.js";
import { BcryptHasher } from "./infra/hasher.js";

const ctx = compound();

ctx.attach("userRepository", new PostgresUserRepository(ctx.components));
ctx.attach("hasher", new BcryptHasher());
ctx.attach("userService", new UserService(ctx.components));
```

## Functions

The dependency does not have to be a class. A factory function can receive the same dependencies at creation time.

```ts
// app/user-service.ts
import type { IUserRepository } from "../domain.js";
import type { IHasher } from "./hasher.js";

type Deps = Readonly<{
    userRepository: IUserRepository;
    hasher: IHasher;
}>;

export const createUserService = (deps: Deps) => ({
    async register(email: string, password: string): Promise<void> {
        const passwordHash = await deps.hasher.hash(password);
        await deps.userRepository.add(email, passwordHash);
    },
});
```

```ts
// main.ts
ctx.attach("userService", createUserService(ctx.components));
```
