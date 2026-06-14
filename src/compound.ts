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
    ): asserts this is Compound<C & Record<N, C>>;

    derive(): Compound<T>;
}

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

    derive(): Compound<T> {
        return new DerivedCompound(this.components);
    }
}

export class DerivedCompound<B extends Components, T extends Components = {}>
    implements Compound<B & T>
{
    #components;

    #reader;
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

    derive(): Compound<B & T> {
        return new DerivedCompound(this.components);
    }
}

export const compound = (): Compound => new SimpleCompound();
