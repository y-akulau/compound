import { describe, expectTypeOf, it } from "vitest";

import type { ComponentsOf, OwnComponentsOf } from "./compound";
import type { DerivedCompoundFrom } from "./derived";
import { SimpleCompound } from "./simple";

describe("ComponentsOf", () => {
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

describe("OwnComponentsOf", () => {
    it("should infer own components of SimpleCompound", () => {
        const c: SimpleCompound = new SimpleCompound();
        c.attach("a", 10);
        c.attach("b", 20);

        expectTypeOf<OwnComponentsOf<typeof c>>().toEqualTypeOf<
            { a: 10 } & { b: 20 }
        >();
    });

    it("should infer own components of DerivedCompound", () => {
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
