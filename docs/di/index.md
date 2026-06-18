# Summa de Injectione Dependentiarum

> *Summa of Dependency Injection*

*A comprehensive compendium of DI library features to be implemented by simply building a big object.*

## [Preface](preface.md)

## Part I

### I. Registration

- [Basic](part-i/01-registration/01-basic.md)
- [Instance Registration](part-i/01-registration/02-instance.md)
- [Multiple Registrations](part-i/01-registration/03-multiple.md)
- [Delegate / Factory](part-i/01-registration/04-delegate-factory.md)
- [Lazy / Deferred](part-i/01-registration/05-lazy-deferred.md)
- [Conditional Registration, Profiles & Feature Flags](part-i/01-registration/06-conditional.md)
- [Self & Circular Dependencies](part-i/01-registration/07-self-circular.md)
- [Open Generics](part-i/01-registration/08-open-generics.md)
- [Validation at Startup](part-i/01-registration/09-validation.md)

### II. Metadata

- [Named / Keyed Registration](part-i/02-metadata/01-named-keyed.md)
- [Metadata](part-i/02-metadata/02-metadata.md)
- [Convention-Based Registration](part-i/02-metadata/03-convention-based.md)
- [Decorator-Based Registration](part-i/02-metadata/04-decorators.md)
- [Modules](part-i/02-metadata/05-modules.md)

### III. Lifetimes

- [Singleton](part-i/03-lifetimes/01-singleton.md)
- [Transient](part-i/03-lifetimes/02-transient.md)
- [Scoped](part-i/03-lifetimes/03-scoped.md)

### IV. Scopes

- [Custom Scopes](part-i/04-scopes/01-custom-scopes.md)
- [Nested Scopes](part-i/04-scopes/02-nested-scopes.md)
- [Scope-Based Disposal](part-i/04-scopes/03-scope-disposal.md)

### V. Child Containers

- [Child Containers](part-i/05-child-containers/01-child-containers.md)
- [Overriding Registrations](part-i/05-child-containers/02-overriding-registrations.md)
- [Isolation Patterns](part-i/05-child-containers/03-isolation.md)

### VI. Request Scoping

- [Web-Request Scope](part-i/06-request-scoping/01-web-request.md)
- [Ambient Scope](part-i/06-request-scoping/02-ambient-scope.md)
- [Async Scope](part-i/06-request-scoping/03-async-scope.md)

### VII. Resolution

- [Basic Resolution](part-i/07-resolution/01-basic.md)
- [Multi Resolution](part-i/07-resolution/02-multiple.md)
- [Named / Keyed Resolution](part-i/07-resolution/03-named-keyed.md)
- [Service Locator](part-i/07-resolution/04-service-locator.md)

### VIII. Injection

- [Constructor Injection](part-i/08-injection/01-constructor.md)
- [Field Injection](part-i/08-injection/02-field.md)
- [Property Injection](part-i/08-injection/03-property.md)
- [Method Injection](part-i/08-injection/04-method.md)

### IX. Container

- [Disposable](part-i/09-container/01-disposable.md)
- [Events](part-i/09-container/02-events.md)
- [Decorators](part-i/09-container/03-decorators.md)
- [Interception / AOP](part-i/09-container/04-interception.md)

## Part II

### I. Performance

- [Resolution Trade-Offs](part-ii/01-performance/01-resolution-tradeoffs.md)
- [Memory Overhead](part-ii/01-performance/02-memory-overhead.md)

### II. Testing

- [Unit Tests](part-ii/02-testing/01-unit-tests.md)
- [Dependency Analysis](part-ii/02-testing/02-dependency-analysis.md)
