# Replit Database Client (Deno)

[⚖️ MIT](./LICENSE.md)
[![CodeFactor Grade](https://img.shields.io/codefactor/grade/github/hugoalh-studio/replit-database-client-deno?label=Grade&logo=codefactor&logoColor=ffffff&style=flat-square "CodeFactor Grade")](https://www.codefactor.io/repository/github/hugoalh-studio/replit-database-client-deno)

|  | **Release - Latest** | **Release - Pre** |
|:-:|:-:|:-:|
| [![GitHub](https://img.shields.io/badge/GitHub-181717?logo=github&logoColor=ffffff&style=flat-square "GitHub")](https://github.com/hugoalh-studio/replit-database-client-deno) | ![GitHub Latest Release Version](https://img.shields.io/github/release/hugoalh-studio/replit-database-client-deno?sort=semver&label=&style=flat-square "GitHub Latest Release Version") (![GitHub Latest Release Date](https://img.shields.io/github/release-date/hugoalh-studio/replit-database-client-deno?label=&style=flat-square "GitHub Latest Release Date")) | ![GitHub Latest Pre-Release Version](https://img.shields.io/github/release/hugoalh-studio/replit-database-client-deno?include_prereleases&sort=semver&label=&style=flat-square "GitHub Latest Pre-Release Version") (![GitHub Latest Pre-Release Date](https://img.shields.io/github/release-date-pre/hugoalh-studio/replit-database-client-deno?label=&style=flat-square "GitHub Latest Pre-Release Date")) |

A Deno module of Replit Database client.

## 🌟 Feature

- Additional functions to reduce the amount of the database operations.
- Better database operations with [exFetch](https://github.com/hugoalh-studio/exfetch-deno).

## 🔰 Begin

### Deno

- **Target Version:** >= v1.35.0
- **Require Permission:**
  - **Environment (`allow-env`):**
    - `REPLIT_DB_URL`
  - **Network (`allow-net`):**
    - `kv.replit.com`
- **Domain/Registry:**
  - DenoPKG
    ```ts
    import ... from "https://denopkg.com/hugoalh-studio/replit-database-client-deno[@<Tag>]/mod.ts";
    ```
  - GitHub Raw *\[Require Tag\]*
    ```ts
    import ... from "https://raw.githubusercontent.com/hugoalh-studio/replit-database-client-deno/<Tag>/mod.ts";
    ```
  - Pax
    ```ts
    import ... from "https://pax.deno.dev/hugoalh-studio/replit-database-client-deno[@<Tag>]/mod.ts";
    ```

> **ℹ️ Notice:** Although it is recommended to import main module with path `mod.ts` in general, it is also able to import part of the module with sub path if available, but do not import if:
>
> - it's file path has an underscore prefix (e.g.: `_foo.ts`, `_util/bar.ts`), or
> - it is a benchmark or test file (e.g.: `foo.bench.ts`, `foo.test.ts`), or
> - it's symbol has an underscore prefix (e.g.: `export function _baz() {}`).
>
> These elements are not considered part of the public API, thus no stability is guaranteed for them.

## 🧩 API

- ```ts
  class ReplitDatabaseClient {
    constructor(options: ReplitDatabaseClientOptions = {}): ReplitDatabaseClient;
    clear(): Promise<void>;
    delete(key: string): Promise<void>;
    delete(keys: string[]): Promise<void>;
    delete(...keys: string[]): Promise<void>;
    entries(keysFilter: string | RegExp | ((key: string) => boolean) = ""): Promise<IterableIterator<[string, JSONValue]>>;
    get(key: string): Promise<JSONValue | undefined>;
    has(key: string): Promise<boolean>;
    keys(filter: string | RegExp | ((key: string) => boolean) = ""): Promise<string[]>;
    list(keysFilter: string | RegExp | ((key: string) => boolean) = ""): Promise<Map<string, JSONValue>>;
    set(key: string, value: JSONValue): Promise<void>;
    set(table: { [key: string]: JSONValue; } | Map<string, JSONValue> | Record<string, JSONValue>): Promise<void>;
    get size(): Promise<number>;
    values(keysFilter: string | RegExp | ((key: string) => boolean) = ""): Promise<IterableIterator<JSONValue>>;
  }
  ```
- ```ts
  interface ReplitDatabaseClientOptions extends Pick<ExFetchOptions, "retry" | "timeout" | "userAgent"> {
    /**
     * For batch/bulk operations (e.g.: delete and/or set multiple entries), when one of the operation is fail/fatal/reject, whether to await for all of the operations are all settled and then throw the `AggregateError` (stack of errors), instead of ignore remain operations and throw the error of the current operation.
     * @default false
     */
    allSettled?: boolean;
    /**
     * Custom database URL.
     * @default undefined
     */
    url?: string | URL;
  }
  ```

> **ℹ️ Notice:** Documentation is included inside the script file, can view it via:
>
> - [Deno CLI `deno doc`](https://deno.land/manual/tools/documentation_generator)
> - [Deno Doc Land](https://doc.deno.land)

## ✍️ Example

- ```ts
  import { ReplitDatabaseClient } from "https://raw.githubusercontent.com/hugoalh-studio/replit-database-client-deno/main/mod.ts";
  const db = new ReplitDatabaseClient();

  await db.set("foo", "bar");
  //=> void

  await db.get("foo");
  //=> "bar"

  await db.get("bar");
  //=> undefined
  ```
