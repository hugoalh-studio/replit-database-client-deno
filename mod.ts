import { type JsonValue } from "https://deno.land/std@0.199.0/json/common.ts";
import { ExFetch, type ExFetchOptions, type ExFetchRetryOptions } from "https://deno.land/x/exfetch@v0.1.3/exfetch.ts";
type CommonErrorType = string | Error | RangeError | ReferenceError | SyntaxError | TypeError;
/**
 * Replit Database client error stack.
 * @access private
 */
class ReplitDatabaseClientErrorStack {
	#stack: CommonErrorType[] = [];
	get length(): number {
		return this.#stack.length;
	}
	print(): string {
		return Array.from(new Set([...this.#stack.map((error: CommonErrorType): string => {
			return ((typeof error === "string") ? error : `${error.name}: ${error.message}`).replace(/\r?\n/gu, " ");
		})])).join("\n");
	}
	push(...error: CommonErrorType[]): void {
		this.#stack.push(...error);
	}
}
/**
 * Replit Database client options.
 */
export interface ReplitDatabaseClientOptions extends Pick<ExFetchOptions, "event" | "timeout"> {
	/**
	 * For operations of clear, and batch/bulk delete and set, whether to await for all of the operations are all settled (resolved or rejected) instead of ignore remain operations when any of the operation is rejected.
	 * @default false
	 */
	allSettled?: boolean;
	/**
	 * Retry options.
	 * @default {}
	 */
	retry?: number | Omit<ExFetchRetryOptions, "condition">;
	/**
	 * Custom database URL.
	 * @default undefined
	 */
	url?: string | URL;
}
/**
 * Replit Database is a simple, user-friendly key-value store inside of every Repl, every Repl can access and interact with its own unique Replit Database.
 */
