import { readonly } from "../utils/readonly";
import type { Unique } from "../utils/unique";
import {
    ComponentAlreadyAttached,
    type ComponentName,
    type Components,
    type ComponentsOf,
    type Compound,
} from "./compound";

export class DerivedCompound<
    B extends Components = {},
    T extends Components = {},
> implements Compound<B & T>
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
