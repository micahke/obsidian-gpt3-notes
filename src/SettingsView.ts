import GPT3Notes from "main";
import {
	ButtonComponent,
	DropdownComponent,
	Notice,
	PluginSettingTab,
	Setting,
	TextComponent,
} from "obsidian";

export const models = [
	"text-davinci-003",
	"text-curie-001",
	"text-babbage-001",
	"text-ada-001",
];

export default class SettingsView extends PluginSettingTab {
	constructor(private plugin: GPT3Notes) {
		super(plugin.app, plugin);
	}

	display() {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl("h1", { text: "GPT-3 Settings" });

		new Setting(containerEl)
			.setName("OpenAI API Key")
			.setDesc("The token generated in your OpenAI dashboard.")
			.addText((text: TextComponent) => {
				text.setPlaceholder("Token")
					.setValue(this.plugin.settings.token || "")
					.onChange((change) => {
						this.plugin.settings.token = change;
						this.plugin.saveSettings();
					});
			})
			.addButton((button: ButtonComponent) => {
				button.setButtonText("Generate token");
				button.onClick((evt: MouseEvent) => {
					window.open("https://beta.openai.com/account/api-keys");
				});
			});

		new Setting(containerEl)
			.setName("OpenAI Model")
			.setDesc("The type of GPT-3 model to use.")
			.addDropdown((dropdown: DropdownComponent) => {
				for (let model in models) {
					dropdown.addOption(models[model], models[model]);
				}
				dropdown.onChange((change) => {
					this.plugin.settings.model = change;
				});
				dropdown.setValue(this.plugin.settings.model);
			});

		new Setting(containerEl)
			.setName("Delete history")
			.setDesc("This will purge your prompt history")
			.addButton((button: ButtonComponent) => {
				button.setButtonText("Delete");
				button.onClick((evt: MouseEvent) => {
					try {
						this.plugin.history_handler.reset();
						new Notice("History reset");
					} catch (e: any) {}
				});
			});
	}
}
