const stringifyPropertyKey = (key: PropertyKey): string =>
    key === "string" ? `"${key}"` : String(key);

export const readonly = <T extends object>(target: T): Readonly<T> => {
    return new Proxy(target, {
        set(_object, property, _value, _receiver) {
            throw new TypeError(
                `Cannot assign to read-only property "${stringifyPropertyKey(property)}"`,
            );
        },
        deleteProperty(_object, property) {
            throw new TypeError(
                `Cannot delete read-only property "${stringifyPropertyKey(property)}"`,
            );
        },
        defineProperty(_object, property, _descriptor) {
            throw new TypeError(
                `Cannot define property "${stringifyPropertyKey(property)}" on a read-only object`,
            );
        },
        setPrototypeOf(_object, _value) {
            throw new TypeError(
                `Cannot change prototype of a read-only object`,
            );
        },
    }) as Readonly<T>;
};
