# Replit Database Client (Deno)

![License](https://img.shields.io/static/v1?label=License&message=MIT&style=flat-square "License")
[![GitHub Repository](https://img.shields.io/badge/Repository-181717?logo=github&logoColor=ffffff&style=flat-square "GitHub Repository")](https://github.com/hugoalh-studio/replit-database-client-deno)
[![GitHub Stars](https://img.shields.io/github/stars/hugoalh-studio/replit-database-client-deno?label=Stars&logo=github&logoColor=ffffff&style=flat-square "GitHub Stars")](https://github.com/hugoalh-studio/replit-database-client-deno/stargazers)
[![GitHub Contributors](https://img.shields.io/github/contributors/hugoalh-studio/replit-database-client-deno?label=Contributors&logo=github&logoColor=ffffff&style=flat-square "GitHub Contributors")](https://github.com/hugoalh-studio/replit-database-client-deno/graphs/contributors)
[![GitHub Issues](https://img.shields.io/github/issues-raw/hugoalh-studio/replit-database-client-deno?label=Issues&logo=github&logoColor=ffffff&style=flat-square "GitHub Issues")](https://github.com/hugoalh-studio/replit-database-client-deno/issues)
[![GitHub Pull Requests](https://img.shields.io/github/issues-pr-raw/hugoalh-studio/replit-database-client-deno?label=Pull%20Requests&logo=github&logoColor=ffffff&style=flat-square "GitHub Pull Requests")](https://github.com/hugoalh-studio/replit-database-client-deno/pulls)
[![GitHub Discussions](https://img.shields.io/github/discussions/hugoalh-studio/replit-database-client-deno?label=Discussions&logo=github&logoColor=ffffff&style=flat-square "GitHub Discussions")](https://github.com/hugoalh-studio/replit-database-client-deno/discussions)
[![CodeFactor Grade](https://img.shields.io/codefactor/grade/github/hugoalh-studio/replit-database-client-deno?label=Grade&logo=codefactor&logoColor=ffffff&style=flat-square "CodeFactor Grade")](https://www.codefactor.io/repository/github/hugoalh-studio/replit-database-client-deno)

| **Releases** | **Latest** (![GitHub Latest Release Date](https://img.shields.io/github/release-date/hugoalh-studio/replit-database-client-deno?label=&style=flat-square "GitHub Latest Release Date")) | **Pre** (![GitHub Latest Pre-Release Date](https://img.shields.io/github/release-date-pre/hugoalh-studio/replit-database-client-deno?label=&style=flat-square "GitHub Latest Pre-Release Date")) |
|:-:|:-:|:-:|
| [![GitHub](https://img.shields.io/badge/GitHub-181717?logo=github&logoColor=ffffff&style=flat-square "GitHub")](https://github.com/hugoalh-studio/replit-database-client-deno/releases) ![GitHub Total Downloads](https://img.shields.io/github/downloads/hugoalh-studio/replit-database-client-deno/total?label=&style=flat-square "GitHub Total Downloads") | ![GitHub Latest Release Version](https://img.shields.io/github/release/hugoalh-studio/replit-database-client-deno?sort=semver&label=&style=flat-square "GitHub Latest Release Version") | ![GitHub Latest Pre-Release Version](https://img.shields.io/github/release/hugoalh-studio/replit-database-client-deno?include_prereleases&sort=semver&label=&style=flat-square "GitHub Latest Pre-Release Version") |

## 📝 Description

A Deno module of Replit Database client.

### 🌟 Feature

- Additional functions to reduce database operations.
- Support retries when exceed the rate limits.

## 📚 Documentation

### Getting Started

- Deno >= v1.35.0
  - **`allow-env` (Allow Environment Variables):** `REPLIT_DB_URL`
  - **`allow-net` (Allow Network Addresses):** *All*

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

#### Class

- ```ts
  new ReplitDatabaseClient(options: ReplitDatabaseClientOptions = {}): ReplitDatabaseClient;
    .clear(): Promise<void>;
    .delete(key: string): Promise<void>;
    .delete(keys: string[]): Promise<void>;
    .delete(...keys: string[]): Promise<void>;
    .entries(keysPrefix: string = ""): Promise<IterableIterator<[string, JsonValue]>>;
    .entries(keysFilter: RegExp): Promise<IterableIterator<[string, JsonValue]>>;
    .get(key: string): Promise<JsonValue | undefined>;
    .has(key: string): Promise<boolean>;
    .keys(prefix: string = ""): Promise<string[]>;
    .keys(filter: RegExp): Promise<string[]>;
    .list(keysPrefix: string = ""): Promise<Map<string, JsonValue>>;
    .list(keysFilter: RegExp): Promise<Map<string, JsonValue>>;
    .set(key: string, value: JsonValue): Promise<void>;
    .set(table: Map<string, JsonValue> | Record<string, JsonValue>): Promise<void>;
    .size: Promise<number>;
    .values(keysPrefix: string = ""): Promise<IterableIterator<JsonValue>>;
    .values(keysFilter: RegExp): Promise<IterableIterator<JsonValue>>;
  ```

#### Interface / Type

- ```ts
  interface ReplitDatabaseClientOptions {
    allSettled: boolean = false;// For operations of clear, and batch/bulk delete and set, whether to await for all of the operations are all settled (resolved or rejected) instead of ignore remain operations when any of the operation is rejected.
    retry: number = 1;// Whether to retry when exceed the rate limits.
    url?: string | URL;// Custom database URL.
  }
  ```

### Example

- ```ts
  const db = new ReplitDatabaseClient();
  await db.set("foo", "bar");
  await db.get("foo");//=> "bar"
  await db.get("bar");//=> undefined
  ```
