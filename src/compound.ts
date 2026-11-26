import { readonly } from "./utils/readonly";

export type ComponentName = string | symbol;
export namespace ComponentName {
    export const stringify = (name: ComponentName): string =>
        typeof name === "string" ? `"${name}"` : name.toString();
}

export type Components = Record<ComponentName, unknown>;

type Unique<T, N> = N extends keyof T ? never : N;

export interface Compound<T extends Components = {}> {
    readonly components: Readonly<T>;

    attach<const N extends ComponentName, const C>(
        name: Unique<T, N>,
        component: C,
    ): asserts this is Compound<T & Record<N, C>>;

    derive(): DerivedCompound<T>;
}

export type ComponentsOf<C extends Compound> =
    C extends Compound<infer T> ? T : never;

export class ComponentAlreadyAttached extends Error {
    constructor(name: ComponentName) {
        super(
            `Component ${ComponentName.stringify(name)} is already attached and the compound cannot attach a new one`,
        );
    }
}

export class SimpleCompound<T extends Components = {}> implements Compound<T> {
    #components: Components = {};

    #reader = readonly(this.#components) as Readonly<T>;
    get components() {
        return this.#reader;
    }

    constructor() {
        Object.freeze(this);
    }

    attach<const N extends ComponentName, const C>(
        name: Unique<T, N>,
        component: C,
    ): asserts this is SimpleCompound<T & Record<N, C>> {
        if (Reflect.has(this.#components, name)) {
            throw new ComponentAlreadyAttached(name);
        }

        Object.defineProperty(this.#components, name, {
            value: component,
            writable: false,
            configurable: false,
            enumerable: true,
        });
    }

    derive(): DerivedCompound<T> {
        return new DerivedCompound(this.components);
    }
}

export class DerivedCompound<B extends Components, T extends Components = {}>
    implements Compound<B & T>
{
    #components: Components;

    #reader: Readonly<B & T>;
    get components() {
        return this.#reader;
    }

    constructor(components: Readonly<B>) {
        this.#components = Object.create(components) as Components;
        this.#reader = readonly(this.#components) as Readonly<B & T>;

        Object.freeze(this);
    }

    attach<const N extends ComponentName, const C>(
        name: Unique<B & T, N>,
        component: C,
    ): asserts this is DerivedCompound<B, T & Record<N, C>> {
        if (Reflect.has(this.#components, name)) {
            throw new ComponentAlreadyAttached(name);
        }

        Object.defineProperty(this.#components, name, {
            value: component,
            writable: false,
            configurable: false,
            enumerable: true,
        });
    }

    derive(): DerivedCompound<B & T> {
        return new DerivedCompound(this.components);
    }
}

export type DerivedCompoundFrom<C extends Compound> = DerivedCompound<
    ComponentsOf<C>
>;

export type OwnComponentsOf<C extends Compound> =
    C extends DerivedCompound<any, infer T>
        ? T
        : C extends SimpleCompound<infer T>
          ? T
          : never;
