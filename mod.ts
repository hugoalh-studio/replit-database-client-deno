import { type JsonValue } from "https://deno.land/std@0.195.0/json/common.ts";
type CommonErrorType = string | Error | RangeError | ReferenceError | SyntaxError | TypeError;
/**
 * @access private
 * @class ReplitDatabaseClientErrorStack
 */
class ReplitDatabaseClientErrorStack {
	#storage: CommonErrorType[] = [];
	get length(): number {
		return this.#storage.length;
	}
	print(): string {
		return Array.from(new Set([...this.#storage.map((error: CommonErrorType): string => {
			return ((typeof error === "string") ? error : `${error.name}: ${error.message}`).replace(/\r?\n/gu, " ");
		})])).join("\n");
	}
	push(...error: CommonErrorType[]): void {
		this.#storage.push(...error);
	}
}
interface ReplitDatabaseOptions {
	/**
	 * @property allSettled
	 * @description For operations of clear, and batch/bulk delete and set, whether to await for all of the operations are all settled (resolved or rejected) instead of ignore remain operations when any of the operation is rejected.
	 * @default false
	 */
	allSettled?: boolean;
	/**
	 * @property retry
	 * @description Whether to retry when exceed the rate limits.
	 * @default 1
	 */
	retry?: number;
	/**
	 * @property url
	 * @description Custom database URL.
	 * @default undefined
	 */
	url?: string | URL;
}
/**
 * @class ReplitDatabaseClient
 * @description Replit Database is a simple, user-friendly key-value store inside of every Repl, every Repl can access and interact with its own unique Replit Database.
 */
