[← Back to Index](../../index.md#1-registration)

# Registration — Open Generics

> **Part I** | **Question: Registration** | *Article 8*

---

Open generics cannot be implemented in TypeScript: generic type arguments are erased at compile time, so there is no runtime reification. A container cannot take an open definition like `Repository<T>` and close it into `Repository<User>` automatically.

In `compound`, attach each concrete component explicitly instead.
