import { Notice } from "obsidian";
import { GPT3ModelParams } from "types";
import { SSE } from "../lib/sse";
import { models } from "SettingsView";

export class GPT3Model {
	constructor() {}

	static endpoints = {
		text: "/completions",
		chat: "/chat/completions",
	};

	static generate(
		token: string,
		apiUrl: string,
		params: GPT3ModelParams,
		retry?: number
	): any {
		if (!retry) {
			retry = 0;
		}
		const modelType = models[
			params.model as keyof typeof models
		] as keyof typeof this.endpoints;

		const data = {
			...this.paramsToModelParams(params, modelType),
			stream: true,
		};
		try {
			// const response_raw = await request(request_param);
			const stream = new SSE(apiUrl + this.endpoints[modelType], {
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
				return this.generate(token, apiUrl, params, retry + 1);
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

	static paramsToModelParams(params: GPT3ModelParams, modelType: string) {
		if (modelType === "text") {
			return {
				prompt: params.prompt,
				temperature: params.temperature,
				max_tokens: params.tokens,
				model: params.model,
			};
		} else if (modelType === "chat") {
			return {
				messages: [
					{
						role: "user",
						content: params.prompt,
					},
				],
				temperature: params.temperature,
				model: params.model,
			};
		}
	}
}
