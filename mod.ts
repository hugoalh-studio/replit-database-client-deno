import { ExFetch, userAgentDefault as exFetchUserAgentDefault, type ExFetchOptions } from "https://deno.land/x/exfetch@v0.3.1/exfetch.ts";
import { type JSONValue } from "https://raw.githubusercontent.com/hugoalh-studio/advanced-determine-deno/v0.7.0/is_json.ts";
/**
 * Replit Database client default user agent.
 */
export const userAgentDefault = `${exFetchUserAgentDefault} ReplitDatabaseClient/0.4.0`;
/**
 * Replit Database client options.
 */
export interface ReplitDatabaseClientOptions extends Pick<ExFetchOptions, "retry" | "timeout" | "userAgent"> {
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
type ReplitDatabaseClientKeysPredicateFunction = (key: string) => boolean;
/**
 * Replit Database is a simple, user-friendly key-value store inside of every Repl, every Repl can access and interact with its own unique Replit Database.
 */
export class ReplitDatabaseClient {
	#allSettled: boolean;
	#exFetch: ExFetch;
	#url: URL;
	/**
	 * Create a new Replit Database client instance.
	 * @param {ReplitDatabaseClientOptions} [options={}] Options.
	 */
	constructor(options: ReplitDatabaseClientOptions = {}) {
		this.#allSettled = options.allSettled ?? false;
		if (typeof options.url === "undefined") {
			try {
				this.#url = new URL(Deno.env.get("REPLIT_DB_URL") ?? "");
			} catch {
				throw new Error(`Unable to access environment variable \`REPLIT_DB_URL\`, or it's value is not a valid URL!`);
			}
			setInterval((): void => {// This interval somehow exists in the official NodeJS library.
				try {
					this.#url = new URL(Deno.env.get("REPLIT_DB_URL") ?? "");
				} catch {
					// Continue on error.
				}
			}, 1800000);
		} else {
			const urlLookUp: URL = new URL(options.url);
			if (!(/^https?:$/u.test(urlLookUp.protocol))) {
				throw new SyntaxError(`\`${urlLookUp.protocol}\` is not a valid URL protocol!`);
			}
			if (!(["kv.replit.com"].includes(urlLookUp.hostname))) {
				throw new SyntaxError(`\`${urlLookUp.hostname}\` is not a valid Replit Database hostname!`);
			}
			this.#url = new URL(`${urlLookUp.origin}${urlLookUp.pathname}`);
		}
		this.#exFetch = new ExFetch({
			retry: options.retry,
			timeout: options.timeout,
			userAgent: options.userAgent ?? userAgentDefault
		});
	}
	/**
	 * Clear all of the entries.
	 * @returns {Promise<void>}
	 */
	async clear(): Promise<void> {
		return this.delete(await this.keys());
	}
	/**
	 * Delete a key.
	 * @param {string} key Key.
	 * @returns {Promise<void>}
	 */
	async delete(key: string): Promise<void>;
	/**
	 * Delete keys.
	 * @param {string[]} keys Keys.
	 * @returns {Promise<void>}
	 */
	async delete(keys: string[]): Promise<void>;
	/**
	 * Delete keys.
	 * @param {...string} keys Keys.
	 * @returns {Promise<void>}
	 */
	async delete(...keys: string[]): Promise<void>;
	async delete(...keys: string[] | [string[]]): Promise<void> {
		const errorsStack: (string | Error)[] = [];
		for (const key of keys.flat(Infinity) as string[]) {
			try {
				if (!(key.length > 0)) {
					throw new TypeError(`Argument \`key\` is not a string (non-empty)!`);
				}
				const response: Response = await this.#exFetch.fetch(`${this.#url.toString()}/${key}`, {
					method: "DELETE",
					redirect: "error"
				});
				if (![204, 404].includes(response.status)) {
					throw new Error(`Unable to delete key \`${key}\` with status \`${response.status} ${response.statusText}\`: ${await response.text()}`);
				}
			} catch (error) {
				if (!this.#allSettled) {
					throw error;
				}
				errorsStack.push(error);
			}
		}
		if (errorsStack.length > 0) {
			throw new AggregateError(errorsStack);
		}
	}
	/**
	 * List entries through iterator, optionally filter the keys with predicate function, prefix (string), or regular expression.
	 * @param {string | RegExp | ReplitDatabaseClientKeysPredicateFunction} [keysFilter=""] Keys filter with predicate function, prefix (string), or regular expression.
	 * @returns {Promise<IterableIterator<[string, JSONValue]>>} Entries iterator.
	 */
	async entries(keysFilter: string | RegExp | ReplitDatabaseClientKeysPredicateFunction = ""): Promise<IterableIterator<[string, JSONValue]>> {
		return (await this.list(keysFilter)).entries();
	}
	/**
	 * Get a value by key.
	 * @param {string} key Key.
	 * @returns {Promise<JSONValue | undefined>} Value.
	 */
	async get(key: string): Promise<JSONValue | undefined> {
		if (!(key.length > 0)) {
			throw new TypeError(`Argument \`key\` is not a string (non-empty)!`);
		}
		const response: Response = await this.#exFetch.fetch(`${this.#url.toString()}/${key}`, {
			method: "GET",
			redirect: "error"
		});
		const raw: string = await response.text();
		if (!response.ok) {
			throw new Error(`Unable to get the value from key \`${key}\` with status \`${response.status} ${response.statusText}\`: ${raw}`);
		}
		return ((raw.length > 0) ? JSON.parse(raw) : undefined);
	}
	/**
	 * Whether an entry with the specified key exist.
	 * @param {string} key Key.
	 * @returns {Promise<boolean>} Result.
	 */
	async has(key: string): Promise<boolean> {
		return (typeof (await this.get(key)) !== "undefined");
	}
	/**
	 * Get all of the keys, optionally filter with predicate function, prefix (string), or regular expression.
	 * @param {string | RegExp | ReplitDatabaseClientKeysPredicateFunction} [filter=""] Filter with predicate function, prefix (string), or regular expression.
	 * @returns {Promise<string[]>} Keys.
	 */
	async keys(filter: string | RegExp | ReplitDatabaseClientKeysPredicateFunction = ""): Promise<string[]> {
		const requestUrl: URL = new URL(this.#url);
		requestUrl.searchParams.set("encode", "true");
		requestUrl.searchParams.set("prefix", ((typeof filter === "string") ? filter : ""));
		const response: Response = await this.#exFetch.fetch(requestUrl, {
			method: "GET",
			redirect: "error"
		});
		const raw: string = await response.text();
		if (!response.ok) {
			throw new Error(`Unable to get keys with status \`${response.status} ${response.statusText}\`: ${raw}`);
		}
		if (raw.length === 0) {
			return [];
		}
		const keys: string[] = raw.split(/\r?\n/gu).map((key: string): string => {
			return decodeURIComponent(key);
		});
		switch (typeof filter) {
			case "function":
				return keys.filter(filter);
			case "string":
				return keys;
			default:
				return keys.filter((key: string): boolean => {
					return filter.test(key);
				});
		}
	}
	/**
	 * List entries through `Map`, optionally filter the keys with predicate function, prefix (string), or regular expression.
	 * @param {string | RegExp | ReplitDatabaseClientKeysPredicateFunction} [keysFilter=""] Keys filter with predicate function, prefix (string), or regular expression.
	 * @returns {Promise<Map<string, JSONValue>>} Entries through `Map`.
	 */
	async list(keysFilter: string | RegExp | ReplitDatabaseClientKeysPredicateFunction = ""): Promise<Map<string, JSONValue>> {
		const result: Map<string, JSONValue> = new Map<string, JSONValue>();
		for (const key of (await this.keys(keysFilter))) {
			const value: JSONValue | undefined = await this.get(key);
			if (typeof value !== "undefined") {
				result.set(key, value);
			}
		}
		return result;
	}
	/**
	 * Set a key-value.
	 * @param {string} key Key.
	 * @param {JSONValue} value Value.
	 * @returns {Promise<void>}
	 */
	async set(key: string, value: JSONValue): Promise<void>;
	/**
	 * Set key-value.
	 * @param {{ [key: string]: JSONValue; } | Map<string, JSONValue> | Record<string, JSONValue>} table Table.
	 * @returns {Promise<void>}
	 */
	async set(table: { [key: string]: JSONValue; } | Map<string, JSONValue> | Record<string, JSONValue>): Promise<void>;
	async set(param0: string | { [key: string]: JSONValue; } | Map<string, JSONValue> | Record<string, JSONValue>, value?: JSONValue): Promise<void> {
		if (typeof value === "undefined") {
			const errorsStack: (string | Error)[] = [];
			for (const [rowKey, rowValue] of ((param0 instanceof Map) ? param0.entries() : Object.entries(param0))) {
				try {
					await this.set(rowKey, rowValue);
				} catch (error) {
					if (!this.#allSettled) {
						throw error;
					}
					errorsStack.push(error);
				}
			}
			if (errorsStack.length > 0) {
				throw new AggregateError(errorsStack);
			}
			return;
		}
		const key = param0 as string;
		if (!(key.length > 0)) {
			throw new TypeError(`Argument \`key\` is not a string (non-empty)!`);
		}
		const response: Response = await this.#exFetch.fetch(this.#url, {
			body: `${encodeURIComponent(key)}=${encodeURIComponent(JSON.stringify(value))}`,
			headers: {
				"Content-Type": "application/x-www-form-urlencoded"
			},
			method: "POST",
		});
		if (!response.ok) {
			throw new Error(`Unable to set key \`${key}\` with status \`${response.status} ${response.statusText}\`: ${await response.text()}`);
		}
	}
	/**
	 * Get the size.
	 * @returns {Promise<number>} Size.
	 */
	get size(): Promise<number> {
		return this.keys().then((keys: string[]): number => {
			return keys.length;
		});
	}
	/**
	 * Get all of the values, optionally filter the keys with predicate function, prefix (string), or regular expression.
	 * @param {string | RegExp | ReplitDatabaseClientKeysPredicateFunction} [keysFilter=""] Keys filter with predicate function, prefix (string), or regular expression.
	 * @returns {Promise<IterableIterator<JSONValue>>} Values.
	 */
	async values(keysFilter: string | RegExp | ReplitDatabaseClientKeysPredicateFunction = ""): Promise<IterableIterator<JSONValue>> {
		return (await this.list(keysFilter)).values();
	}
}
export default ReplitDatabaseClient;
