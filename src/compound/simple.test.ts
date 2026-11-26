import { describe, expect, it } from "vitest";

import { ComponentAlreadyAttached } from "./compound";
import { SimpleCompound } from "./simple";

describe("SimpleCompound", () => {
    it("should attach a component", () => {
        const c: SimpleCompound = new SimpleCompound();

        c.attach("a", 10);

        expect(c.components.a).toBe(10);
    });

    it("should attach a dependent component", () => {
        const createB = (deps: Readonly<{ a: number }>) => {
            return deps.a + 1;
        };

        const c: SimpleCompound = new SimpleCompound();

        c.attach("a", 10);
        c.attach("b", createB(c.components));

        expect(c.components.b).toBe(11);
    });

    it("should not allow to override a component", () => {
        const c: SimpleCompound = new SimpleCompound();

        c.attach("a", 10);
        expect(() => {
            // @ts-expect-error
            c.attach("a", "10");
        }).toThrow(ComponentAlreadyAttached);

        expect(c.components.a).toBe(10);
    });

    it("should attach components conditionally", () => {
        for (const condition of [true, false]) {
            const c: SimpleCompound = new SimpleCompound();
            if (condition) {
                c.attach("a", 10);
            } else {
                c.attach("a", "20");
            }

            expect(c.components.a).toBe(condition ? 10 : "20");
        }
    });
});
