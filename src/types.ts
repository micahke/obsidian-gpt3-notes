export type GPT3ModelParams = {
	prompt: string;
	temperature: number;
	tokens: number;
	model: string;
};
export type GPTHistoryItem = {
	prompt: string;
	temperature: number;
	tokens: number;
};
