import { type JsonValue } from "https://deno.land/std@0.201.0/json/common.ts";
import { ExFetch, userAgentDefault as exFetchUserAgentDefault, type ExFetchOptions } from "https://deno.land/x/exfetch@v0.2.0/exfetch.ts";
import { ErrorsStack } from "./_internal/errors_stack.ts";
/**
 * Replit Database client default user agent.
 */
export const userAgentDefault = `${exFetchUserAgentDefault} ReplitDatabaseClient/0.3.0`
/**
 * Replit Database client options.
 */
export interface ReplitDatabaseClientOptions extends Pick<ExFetchOptions, "event" | "retry" | "timeout" | "userAgent"> {
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
			event: options.event,
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
		const errorsStack: ErrorsStack = new ErrorsStack();
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
			throw new Error(errorsStack.print());
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
		const result: Map<string, JsonValue> = new Map<string, JsonValue>();
		//@ts-ignore Overload is correct.
		for (const key of (await this.keys(keysFilter))) {
			const value: JsonValue | undefined = await this.get(key);
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
	async set(param0: string | Map<string, JsonValue> | Record<string, JsonValue>, value?: JsonValue): Promise<void> {
		if (typeof value === "undefined") {
			const errorsStack: ErrorsStack = new ErrorsStack();
			for (const [rowKey, rowValue] of ((param0 instanceof Map) ? (param0 as Map<string, JsonValue>).entries() : Object.entries(param0 as Record<string, JsonValue>))) {
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
				throw new Error(errorsStack.print());
			}
		} else {
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
