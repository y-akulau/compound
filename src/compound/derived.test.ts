import { describe, expect, expectTypeOf, it } from "vitest";

import { ComponentAlreadyAttached } from "./compound";
import { DerivedCompound, type DerivedCompoundFrom } from "./derived";
import { SimpleCompound } from "./simple";

describe("DerivedCompound", () => {
    it("should derive from a simple compound", () => {
        const c: SimpleCompound = new SimpleCompound();

        c.attach("a", 10);

        const c1: DerivedCompoundFrom<typeof c> = c.derive();
        c1.attach("b", 20);

        expect(c1.components.a).toBe(10);
        expect(c1.components.b).toBe(20);

        const c2: DerivedCompoundFrom<typeof c> = c.derive();
        c2.attach("b", 30);

        expect(c2.components.a).toBe(10);
        expect(c2.components.b).toBe(30);
    });

    it("should derive from a derived compound", () => {
        const c: SimpleCompound = new SimpleCompound();

        c.attach("a", 10);

        const c1: DerivedCompoundFrom<typeof c> = c.derive();
        c1.attach("b", 20);

        expect(c1.components.a).toBe(10);
        expect(c1.components.b).toBe(20);

        const c2: DerivedCompoundFrom<typeof c1> = c1.derive();
        c2.attach("c", 30);

        expect(c2.components.a).toBe(10);
        expect(c2.components.b).toBe(20);
        expect(c2.components.c).toBe(30);
    });

    it("should derive from an object", () => {
        const c = { a: 10 };

        const c1: DerivedCompound<typeof c> = new DerivedCompound(c);
        c1.attach("b", 20);

        expect(c1.components.a).toBe(10);
        expect(c1.components.b).toBe(20);

        const c2: DerivedCompound<typeof c> = new DerivedCompound(c);
        c2.attach("b", 30);

        expect(c2.components.a).toBe(10);
        expect(c2.components.b).toBe(30);
    });

    it("should not allow to override a base component", () => {
        const c: SimpleCompound = new SimpleCompound();
        c.attach("a", 10);

        const c1: DerivedCompoundFrom<typeof c> = c.derive();
        expect(() => {
            // @ts-expect-error
            c1.attach("a", "10");
        }).toThrow(ComponentAlreadyAttached);

        expect(c1.components.a).toBe(10);
    });

    it("should attach components conditionally", () => {
        for (const condition of [true, false]) {
            const d: DerivedCompound = new DerivedCompound({});

            if (condition) {
                d.attach("a", 10);
            } else {
                d.attach("a", "20");
            }

            expect(d.components.a).toBe(condition ? 10 : "20");
        }
    });
});

describe("DerivedCompoundFrom", () => {
    it("should infer a DerivedCompound type from a compound that is derived", () => {
        const c: SimpleCompound = new SimpleCompound();
        c.attach("a", 10);

        const d: DerivedCompoundFrom<typeof c> = c.derive();

        expectTypeOf<typeof d>().toEqualTypeOf<DerivedCompound<{ a: 10 }>>();
    });
});
