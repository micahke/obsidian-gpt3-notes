import { GPTHistoryItem } from "types";
import GPT3Notes from "./main";

export class HistoryHandler {
	constructor(private plugin: GPT3Notes) {}

	push(history_item: GPTHistoryItem) {
		try {
			let history = this.plugin.settings.promptHistory;
			history.push(history_item);
			if (history.length > 10) {
				history.remove(history[0]);
			}
			this.plugin.settings.promptHistory = history;
			this.plugin.saveSettings();
			return true;
		} catch (exception: any) {
			return false;
		}
	}

	reset() {
		this.plugin.settings.promptHistory = [];
		this.plugin.saveSettings();
	}
}