export class ReplitDatabaseClient {
	#allSettled = false;
	#exFetch: ExFetch;
	#url: URL;
	/**
	 * Create a new Replit Database client instance.
	 * @param {ReplitDatabaseClientOptions} [options={}] Options.
	 */
	constructor(options: ReplitDatabaseClientOptions = {}) {
		if (typeof options.retry === "number") {
			options.retry = {
				attempts: options.retry
			};
		}
		options.retry ??= {};
		if (typeof options.allSettled === "boolean") {
			this.#allSettled = options.allSettled;
		} else if (typeof options.allSettled !== "undefined") {
			throw new TypeError(`Argument \`options.allSettled\` must be type of boolean or undefined!`);
		}
		if (
			options.url instanceof URL ||
			typeof options.url === "string"
		) {
			let urlLookUp: URL = new URL(options.url);
			if (!(/^https?:$/u.test(urlLookUp.protocol))) {
				throw new SyntaxError(`\`${urlLookUp.protocol}\` is not a valid URL protocol!`);
			}
			if (!["kv.replit.com"].includes(urlLookUp.hostname)) {
				throw new SyntaxError(`\`${urlLookUp.hostname}\` is not a valid Replit Database hostname!`);
			}
			this.#url = new URL(`${urlLookUp.origin}${urlLookUp.pathname}`);
		} else if (typeof options.url === "undefined") {
			try {
				this.#url = new URL(Deno.env.get("REPLIT_DB_URL") ?? "");
			} catch {
				throw new Error(`Unable to access environment variable \`REPLIT_DB_URL\`, or it's value is not a valid URL!`);
			}
			setInterval((): void => {// This interval somehow exists in the official NodeJS library.
				this.#url = new URL(Deno.env.get("REPLIT_DB_URL") ?? this.#url);
			}, 1800000);
		} else {
			throw new TypeError(`Argument \`options.url\` must be instance of URL, or type of string or undefined!`);
		}
		this.#exFetch = new ExFetch({
			event: options.event,
			retry: {
				...options.retry,
				condition: undefined
			},
			timeout: options.timeout
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
		let errorStacks: ReplitDatabaseClientErrorStack = new ReplitDatabaseClientErrorStack();
		for (let key of keys.flat(Infinity)) {
			try {
				if (!(typeof key === "string" && key.length > 0)) {
					throw new TypeError(`Argument \`key\` must be type of string (non-empty)!`);
				}
				let response: Response = await this.#exFetch.fetch(`${this.#url.toString()}/${key}`, {
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
				errorStacks.push(error);
			}
		}
		if (errorStacks.length > 0) {
			throw new Error(errorStacks.print());
		}
	}
	/**
	 * List entries through iterator, optionally filter keys with prefix.
	 * @param {string} [keysPrefix=""] Filter keys that with prefix.
	 * @returns {Promise<IterableIterator<[string, JsonValue]>>} Entries iterator.
	 */
	entries(keysPrefix?: string): Promise<IterableIterator<JsonValue>>;
	/**
	 * List entries through iterator, optionally filter keys with regular expression.
	 * @param {RegExp} keysFilter Filter keys with regular expression.
	 * @returns {Promise<IterableIterator<[string, JsonValue]>>} Entries iterator.
	 */
	entries(keysFilter: RegExp): Promise<IterableIterator<JsonValue>>;
	async entries(keysFilter: string | RegExp = ""): Promise<IterableIterator<[string, JsonValue]>> {
		//@ts-ignore Overload is correct.
		return (await this.list(keysFilter)).entries();
	}
	/**
	 * Get a value by key.
	 * @param {string} key Key.
	 * @returns {Promise<JsonValue | undefined>} Value.
	 */
	async get(key: string): Promise<JsonValue | undefined> {
		if (!(typeof key === "string" && key.length > 0)) {
			throw new TypeError(`Argument \`key\` must be type of string (non-empty)!`);
		}
		let response: Response = await this.#exFetch.fetch(`${this.#url.toString()}/${key}`, {
			method: "GET",
			redirect: "error"
		});
		let raw: string = await response.text();
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
	 * Get all of the keys, optionally filter with prefix.
	 * @param {string} [prefix=""] Filter with prefix.
	 * @returns {Promise<string[]>} Keys.
	 */
	keys(prefix?: string): Promise<string[]>;
	/**
	 * Get all of the keys, optionally filter with regular expression.
	 * @param {RegExp} filter Filter with regular expression.
	 * @returns {Promise<string[]>} Keys.
	 */
	keys(filter: RegExp): Promise<string[]>;
	async keys(filter: string | RegExp = ""): Promise<string[]> {
		if (typeof filter !== "string" && !(filter instanceof RegExp)) {
			throw new TypeError(`Argument \`filter\`/\`prefix\` must be instance of RegExp, or type of string!`);
		}
		let requestUrl: URL = new URL(this.#url);
		requestUrl.searchParams.set("encode", "true");
		requestUrl.searchParams.set("prefix", ((typeof filter === "string") ? filter : ""));
		let response: Response = await this.#exFetch.fetch(requestUrl, {
			method: "GET",
			redirect: "error"
		});
		let raw: string = await response.text();
		if (!response.ok) {
			throw new Error(`Unable to get keys with status \`${response.status} ${response.statusText}\`: ${raw}`);
		}
		if (raw.length === 0) {
			return [];
		}
		return raw.split(/\r?\n/gu).map((key: string): string => {
			return decodeURIComponent(key);
		}).filter((key: string): boolean => {
			return ((filter instanceof RegExp) ? filter.test(key) : true);
		});
	}
	/**
	 * List entries through `Map`, optionally filter keys with prefix.
	 * @param {string} [keysPrefix=""] Filter keys that with prefix.
	 * @returns {Promise<Map<string, JsonValue>>} Entries through `Map`.
	 */
	list(keysPrefix?: string): Promise<Map<string, JsonValue>>;
	/**
	 * List entries through `Map`, optionally filter keys with regular expression.
	 * @param {RegExp} keysFilter Filter keys with regular expression.
	 * @returns {Promise<string[]>} Keys.
	 */
	list(keysFilter: RegExp): Promise<Map<string, JsonValue>>;
	async list(keysFilter: string | RegExp = ""): Promise<Map<string, JsonValue>> {
		let result: Map<string, JsonValue> = new Map<string, JsonValue>();
		//@ts-ignore Overload is correct.
		for (let key of (await this.keys(keysFilter))) {
			let value: JsonValue | undefined = await this.get(key);
			if (typeof value !== "undefined") {
				result.set(key, value);
			}
		}
		return result;
	}
	/**
	 * Set a key-value.
	 * @param {string} key Key.
	 * @param {JsonValue} value Value.
	 * @returns {Promise<void>}
	 */
	set(key: string, value: JsonValue): Promise<void>;
	/**
	 * Set key-value.
	 * @param {Map<string, JsonValue> | Record<string, JsonValue>} table Table.
	 * @returns {Promise<void>}
	 */
	set(table: Map<string, JsonValue> | Record<string, JsonValue>): Promise<void>;
	async set(...input: unknown[]): Promise<void> {
		if (input.length === 1) {
			let errorStacks: ReplitDatabaseClientErrorStack = new ReplitDatabaseClientErrorStack();
			for (let [key, value] of ((input[0] instanceof Map) ? (input[0] as Map<string, JsonValue>).entries() : Object.entries(input[0] as Record<string, JsonValue>))) {
				try {
					await this.set(key, value);
				} catch (error) {
					if (!this.#allSettled) {
						throw error;
					}
					errorStacks.push(error);
				}
			}
			if (errorStacks.length > 0) {
				throw new Error(errorStacks.print());
			}
		} else if (input.length === 2) {
			let [key, value] = input as [string, JsonValue];
			if (!(typeof key === "string" && key.length > 0)) {
				throw new TypeError(`Argument \`key\` must be type of string (non-empty)!`);
			}
			let response: Response = await this.#exFetch.fetch(this.#url, {
				body: `${encodeURIComponent(key)}=${encodeURIComponent(JSON.stringify(value))}`,
				headers: {
					"Content-Type": "application/x-www-form-urlencoded"
				},
				method: "POST",
			});
			if (!response.ok) {
				throw new Error(`Unable to set key \`${key}\` with status \`${response.status} ${response.statusText}\`: ${await response.text()}`);
			}
		} else {
			throw new SyntaxError(`Arguments count is not match!`);
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
	 * Get all of the values, optionally filter keys with prefix.
	 * @param {string} [keysPrefix=""] Filter keys that with prefix.
	 * @returns {Promise<IterableIterator<JsonValue>>} Values.
	 */
	values(keysPrefix?: string): Promise<IterableIterator<JsonValue>>;
	/**
	 * Get all of the values, optionally filter keys with regular expression.
	 * @param {RegExp} keysFilter Filter keys with regular expression.
	 * @returns {Promise<IterableIterator<JsonValue>>} Values.
	 */
	values(keysFilter: RegExp): Promise<IterableIterator<JsonValue>>;
	async values(keysFilter: string | RegExp = ""): Promise<IterableIterator<JsonValue>> {
		//@ts-ignore Overload is correct.
		return (await this.list(keysFilter)).values();
	}
}
export default ReplitDatabaseClient;
