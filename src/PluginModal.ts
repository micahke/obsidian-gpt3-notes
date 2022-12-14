import { GPT3Model } from "GPT3";
import GPT3Notes from "main";
import {
	ButtonComponent,
	DropdownComponent,
	MarkdownView,
	Modal,
	Notice,
	Setting,
	TextAreaComponent,
} from "obsidian";
import { models } from "SettingsView";
import { GPT3ModelParams } from "types";
import data from "../prompts.json";

export class PluginModal extends Modal {
	prompt: string;

	generateButton: ButtonComponent;
	promptField: TextAreaComponent;

	constructor(private plugin: GPT3Notes) {
		super(plugin.app);
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.setText("Create a GPT-3 Note");

		const container = contentEl.createDiv();
		container.style.width = "100%";
		container.style.marginTop = "20px";

		const dropdownsDiv = container.createDiv();
		dropdownsDiv.style.width = "100%";
		dropdownsDiv.style.display = "flex";
		// dropdownsDiv.style.justifyContent = "space-between";
		dropdownsDiv.style.gap = "10px";
		dropdownsDiv.style.margin = "20px 0";

		this.tokenSection(dropdownsDiv, "Prefix", data.prefix);
		this.tokenSection(dropdownsDiv, "Postfix", data.postfix);

		this.promptField = new TextAreaComponent(container);
		this.promptField.inputEl.style.width = "100%";
		this.promptField.inputEl.style.minHeight = "100px";
		this.promptField.inputEl.style.width = "100%";
		this.promptField.inputEl.style.padding = "10px";
		this.promptField.inputEl.style.fontSize = "16px";
		this.promptField.setPlaceholder("Enter your prompt...");
		this.promptField.onChange((change) => {
			this.prompt = change;
		});

		const tempSetting = new Setting(container)
			.setName("Temperature")
			.setDesc("The amount of variation in the model (randomness).")
			.addDropdown((dropdown) => {
				for (let i = 0; i <= 10; i++) {
					if (i == 5) {
						dropdown.addOption(`${i}`, "5 (default)");
						continue;
					}
					dropdown.addOption(`${i}`, `${i}`);
				}

				dropdown.setValue(`${this.plugin.settings.temperature}`);
				dropdown.onChange((change) => {
					this.plugin.settings.temperature = parseInt(change);
					this.plugin.saveSettings();
				});
			});
		tempSetting.settingEl.style.marginTop = "20px";

		const tokenSetting = new Setting(container)
			.setName("Tokens")
			.setDesc("The number of tokens GPT-3 should generate.")
			.addText((text) => {
				text.setValue(`${this.plugin.settings.tokens}`);
				text.inputEl.type = "number";
				text.onChange((change) => {
					this.plugin.settings.tokens = parseInt(change);
					this.plugin.saveSettings();
				});
			});

		tempSetting.settingEl.style.marginTop = "20px";

		new Setting(container)
			.setName("OpenAI Model")
			.setDesc("The type of GPT-3 model to use.")
			.addDropdown((dropdown: DropdownComponent) => {
				for (let model in models) {
					dropdown.addOption(models[model], models[model]);
				}
				dropdown.onChange((change) => {
					this.plugin.settings.model = change;
					this.plugin.saveSettings();
				});
				dropdown.setValue(this.plugin.settings.model);
			});

		const buttonContainer = container.createDiv();
		buttonContainer.style.display = "flex";
		buttonContainer.style.justifyContent = "flex-end";
		buttonContainer.style.gap = "10px";
		buttonContainer.style.marginTop = "15px";

		const cancelButton = new ButtonComponent(buttonContainer);
		cancelButton.buttonEl.style.backgroundColor = "#b33939";
		cancelButton.setButtonText("Cancel").onClick(() => {
			this.close();
		});

		this.generateButton = new ButtonComponent(buttonContainer);
		this.generateButton.buttonEl.style.backgroundColor = "#218c74";
		this.generateButton.setButtonText("Generate Notes").onClick(() => {
			this.generateButton.setButtonText("Loading...");
			this.generateButton.setDisabled(true);
			this.generateButton.buttonEl.style.backgroundColor =
				"rbga(33, 140, 116, 0.5)";
			this.handleGenerateClick();
		});
	}

	tokenSection(container: HTMLDivElement, label: string, options: string[]) {
		const dropdown = new DropdownComponent(container);
		dropdown.addOption(label, label);
		for (let i in options) {
			dropdown.addOption(options[i], options[i]);
		}
		dropdown.onChange((change) => {
			const newValue = this.promptField.getValue() + change + " ";

			this.promptField.setValue(newValue);
			this.promptField.inputEl.focus();
			this.prompt = newValue;
			dropdown.setValue(label);
		});
		return dropdown;
	}

	async handleGenerateClick() {
		const view =
			this.plugin.app.workspace.getActiveViewOfType(MarkdownView);

		if (!view) {
			new Notice(
				"You must have a Markdown file open to complete this action."
			);
			this.generateButton.setDisabled(false);
			this.generateButton.setButtonText("Generate Notes");
			return;
		}

		const params: GPT3ModelParams = {
			prompt: this.prompt,
			temperature: this.plugin.settings.temperature / 10,
			tokens: this.plugin.settings.tokens,
			model: this.plugin.settings.model,
		};

		let token = this.plugin.settings.token;

		if (!token) {
			new Notice("Please enter your OpenAI token in the plugin settings");
			this.generateButton.setDisabled(false);
			this.generateButton.setButtonText("Generate Notes");
			return;
		}

		const response = await GPT3Model.generate(token, params);
		if (!response) {
			this.generateButton.setDisabled(false);
			this.generateButton.setButtonText("Generate Notes");
			return;
		}
		this.close();
		this.plugin.showPreviewModal(params, response);
	}
}
