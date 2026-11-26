import type { Unique } from "../utils/unique";
import type { DerivedCompound } from "./derived";
import type { SimpleCompound } from "./simple";

export type ComponentName = string | symbol;
export namespace ComponentName {
    export const stringify = (name: ComponentName): string =>
        typeof name === "string" ? `"${name}"` : name.toString();
}

export type Components = Record<ComponentName, unknown>;

export type ComponentsOf<C extends Compound> =
    C extends Compound<infer T> ? T : never;

export type OwnComponentsOf<C extends Compound> =
    C extends DerivedCompound<any, infer T>
        ? T
        : C extends SimpleCompound<infer T>
          ? T
          : never;

export interface Compound<T extends Components = {}> {
    readonly components: Readonly<T>;

    attach<const N extends ComponentName, const C>(
        name: Unique<T, N>,
        component: C,
    ): asserts this is Compound<T & Record<N, C>>;

    derive(): DerivedCompound<T>;
}

export class ComponentAlreadyAttached extends Error {
    constructor(name: ComponentName) {
        super(
            `Component ${ComponentName.stringify(name)} is already attached and the compound cannot attach a new one`,
        );
    }
}
