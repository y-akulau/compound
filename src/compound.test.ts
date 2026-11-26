import { describe, expect, expectTypeOf, it } from "vitest";
import {
    ComponentAlreadyAttached,
    type ComponentsOf,
    type DerivedCompound,
    type DerivedCompoundFrom,
    type OwnComponentsOf,
    SimpleCompound,
} from "./compound";

describe("SimpleCompound", () => {
    it("should attach a component", () => {
        const c1: SimpleCompound = new SimpleCompound();

        c1.attach("a", 10);

        expect(c1.components.a).toBe(10);
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

    it("should attach component conditionally", () => {
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

describe("CompoundOf", () => {
    it("should infer components of SimpleCompound", () => {
        const c: SimpleCompound = new SimpleCompound();

        c.attach("a", 10);
        expectTypeOf<ComponentsOf<typeof c>>().toEqualTypeOf<{ a: 10 }>();

        c.attach("b", 20);
        expectTypeOf<ComponentsOf<typeof c>>().toEqualTypeOf<
            { a: 10 } & { b: 20 }
        >();
    });

    it("should infer components of DerivedCompound", () => {
        const c: SimpleCompound = new SimpleCompound();
        c.attach("a", 10);

        const d: DerivedCompoundFrom<typeof c> = c.derive();
        d.attach("b", 20);

        expectTypeOf<ComponentsOf<typeof d>>().toEqualTypeOf<
            { a: 10 } & { b: 20 }
        >();
    });
});

describe("DerivedCompound", () => {
    it("should derive from a base compound", () => {
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
});

describe("DerivedCompoundFrom", () => {
    it("should infer a DerivedCompound type from a Compound that is derived", () => {
        const c: SimpleCompound = new SimpleCompound();
        c.attach("a", 10);

        const d: DerivedCompoundFrom<typeof c> = c.derive();

        expectTypeOf<typeof d>().toEqualTypeOf<DerivedCompound<{ a: 10 }>>();
    });
});

describe("OwnComponentsOf", () => {
    it("should infer SimpleCompound own components", () => {
        const c: SimpleCompound = new SimpleCompound();
        c.attach("a", 10);
        c.attach("b", 20);

        expectTypeOf<OwnComponentsOf<typeof c>>().toEqualTypeOf<
            { a: 10 } & { b: 20 }
        >();
    });

    it("should infer DerivedCompound own components", () => {
        const c: SimpleCompound = new SimpleCompound();
        c.attach("a", 10);

        const d: DerivedCompoundFrom<typeof c> = c.derive();
        d.attach("b", 20);
        d.attach("c", 30);

        expectTypeOf<OwnComponentsOf<typeof d>>().toEqualTypeOf<
            { b: 20 } & { c: 30 }
        >();
    });
});
