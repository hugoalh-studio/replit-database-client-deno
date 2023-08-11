# Replit Database Client (Deno)

[![License](https://img.shields.io/badge/License-MIT-808080?style=flat-square "License")](./LICENSE.md)

|  | **Heat** | **Release - Latest** | **Release - Pre** |
|:-:|:-:|:-:|:-:|
| [![GitHub](https://img.shields.io/badge/GitHub-181717?logo=github&logoColor=ffffff&style=flat-square "GitHub")](https://github.com/hugoalh-studio/replit-database-client-deno) | [![GitHub Stars](https://img.shields.io/github/stars/hugoalh-studio/replit-database-client-deno?label=&logoColor=ffffff&style=flat-square "GitHub Stars")](https://github.com/hugoalh-studio/replit-database-client-deno/stargazers) \| ![GitHub Total Downloads](https://img.shields.io/github/downloads/hugoalh-studio/replit-database-client-deno/total?label=&style=flat-square "GitHub Total Downloads") | ![GitHub Latest Release Version](https://img.shields.io/github/release/hugoalh-studio/replit-database-client-deno?sort=semver&label=&style=flat-square "GitHub Latest Release Version") (![GitHub Latest Release Date](https://img.shields.io/github/release-date/hugoalh-studio/replit-database-client-deno?label=&style=flat-square "GitHub Latest Release Date")) | ![GitHub Latest Pre-Release Version](https://img.shields.io/github/release/hugoalh-studio/replit-database-client-deno?include_prereleases&sort=semver&label=&style=flat-square "GitHub Latest Pre-Release Version") (![GitHub Latest Pre-Release Date](https://img.shields.io/github/release-date-pre/hugoalh-studio/replit-database-client-deno?label=&style=flat-square "GitHub Latest Pre-Release Date")) |

A Deno module of Replit Database client.

## 🌟 Feature

- Additional functions to reduce the amount of the database operations.
- Better database operations with [`hugoalh-studio/exfetch-deno`](https://github.com/hugoalh-studio/exfetch-deno).

## 📓 Documentation

### Getting Started

- Deno >= v1.35.0
  - **`allow-env` (Allow Environment Variables):** `REPLIT_DB_URL`
  - **`allow-net` (Allow Network Addresses):** `kv.replit.com`

```ts
/* Either */
import { ... } from "<URL>";// Named Import
import * as replitDatabaseClient from "<URL>";// Namespace Import
import ReplitDatabaseClient from "<URL>";// Default Import (Class `ReplitDatabaseClient`)
```

| **Domain / Registry** | **URL** |
|:-:|:--|
| Deno Land | *N/A* |
| DenoPKG | `https://denopkg.com/hugoalh-studio/replit-database-client-deno[@<Tag>]/mod.ts` |
| GitHub Raw **\*** | `https://raw.githubusercontent.com/hugoalh-studio/replit-database-client-deno/<Tag>/mod.ts` |
| Pax | `https://pax.deno.dev/hugoalh-studio/replit-database-client-deno[@<Tag>]/mod.ts` |

**\*:** Must provide a tag.

### API

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
  interface ReplitDatabaseClientOptions extends Pick<ExFetchOptions, "event" | "timeout"> {
    /**
     * For operations of clear, and batch/bulk delete and set, whether to await for all of the operations are all settled (resolved or rejected) instead of ignore remain operations when any of the operation is rejected.
     * @default false
     */
    allSettled?: boolean;
    /**
     * Retry options.
     * @default {}
     */
    retry?: Omit<ExFetchRetryOptions, "condition">;
    /**
     * Custom database URL.
     * @default undefined
     */
    url?: string | URL;
  }
  ```

### Example

- ```ts
  const db = new ReplitDatabaseClient();
  
  await db.set("foo", "bar");
  //=> void
  
  await db.get("foo");
  //=> "bar"
  
  await db.get("bar");
  //=> undefined
  ```
