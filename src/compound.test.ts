import { describe, expect, it } from "vitest";

import { ComponentAlreadyAttached, type Compound, compound } from "./compound";

describe("Simple compound", () => {
    it("should attach a component", () => {
        const c1: Compound = compound();

        c1.attach("a", 10);

        expect(c1.components.a).toBe(10);
    });

    it("should attach a dependent component", () => {
        const createB = (deps: Readonly<{ a: number }>) => {
            return deps.a + 1;
        };

        const c: Compound = compound();

        c.attach("a", 10);
        c.attach("b", createB(c.components));

        expect(c.components.b).toBe(11);
    });

    it("should not allow to override a component", () => {
        const c: Compound = compound();

        c.attach("a", 10);
        expect(() => {
            // @ts-expect-error
            c.attach("a", "10");
        }).toThrow(ComponentAlreadyAttached);

        expect(c.components.a).toBe(10);
    });
});

describe("Derived compound", () => {
    it("should derive from a base compound", () => {
        const c: Compound = compound();

        c.attach("a", 10);

        const c1: typeof c = c.derive();
        c1.attach("b", 20);

        expect(c1.components.a).toBe(10);
        expect(c1.components.b).toBe(20);

        const c2: typeof c = c.derive();
        c2.attach("b", 30);

        expect(c2.components.a).toBe(10);
        expect(c2.components.b).toBe(30);
    });

    it("should not allow to override a base component", () => {
        const c: Compound = compound();
        c.attach("a", 10);

        const c1: typeof c = c.derive();
        expect(() => {
            // @ts-expect-error
            c1.attach("a", "10");
        }).toThrow(ComponentAlreadyAttached);

        expect(c1.components.a).toBe(10);
    });
});
