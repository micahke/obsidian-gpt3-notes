import { Notice, request, RequestUrlParam } from "obsidian";
import { GPT3ModelParams } from "types";
import { SSE } from "../lib/sse";

export class GPT3Model {
	constructor() {}

	static generate(
		token: string,
		params: GPT3ModelParams,
		retry?: number
	): any {
		if (!retry) {
			retry = 0;
		}
		let data = {
			model: params.model,
			prompt: params.prompt,
			temperature: params.temperature,
			max_tokens: params.tokens,
			stream: true,
		};
		try {
			// const response_raw = await request(request_param);
			const stream = new SSE("https://api.openai.com/v1/completions", {
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
				method: "POST",
				payload: JSON.stringify(data),
			});
			return stream;
		} catch (e: any) {
			if (retry < 5) {
				return this.generate(token, params, retry + 1);
			}
			if (e.status === 429) {
				new Notice("GPT-3 Rate limit error: please try again soon.");
			} else if (e.status === 401) {
				new Notice(
					"Invalid token. Please change your token in the plugin settings."
				);
			} else {
				new Notice("An error occured.");
			}
			return false;
		}
	}
}
