import { Notice, request, RequestUrlParam } from "obsidian";
import { GPT3ModelParams } from "types";

export class GPT3Model {
	constructor() {}

	static async generate(
		token: string,
		params: GPT3ModelParams,
		retry?: number
	): Promise<any> {
		if (!retry) {
			retry = 0;
		}
		const request_param: RequestUrlParam = {
			url: "https://api.openai.com/v1/completions",
			method: "POST",
			headers: {
				Authorization: `Bearer ${token}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				model: params.model,
				prompt: params.prompt,
				temperature: params.temperature,
				max_tokens: params.tokens,
			}),
		};

		try {
			const response_raw = await request(request_param);

			const data = JSON.parse(response_raw);
			return data;
		} catch (e: any) {
			if (retry < 5) {
				return this.generate(token, params, retry + 1);
			}
			console.log(e);
			if (e.status === 429) {
				new Notice("GPT-3 Rate limit error: please try again soon.");
			} else if (e.status === 401) {
				new Notice(
					"Invalid token. Please change your token in the plugin settings."
				);
			} else {
				new Notice("An error occurred while generating token");
			}
			return false;
		}
	}
}
