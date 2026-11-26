import { readonly } from "../utils/readonly";
import type { Unique } from "../utils/unique";
import {
    ComponentAlreadyAttached,
    type ComponentName,
    type Components,
    type Compound,
} from "./compound";
import { DerivedCompound } from "./derived";

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
