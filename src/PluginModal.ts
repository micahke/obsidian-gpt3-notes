import { GPT3Model } from "GPT3";
import GPT3Notes from "main";
import {
	ButtonComponent,
	DropdownComponent,
	ToggleComponent,
	MarkdownView,
	Modal,
	Notice,
	Setting,
	TextAreaComponent,
} from "obsidian";
import { modelsKeys, models } from "SettingsView";
import { GPT3ModelParams, GPTHistoryItem, PluginModalSettings } from "types";

export class PluginModal extends Modal {
	prompt: string;
	processedPrompt: string;

	replaceTokensInHistory: boolean;
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

	constructor(
		private plugin: GPT3Notes,
		private settings: PluginModalSettings = {}
	) {
		super(plugin.app);
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.setText("Create a GPT-3 Note");

		const container = contentEl.createDiv();
		container.className = "gpt_plugin-container";
		// container.style.width = "100%";
		// container.style.marginTop = "20px";
		const history_toggle_container = container.createDiv({
			cls: "gpt_history-container",
			text: "Replace tokens in history",
		});
		const history_toggle = new ToggleComponent(history_toggle_container);

		const history_dropdown = new DropdownComponent(container);
		// history_dropdown.selectEl.style.width = "100%";
		history_dropdown.selectEl.className = "gpt_history-dropdown";

		let history = this.plugin.settings.promptHistory;

		this.generateHistoryOptions(history_dropdown, history);
		history_toggle.onChange((change) => {
			this.replaceTokensInHistory = change;
			history_dropdown.selectEl
				.querySelectorAll("option")
				.forEach((option) => {
					history_dropdown.selectEl.removeChild(option);
				});
			this.generateHistoryOptions(history_dropdown, history);
		});

		history_dropdown.onChange((change) => {
			try {
				const index = parseInt(change);
				this.useHistoryItem(history[index]);
				history_dropdown.setValue("History");
			} catch (e: any) {}
		});

		const dropdownsDiv = container.createDiv();
		dropdownsDiv.className = "gpt_dropdowns-div";

		this.tokenSection(
			dropdownsDiv,
			"Prefix",
			this.plugin.settings.tokenParams.prefix
		);
		this.tokenSection(
			dropdownsDiv,
			"Postfix",
			this.plugin.settings.tokenParams.postfix
		);
		this.tokenSection(
			dropdownsDiv,
			"Tokens",
			Object.keys(this.replacementTokens).map((key) => `{{${key}}}`)
		);

		this.promptField = new TextAreaComponent(container);
		this.promptField.inputEl.className = "gpt_prompt-field";

		this.promptField.setPlaceholder("Enter your prompt...");

		if (this.settings.loadLastItem) {
			const lastHistoryItemIndex =
				this.plugin.settings.promptHistory.length - 1;
			const lastItem =
				this.plugin.settings.promptHistory[lastHistoryItemIndex];
			this.useHistoryItem(lastItem);
		}

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

		if (
			models[this.plugin.settings.model as keyof typeof models] === "chat"
		) {
			tokenSetting.settingEl.style.display = "none";
		}

		new Setting(container)
			.setName("OpenAI Model")
			.setDesc("The type of GPT-3 model to use.")
			.addDropdown((dropdown: DropdownComponent) => {
				for (let model in modelsKeys) {
					dropdown.addOption(modelsKeys[model], modelsKeys[model]);
				}
				dropdown.onChange((change) => {
					this.plugin.settings.model = change;
					this.plugin.saveSettings();
					tokenSetting.settingEl.style.display =
						models[
							this.plugin.settings.model as keyof typeof models
						] === "chat"
							? "none"
							: "";
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

	generateHistoryOptions(
		history_dropdown: DropdownComponent,
		history: GPTHistoryItem[]
	) {
		history_dropdown.addOption("History", "History");
		for (let i = history.length - 1; i >= 0; i--) {
			const prompt =
				(this.replaceTokensInHistory
					? history[i].processedPrompt
					: history[i].prompt) || history[i].prompt;
			if (prompt.length > 80) {
				history_dropdown.addOption(`${i}`, prompt.slice(0, 80) + "...");
				continue;
			}
			history_dropdown.addOption(`${i}`, prompt);
		}
	}

	useHistoryItem(item: GPTHistoryItem) {
		const prompt = this.replaceTokensInHistory
			? item.processedPrompt
			: item.prompt;
		this.promptField.setValue(prompt);
		this.prompt = prompt;
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
		const apiUrl = this.plugin.settings.apiUrl;

		if (!token) {
			new Notice("Please enter your OpenAI token in the plugin settings");
			this.generateButton.setDisabled(false);
			this.generateButton.setButtonText("Generate Notes");
			return;
		}

		const response = GPT3Model.generate(
			token,
			apiUrl ? apiUrl : "https://api.openai.com/v1",
			params
		);
		if (response === false) {
			this.generateButton.setDisabled(false);
			this.generateButton.setButtonText("Generate Notes");
			return;
		}

		this.plugin.history_handler.push({
			prompt: this.prompt,
			processedPrompt: this.processedPrompt,
			temperature: params.temperature,
			tokens: params.tokens,
		});

		this.close();
		this.plugin.showPreviewModal(params, response);
	}
}
