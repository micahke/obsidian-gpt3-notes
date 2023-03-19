export type GPT3ModelParams = {
	prompt: string;
	temperature: number;
	tokens: number;
	model: string;
};
export type GPTHistoryItem = {
	prompt: string;
	processedPrompt: string;
	temperature: number;
	tokens: number;
};

export type TokenParams = {
	prefix: string[];
	postfix: string[];
};

export type PluginModalSettings = {
	loadLastItem?: boolean;
};
