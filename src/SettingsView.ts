import GPT3Notes, { DEFAULT_SETTINGS } from "main";
import {
	ButtonComponent,
	DropdownComponent,
	Notice,
	PluginSettingTab,
	Setting,
	TextAreaComponent,
	TextComponent,
} from "obsidian";

export const models = {
	"text-davinci-003": "text",
	"text-curie-001": "text",
	"text-babbage-001": "text",
	"text-ada-001": "text",
	"gpt-3.5-turbo": "chat",
	"gpt-3.5-turbo-0301": "chat",
	"gpt-4": "chat",
	"gpt-4-0613": "chat",
	"gpt-4-32k": "chat",
	"gpt-4-32k-0613	": "chat",
};

export const modelsKeys = Object.keys(models);

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
			.setName("API URL")
			.setDesc(
				"The URL to use for the API. Please note that it needs the same paths as the regular OpenAI API."
			)
			.addText((text: TextComponent) => {
				text.setPlaceholder("https://api.openai.com/v1")
					.setValue(this.plugin.settings.apiUrl || "")
					.onChange((change) => {
						this.plugin.settings.apiUrl = change;
						this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName("OpenAI Model")
			.setDesc("The type of GPT-3 model to use.")
			.addDropdown((dropdown: DropdownComponent) => {
				for (let model in modelsKeys) {
					dropdown.addOption(modelsKeys[model], modelsKeys[model]);
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
				button.setButtonText("Delete History");
				button.onClick((evt: MouseEvent) => {
					try {
						this.plugin.history_handler.reset();
						new Notice("History reset");
					} catch (e: any) {}
				});
			});

		new Setting(containerEl)
			.setName("Custom Prefixes")
			.setDesc("Set your custom prefixes, each on a separate line.")
			.addTextArea((textArea: TextAreaComponent) => {
				textArea.inputEl.className = "gpt_settings-text-area";
				textArea.setPlaceholder("Prefixes");
				let text = "";
				for (let i in this.plugin.settings.tokenParams.prefix) {
					let prefix = this.plugin.settings.tokenParams.prefix[i];
					text += `${prefix}\n`;
				}
				textArea.onChange((value: string) => {
					let prefixes = this.parseParams(value);
					this.plugin.settings.tokenParams.prefix = prefixes;
					this.plugin.saveSettings();
				});
				textArea.setValue(text);
			});

		new Setting(containerEl)
			.setName("Custom Postfixes")
			.setDesc("Set your custom postfixes, each on a separate line.")
			.addTextArea((textArea: TextAreaComponent) => {
				textArea.inputEl.className = "gpt_settings-text-area";
				textArea.setPlaceholder("Postfixes");
				let text = "";
				for (let i in this.plugin.settings.tokenParams.postfix) {
					let postfix = this.plugin.settings.tokenParams.postfix[i];
					text += `${postfix}\n`;
				}
				textArea.onChange((value: string) => {
					let postfixes = this.parseParams(value);
					this.plugin.settings.tokenParams.postfix = postfixes;
					this.plugin.saveSettings();
				});
				textArea.setValue(text);
			});

		new Setting(containerEl)
			.setName("Reset Defaults")
			.setDesc("Reset to plugin default settings.")
			.addButton((button: ButtonComponent) => {
				button.setButtonText("Reset to Defaults");
				button.onClick((evt: MouseEvent) => {
					try {
						this.plugin.settings = DEFAULT_SETTINGS;
						this.plugin.saveSettings();
						new Notice(
							"Default settings restored. You may need to reload the settings page."
						);
					} catch (e: any) {}
				});
			});
	}

	parseParams(text: string): string[] {
		let res = text.split("\n");
		res.remove("");
		return res;
	}
}
