import { GPT3Model } from "GPT3";
import {
	ButtonComponent,
	MarkdownView,
	Modal,
	Notice,
	TextAreaComponent,
} from "obsidian";
import GPT3Notes from "main";
import { GPT3ModelParams } from "types";
import { models } from "SettingsView";
import { PluginModal } from "PluginModal";

export class PreviewModal extends Modal {
	previewText: string;
	previewTextArea: TextAreaComponent;
	regenerateButton: ButtonComponent;

	constructor(
		private plugin: GPT3Notes,
		private modelParams: GPT3ModelParams,
		private stream: any
	) {
		super(plugin.app);
	}

	syncPreview(): void {
		this.previewTextArea.setValue(
			this.previewText.substring(2, this.previewText.length)
		);
	}

	loadStream(): void {
		this.stream.addEventListener("message", (e: any) => {
			try {
				const text = this.parseTextResponse(e);
				if (text) {
					this.previewText += text;
				}
				this.syncPreview();
			} catch (e: any) {
				return;
			}
		});
		this.stream.addEventListener("error", (e: any) => {
			new Notice(
				"OpenAI returned an error. Try modifying your paramters and try again."
			);
		});
		this.stream.addEventListener("readystatechange", (e: any) => {
			if (e.readyState === this.stream.CLOSED) {
				this.regenerateButton.buttonEl.style.backgroundColor =
					"#218c74";
				this.regenerateButton.setButtonText("Regenerate");
			}
			if (e.readyState === this.stream.OPEN) {
				this.regenerateButton.buttonEl.style.backgroundColor =
					"#b33939";
				this.regenerateButton.setButtonText("Stop");
			}
		});
		this.stream.stream();
	}

	parseTextResponse(e: any): string {
		const modelType = models[this.modelParams.model as keyof typeof models];
		const data = JSON.parse(e.data);
		const choice = data.choices[0];

		if (modelType === "text") {
			return choice.text;
		} else if (modelType === "chat") {
			return choice.delta.content;
		}

		return "";
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.setText("Preview GPT-3 Note");

		const container = contentEl.createDiv();
		container.className = "gpt_preview-container";

		// const text: string = this.modelResponse.choices[0].text as string;
		// this.previewText = text.slice(2, text.length);
		this.previewText = "";

		this.previewTextArea = new TextAreaComponent(container);
		this.previewTextArea.inputEl.className = "gpt_preview-textarea";
		this.previewTextArea.setPlaceholder("Loading...");
		this.previewTextArea.onChange((change: string) => {
			this.previewText = change;
		});

		const buttonContainer = contentEl.createDiv();
		buttonContainer.className = "gpt_preview-button-container";

		const cancelButton = new ButtonComponent(buttonContainer);
		cancelButton.buttonEl.style.backgroundColor = "#b33939";
		cancelButton.buttonEl.style.marginRight = "auto";
		cancelButton.setButtonText("Go Back").onClick(() => {
			this.close();
			new PluginModal(this.plugin, { loadLastItem: true }).open();
		});

		this.regenerateButton = new ButtonComponent(buttonContainer);
		this.regenerateButton.buttonEl.style.backgroundColor = "#218c74";
		this.regenerateButton.setButtonText("Regenerate").onClick(() => {
			this.handleRegenerateClick().then((response: any) => {
				if (response) {
					this.previewText = "";
					this.syncPreview();
					this.stream.stream();
				}
			});
		});

		const addToDocumentButton = new ButtonComponent(buttonContainer);
		addToDocumentButton.buttonEl.style.backgroundColor = "#218c74";
		addToDocumentButton.setButtonText("Add to document").onClick(() => {
			const view =
				this.plugin.app.workspace.getActiveViewOfType(MarkdownView);

			if (view) {
				this.close();
				let newText =
					view.editor.getSelection().length > 0
						? view.editor.getSelection() + "\n\n" + this.previewText
						: this.previewText;
				view.editor.replaceSelection(newText);
			}
		});

		this.loadStream();
	}

	onClose(): void {}

	async handleRegenerateClick() {
		if (this.stream.readyState === this.stream.OPEN) {
			this.stream.close();
			return;
		}
		this.regenerateButton.setButtonText("Regenerating...");

		const params: GPT3ModelParams = {
			...this.plugin.settings.promptHistory[0],
			model: this.plugin.settings.model,
		};

		const token = this.plugin.settings.token as string;

		const response = GPT3Model.generate(token, params);
		return response;
	}
}
