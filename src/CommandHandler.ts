import { PluginModal } from "PluginModal";
import GPTNotes from "./main";

export default class CommandHandler {
	constructor(private plugin: GPTNotes) {}

	setup(): void {
		this.plugin.addCommand({
			id: "create-gpt3-note",
			name: "Create GPT-3 Note",
			callback: () => {
				new PluginModal(this.plugin).open();
			},
		});
	}
}
