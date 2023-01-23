import GPT3Notes from "main";
import {
	ButtonComponent,
	DropdownComponent,
	Notice,
	PluginSettingTab,
	Setting,
	TextAreaComponent,
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
	}

	parseParams(text: string): string[] {
		let res = text.split("\n");
		res.remove("");
		return res;
	}
}
