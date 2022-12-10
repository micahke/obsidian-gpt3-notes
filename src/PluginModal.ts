import { GPT3Model } from "GPT3";
import GPT3Notes from "main";
import {
	ButtonComponent,
	DropdownComponent,
	Modal,
	Notice,
	Setting,
	SliderComponent,
	TextAreaComponent,
} from "obsidian";
import { models } from "SettingsView";
import { GPT3ModelParams } from "types";

export class PluginModal extends Modal {
	prompt: string;

	generateButton: ButtonComponent;

	constructor(private plugin: GPT3Notes) {
		super(plugin.app);
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.setText("Create a GPT-3 Note");

		const container = contentEl.createDiv();
		container.style.width = "100%";
		container.style.marginTop = "20px";

		const promptField = new TextAreaComponent(container);
		promptField.inputEl.style.width = "100%";
		promptField.inputEl.style.minHeight = "100px";
		promptField.inputEl.style.width = "100%";
		promptField.inputEl.style.padding = "10px";
		promptField.inputEl.style.fontSize = "16px";
		promptField.setPlaceholder("Enter your prompt...");
		promptField.onChange((change) => {
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

	async handleGenerateClick() {
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
