[← Back to Index](../../index.md#1-registration)

# Registration — Conditional

> **Part I** | **Question: Registration** | *Article 6*

---

`compound` has no conditional registration API. `attach` is an assignment, so a condition is ordinary control flow around that assignment.

## Conditional

A short choice can be written directly in the `attach` call.

```ts
import { SimpleCompound } from "compound";

import { SendGrid } from "./infra/email/send-grid.js";
import { Smtp } from "./infra/email/smtp.js";

type EmailConfig =
    | { readonly provider: "smtp"; readonly url: string }
    | { readonly provider: "sendGrid"; readonly apiKey: string };

const app: SimpleCompound = new SimpleCompound();

app.attach("config", {
    email: {
        provider: "smtp",
        url: "smtp://localhost",
    } satisfies EmailConfig,
});

// ...

const emailConfig = app.components.config.email;
app.attach(
    "emailSender",
    emailConfig.provider === "smtp"
        ? new Smtp(emailConfig.url)
        : new SendGrid(emailConfig.apiKey),
);
```

Or with `if` statement:

```ts
const emailConfig = app.components.config.email;
if (emailConfig.provider === "smtp") {
    app.attach("emailSender", new Smtp(emailConfig.url));
} else {
    app.attach("emailSender", new SendGrid(emailConfig.apiKey));
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
import { SimpleCompound, type Compound } from "compound";

import { emailConfig } from "./infra/email/config.js";
import { createEmailSender } from "./infra/email/factory.js";

const app: SimpleCompound = new SimpleCompound();

app.attach("config", {
    email: {
        provider: "smtp",
        url: "smtp://localhost",
    } satisfies EmailConfig,
});

app.attach("emailSender", createEmailSender(app.components));
```

## Optional

Attach `undefined` and inject a dependency as an optional one. The name stays in the compound type with a value that tells consumers whether the dependency exists.

```ts
// main.ts
import { SimpleCompound, type Compound } from "compound";

import type { Metrics } from "./app/metrics.js";
import { CloudMetrics } from "./infra/cloud-metrics.js";

const app: SimpleCompound = new SimpleCompound();

app.attach("config", {
    metrics: true
});

// ...

app.attach("metrics", app.components.config.metrics ? new CloudMetrics() : undefined);

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

app.attach("handler", createHandler(app.components));
```

Or alternatively use `null object`:

```ts
const noMetrics: Metrics = {
    flush: () => Promise.resolve();
};

app.attach("metrics", app.components.config.metrics ? new CloudMetrics() : noMetrics);
```
