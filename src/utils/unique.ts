export type Unique<T, N> = N extends keyof T ? never : N;