class ReplitDatabaseClient {
	static exceedRateLimitsStatusCode = 429;
	#allSettled = false;
	#retry = 1;
	#url: URL;
	/**
	 * @constructor
	 * @description Create a new Replit Database client instance.
	 * @param {ReplitDatabaseOptions} [options={}] Options.
	 */
	constructor(options: ReplitDatabaseOptions = {}) {
		if (typeof options.allSettled === "boolean") {
			this.#allSettled = options.allSettled;
		} else if (typeof options.allSettled !== "undefined") {
			throw new TypeError(`Argument \`options.allSettled\` must be type of boolean or undefined!`);
		}
		if (typeof options.retry === "number" && !Number.isNaN(options.retry)) {
			if (!(Number.isSafeInteger(options.retry) && options.retry >= 0)) {
				throw new RangeError(`Argument \`options.retry\` must be a number which is integer, positive, and safe!`);
			}
			this.#retry = options.retry;
		} else if (typeof options.retry !== "undefined") {
			throw new TypeError(`Argument \`options.retry\` must be type of number or undefined!`);
		}
		if (
			options.url instanceof URL ||
			typeof options.url === "string"
		) {
			let urlLookUp: URL = new URL(options.url);
			if (!(/^https?:$/u.test(urlLookUp.protocol))) {
				throw new SyntaxError(`\`${urlLookUp.protocol}\` is not a valid Replit Database protocol!`);
			}
			this.#url = new URL(urlLookUp.origin);
		} else if (typeof options.url === "undefined") {
			try {
				this.#url = new URL(Deno.env.get("REPLIT_DB_URL") ?? "");
			} catch {
				throw new Error(`Unable to access environment variable \`REPLIT_DB_URL\`, or it's value is not a valid URL!`);
			}
		} else {
			throw new TypeError(`Argument \`options.url\` must be instance of URL, or type of string or undefined!`);
		}
	}
	/**
	 * @access private
	 * @method transaction
	 * @description This provide better fetch with retry.
	 * @param {Parameters<typeof fetch>} fetchParameters
	 * @returns {Promise<Response>}
	 */
	async #transaction(...fetchParameters: Parameters<typeof fetch>): Promise<Response> {
		for (let time = 0; time < this.#retry + 1; time += 1) {
			let response: Response = await fetch(...fetchParameters);
			if (response.status !== ReplitDatabaseClient.exceedRateLimitsStatusCode) {
				return response;
			}
			if (time < this.#retry) {
				await new Promise((resolve): void => {
					setTimeout(resolve, 5000);
				});
				continue;
			}
		}
		throw new Error(`Unable to transact with Replit Database because of exceed the rate limits and retries!`);
	}
	/**
	 * @method clear
	 * @description Clear the database.
	 * @returns {Promise<void>}
	 */
	async clear(): Promise<void> {
		return this.delete(await this.keys());
	}
	/**
	 * @method delete
	 * @description Delete key(s).
	 * @param {(string | string[])[]} keys Key(s).
	 * @returns {Promise<void>}
	 */
	async delete(...keys: (string | string[])[]): Promise<void> {
		let errorStacks: ReplitDatabaseClientErrorStack = new ReplitDatabaseClientErrorStack();
		for (let key of keys.flat(Infinity)) {
			try {
				if (!(typeof key === "string" && key.length > 0)) {
					throw new TypeError(`Argument \`key\` must be type of string (non-empty)!`);
				}
				let response: Response = await this.#transaction(new URL(key, this.#url), {
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
	 * @method get
	 * @description Get a value by key.
	 * @param {string} key Key.
	 * @returns {Promise<JsonValue>} Value.
	 */
	async get(key: string): Promise<JsonValue> {
		if (!(typeof key === "string" && key.length > 0)) {
			throw new TypeError(`Argument \`key\` must be type of string (non-empty)!`);
		}
		let response: Response = await this.#transaction(new URL(key, this.#url), {
			method: "GET",
			redirect: "error"
		});
		let raw: string = await response.text();
		if (!response.ok) {
			throw new Error(`Unable to get the value from key \`${key}\` with status \`${response.status} ${response.statusText}\`: ${raw}`);
		}
		return ((raw.length > 0) ? JSON.parse(raw) : null);
	}
	/**
	 * @method keys
	 * @description Get keys that start with a prefix, or get all of the keys.
	 * @param {string} [prefix=""] Filter keys start with a prefix.
	 * @returns {Promise<string[]>} Keys.
	 */
	async keys(prefix = ""): Promise<string[]> {
		if (typeof prefix !== "string") {
			throw new TypeError(`Argument \`prefix\` must be type of string!`);
		}
		let requestUrl: URL = new URL(this.#url);
		requestUrl.searchParams.set("encode", "true");
		if (prefix.length > 0) {
			requestUrl.searchParams.set("prefix", prefix);
		}
		let response: Response = await this.#transaction(requestUrl, {
			method: "GET",
			redirect: "error"
		});
		let raw: string = await response.text();
		if (!response.ok) {
			throw new Error(`Unable to get keys with status \`${response.status} ${response.statusText}\`: ${raw}`);
		}
		return raw.split(/\r?\n/gu).map((key: string): string => {
			return decodeURIComponent(key);
		});
	}
	/**
	 * @method list
	 * @description List database.
	 * @returns {Promise<Map<string, JsonValue>>} Database.
	 */
	async list(): Promise<Map<string, JsonValue>> {
		let result: Map<string, JsonValue> = new Map<string, JsonValue>();
		let keys: string[] = await this.keys();
		for (let key of keys) {
			result.set(key, await this.get(key));
		}
		return result;
	}
	/**
	 * @method set
	 * @description Set a key-value.
	 * @param {string} key Key.
	 * @param {JsonValue} value Value.
	 * @returns {Promise<void>}
	 */
	set(key: string, value: JsonValue): Promise<void>;
	/**
	 * @method set
	 * @description Set key-value.
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
			let response: Response = await this.#transaction(new URL(this.#url), {
				body: `${encodeURIComponent(key)}=${encodeURIComponent(JSON.stringify(value))}`,
				headers: {
					"Content-Type": "application/x-www-form-urlencoded"
				},
				method: "POST",
			});
			let raw: string = await response.text();
			if (!response.ok) {
				throw new Error(`Unable to set key \`${key}\` with status \`${response.status} ${response.statusText}\`: ${raw}`);
			}
		} else {
			throw new SyntaxError(`Arguments count is not match!`);
		}
	}
}
export default ReplitDatabaseClient;
export {
	ReplitDatabaseClient,
	type ReplitDatabaseOptions
};
