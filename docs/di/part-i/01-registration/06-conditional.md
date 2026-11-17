[← Back to Index](../../index.md#1-registration)

# Registration — Conditional

> **Part I** | **Question: Registration** | *Article 6*

---

`compound` has no conditional registration API. `attach` is an assignment, so a condition is ordinary control flow around that assignment.

## Conditional

A short choice can be written directly in the `attach` call.

```ts
import { compound } from "compound";

import { SendGrid } from "./infra/email/send-grid.js";
import { Smtp } from "./infra/email/smtp.js";

type EmailConfig =
    | { readonly provider: "smtp"; readonly url: string }
    | { readonly provider: "sendGrid"; readonly apiKey: string };

const ctx = compound();

ctx.attach("config", {
    email: {
        provider: "smtp",
        url: "smtp://localhost",
    } satisfies EmailConfig,
});

// ...

const emailConfig = ctx.config.email;
ctx.attach(
    "emailSender",
    emailConfig.provider === "smtp"
        ? new Smtp(emailConfig.url)
        : new SendGrid(emailConfig.apiKey),
);
```

Or with `if` statement:

```ts
const emailConfig = ctx.config.email;
if (emailConfig.provider === "smtp") {
    ctx.attach("emailSender", new Smtp(emailConfig.url));
} else {
    ctx.attach("emailSender", new SendGrid(emailConfig.apiKey));
}
```

## Factories

A factory can hold more complex selection logic; `attach` still receives one final value under a stable name.

```ts
// infra/email/config.ts
export type EmailConfig =
    | { readonly provider: "smtp"; readonly url: string }
    | { readonly provider: "sendGrid"; readonly apiKey: string };
```

```ts
// infra/email/factory.ts
import type { IEmailSender } from "../../app/email.js";
import { SendGrid } from "./send-grid.js";
import { Smtp } from "./smtp.js";

import type { EmailConfig } from "./config.js";

type EmailSenderDeps = Readonly<{
    config: Readonly<{
        email: EmailConfig;
    }>;
}>;

export const createEmailSender = (deps: EmailSenderDeps): IEmailSender => {
    const email = deps.config.email;
    switch (email.provider) {
        case "smtp":
            return new Smtp(email.url);
        case "sendGrid":
            return new SendGrid(email.apiKey);
    }
};
```

```ts
// main.ts
import { compound, type Compound } from "compound";

import { emailConfig } from "./infra/email/config.js";
import { createEmailSender } from "./infra/email/factory.js";

const ctx: Compound = compound();

ctx.attach("config", {
    email: {
        provider: "smtp",
        url: "smtp://localhost",
    } satisfies EmailConfig,
});

ctx.attach("emailSender", createEmailSender(ctx.components));
```

## Optional

Attach `undefined` and inject a dependency as an optional one. The name stays in the compound type with a value that tells consumers whether the dependency exists.

```ts
// main.ts
import { compound, type Compound } from "compound";

import type { Metrics } from "./app/metrics.js";
import { CloudMetrics } from "./infra/cloud-metrics.js";

const ctx: Compound = compound();

ctx.attach("config", {
    metrics: true
});

// ...

ctx.attach("metrics", ctx.config.metrics ? new CloudMetrics() : undefined);

// ...

type HandlerDeps = Readonly<{
    metrics?: Metrics;
}>;

const createHandler = (deps: HandlerDeps): Handler => {
    return (request) => {
        void deps.metrics?.flush();

        // ...
    };
};

ctx.attach("handler", createHandler(ctx.components));
```

Or alternatively use `null object`:

```ts
const noMetrics: Metrics = {
    flush: () => Promise.resolve();
};

ctx.attach("metrics", ctx.config.metrics ? new CloudMetrics() : noMetrics);
```
