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
import { GPT3ModelParams, GPTHistoryItem } from "types";
import data from "../prompts.json";

export class PluginModal extends Modal {
	prompt: string;
	processedPrompt: string;

	generateButton: ButtonComponent;
	promptField: TextAreaComponent;

	replacementTokens = {
		selection: (match: RegExpMatchArray, prompt: string) => {
			const view =
				this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
			if (view) {
				const selection = view.editor.getSelection();
				prompt = this.replaceToken(match, prompt, selection);
			}

			return prompt;
		},
	};

	constructor(private plugin: GPT3Notes) {
		super(plugin.app);
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.setText("Create a GPT-3 Note");

		const container = contentEl.createDiv();
		container.className = "gpt_plugin-container";
		// container.style.width = "100%";
		// container.style.marginTop = "20px";

		let history_dropdown = new DropdownComponent(container);
		// history_dropdown.selectEl.style.width = "100%";
		history_dropdown.selectEl.className = "gpt_history-dropdown";

		let history = this.plugin.settings.promptHistory;
		history_dropdown.addOption("History", "History");
		for (let i = history.length - 1; i >= 0; i--) {
			if (history[i].prompt.length > 80) {
				history_dropdown.addOption(
					`${i}`,
					history[i].prompt.slice(0, 80) + "..."
				);
				continue;
			}
			history_dropdown.addOption(`${i}`, history[i].prompt);
		}
		history_dropdown.onChange((change) => {
			try {
				const index = parseInt(change);
				this.useHistoryItem(history[index]);
				history_dropdown.setValue("History");
			} catch (e: any) {}
		});

		const dropdownsDiv = container.createDiv();
		dropdownsDiv.className = "gpt_dropdowns-div";

		this.tokenSection(dropdownsDiv, "Prefix", data.prefix);
		this.tokenSection(dropdownsDiv, "Postfix", data.postfix);
		this.tokenSection(
			dropdownsDiv,
			"Tokens",
			Object.keys(this.replacementTokens).map((key) => `{{${key}}}`)
		);

		this.promptField = new TextAreaComponent(container);
		this.promptField.inputEl.className = "gpt_prompt-field";

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
		tempSetting.controlEl.className = "gpt_temp-setting";

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
		buttonContainer.className = "gpt_button-container";

		const cancelButton = new ButtonComponent(buttonContainer);
		cancelButton.buttonEl.className = "gpt_cancel-button";
		cancelButton.buttonEl.style.backgroundColor = "#b33939";
		cancelButton.setButtonText("Cancel").onClick(() => {
			this.close();
		});

		this.generateButton = new ButtonComponent(buttonContainer);
		this.generateButton.buttonEl.className = "gpt_generate-button";
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

	useHistoryItem(item: GPTHistoryItem) {
		this.promptField.setValue(item.prompt);
		this.prompt = item.prompt;
	}

	replaceToken(
		match: RegExpMatchArray,
		prompt: string,
		replacementText: string
	) {
		const matchIndex = match.index || 0;
		return (
			prompt.substring(0, matchIndex) +
			replacementText +
			prompt.substring(matchIndex + match[0].length)
		);
	}

	processReplacementTokens(prompt: string) {
		const tokenRegex = /\{\{(.*?)\}\}/g;
		const matches = [...prompt.matchAll(tokenRegex)];
		matches.forEach((match) => {
			const token = match[1] as keyof typeof this.replacementTokens;
			if (this.replacementTokens[token]) {
				prompt = this.replacementTokens[token](match, prompt);
			}
		});

		return prompt;
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

		this.processedPrompt = this.processReplacementTokens(this.prompt);

		const params: GPT3ModelParams = {
			prompt: this.processedPrompt,
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

		this.plugin.history_handler.push({
			prompt: params.prompt,
			temperature: params.temperature,
			tokens: params.tokens,
		});

		this.close();
		this.plugin.showPreviewModal(params, response);
	}
}
