export class ErrorsStack {
	#stack: string[] = [];
	get length(): number {
		return this.#stack.length;
	}
	print(): string {
		return this.#stack.join("\n");
	}
	push(...errors: (string | Error | RangeError | ReferenceError | SyntaxError | TypeError)[]): void {
		for (const error of errors) {
			let errorRaw: string;
			if (typeof error === "string") {
				errorRaw = error;
			} else if (typeof error?.name !== "undefined" && typeof error?.message !== "undefined") {
				errorRaw = `${error.name}: ${error.message}`;
			} else {
				errorRaw = `${error}`;
			}
			this.#stack.push(errorRaw.replace(/\r?\n/gu, " "));
		}
	}
}
