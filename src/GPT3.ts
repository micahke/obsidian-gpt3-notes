import { Notice, request, RequestUrlParam } from "obsidian";
import { GPT3ModelParams } from "types";

export class GPT3Model {
	constructor() {}

	static async generate(
		token: string,
		params: GPT3ModelParams
	): Promise<any> {
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
			new Notice(
				"There was an error. Please check your token or try again."
			);
			return false;
		}
	}
}
