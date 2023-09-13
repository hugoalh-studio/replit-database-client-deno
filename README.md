# Replit Database Client (Deno)

[⚖️ MIT](./LICENSE.md)
[![CodeFactor Grade](https://img.shields.io/codefactor/grade/github/hugoalh-studio/replit-database-client-deno?label=Grade&logo=codefactor&logoColor=ffffff&style=flat-square "CodeFactor Grade")](https://www.codefactor.io/repository/github/hugoalh-studio/replit-database-client-deno)

|  | **Heat** | **Release - Latest** | **Release - Pre** |
|:-:|:-:|:-:|:-:|
| [![GitHub](https://img.shields.io/badge/GitHub-181717?logo=github&logoColor=ffffff&style=flat-square "GitHub")](https://github.com/hugoalh-studio/replit-database-client-deno) | [![GitHub Stars](https://img.shields.io/github/stars/hugoalh-studio/replit-database-client-deno?label=&logoColor=ffffff&style=flat-square "GitHub Stars")](https://github.com/hugoalh-studio/replit-database-client-deno/stargazers) \| ![GitHub Total Downloads](https://img.shields.io/github/downloads/hugoalh-studio/replit-database-client-deno/total?label=&style=flat-square "GitHub Total Downloads") | ![GitHub Latest Release Version](https://img.shields.io/github/release/hugoalh-studio/replit-database-client-deno?sort=semver&label=&style=flat-square "GitHub Latest Release Version") (![GitHub Latest Release Date](https://img.shields.io/github/release-date/hugoalh-studio/replit-database-client-deno?label=&style=flat-square "GitHub Latest Release Date")) | ![GitHub Latest Pre-Release Version](https://img.shields.io/github/release/hugoalh-studio/replit-database-client-deno?include_prereleases&sort=semver&label=&style=flat-square "GitHub Latest Pre-Release Version") (![GitHub Latest Pre-Release Date](https://img.shields.io/github/release-date-pre/hugoalh-studio/replit-database-client-deno?label=&style=flat-square "GitHub Latest Pre-Release Date")) |

A Deno module of Replit Database client.

## 🌟 Feature

- Additional functions to reduce the amount of the database operations.
- Better database operations with [`hugoalh-studio/exfetch-deno`](https://github.com/hugoalh-studio/exfetch-deno).

## 🔰 Begin

### Deno

- **Target Version:** >= v1.35.0
- **Require Permission:**
  - **`allow-env` (Allow Environment Variables):**
    - `REPLIT_DB_URL`
  - **`allow-net` (Allow Network Addresses):**
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
    entries(keysPrefix: string = ""): Promise<IterableIterator<[string, JsonValue]>>;
    entries(keysFilter: RegExp): Promise<IterableIterator<[string, JsonValue]>>;
    get(key: string): Promise<JsonValue | undefined>;
    has(key: string): Promise<boolean>;
    keys(prefix: string = ""): Promise<string[]>;
    keys(filter: RegExp): Promise<string[]>;
    list(keysPrefix: string = ""): Promise<Map<string, JsonValue>>;
    list(keysFilter: RegExp): Promise<Map<string, JsonValue>>;
    set(key: string, value: JsonValue): Promise<void>;
    set(table: Map<string, JsonValue> | Record<string, JsonValue>): Promise<void>;
    get size(): Promise<number>;
    values(keysPrefix: string = ""): Promise<IterableIterator<JsonValue>>;
    values(keysFilter: RegExp): Promise<IterableIterator<JsonValue>>;
  }
  ```
- ```ts
  interface ReplitDatabaseClientOptions extends Pick<ExFetchOptions, "event" | "retry" | "timeout" | "userAgent"> {
    /**
     * For operations of batch/bulk delete, batch/bulk set, and clear, whether to await for all of the operations are all settled (resolved or rejected) instead of ignore remain operations when any of the operation is fail/reject.
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
