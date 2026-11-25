[← Back to Index](../../index.md#2-metadata)

# Metadata — Named / Keyed Registration

> **Part I** | **Question: Metadata** | *Article 1*

---

In container-based DI, named or keyed registration lets you register several implementations of the same abstraction and select one by a name or key at resolve time.

## Different keys

In `compound`, the component name is already the key. Attach each implementation under its own name.

```ts
// app/email-sender.ts
export interface IEmailSender {
    send(to: string, body: string): Promise<void>;
}
```

```ts
// app/notifier.ts
import type { IEmailSender } from "./email-sender.js";

export class Notifier {
    private readonly deps: Deps;

    public constructor(deps: Readonly<{
        smtp: IEmailSender,
        sendGrid: IEmailSender,
    }>) {
        this.deps = deps;
    }

    public async notify(to: string, body: string): Promise<void> {
        try {
            await this.deps.smtp.send(to, body);
        } catch {
            await this.deps.sendGrid.send(to, body);
        }
    }
}
```

```ts
// main.ts
import { SimpleCompound } from "compound";

import { Notifier } from "./app/notifier.js";
import { SendGrid } from "./infra/email/send-grid.js";
import { Smtp } from "./infra/email/smtp.js";

const ctx: SimpleCompound = new SimpleCompound();

ctx.attach("smtp", new Smtp("smtp://localhost"));
ctx.attach("sendGrid", new SendGrid("SG.xxx"));

ctx.attach("notifier", new Notifier(ctx.components));
```

## Symbols

String names work well for app-local composition. A symbol is useful when a key is owned by a module and should not collide with app names or other modules.

```ts
// mqtt/client.ts
export interface MqttConfig {
    readonly url: string;
}

export const MQTT_CONFIG = Symbol("mqtt.config");

type Deps = Readonly<{
    [MQTT_CONFIG]: MqttConfig;
}>;

export class MqttClient {
    private readonly deps: Deps;

    public constructor(deps: Deps) {
        this.deps = deps;
    }

    public async connect(): Promise<void> {
        const { url } = this.deps[MQTT_CONFIG];
        // ...
    }
}
```

```ts
// mqtt/module.ts
import type { Compound } from "compound";

import { MQTT_CONFIG, MqttClient, type MqttConfig } from "./client.js";

type Deps = Readonly<{
    [MQTT_CONFIG]: MqttConfig;
}>;

export const MqttModule = (deps: Compound<Deps>) => {
    const ctx = deps.derive();

    ctx.attach("client", new MqttClient(ctx.components));

    return ctx.getOwnComponents();
};
```

```ts
// main.ts
import { SimpleCompound } from "compound";

import { MQTT_CONFIG } from "./mqtt/client.js";
import { MqttModule } from "./mqtt/module.js";

const ctx: SimpleCompound = new SimpleCompound();

ctx.attach(MQTT_CONFIG, { url: "mqtt://localhost:1883" });
ctx.attach("mqtt", MqttModule(ctx.components));

await ctx.components.mqtt.client.connect();
```

The module owns `MQTT_CONFIG`, so the caller provides that exact key.
