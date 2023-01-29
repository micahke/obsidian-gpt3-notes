import {
	ButtonComponent,
	MarkdownView,
	Modal,
	Notice,
	TextAreaComponent,
} from "obsidian";
import GPT3Notes from "main";
import { GPT3ModelParams } from "types";

export class PreviewModal extends Modal {
	previewText: string;
	previewTextArea: TextAreaComponent;

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
				let data = JSON.parse(e.data);
				let choice = data.choices[0];
				let text = choice.text;
				this.previewText += text as string;
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
		this.stream.stream();
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
		cancelButton.setButtonText("Cancel").onClick(() => {
			this.close();
		});

		const generateButton = new ButtonComponent(buttonContainer);
		generateButton.buttonEl.style.backgroundColor = "#218c74";
		generateButton.setButtonText("Add to document").onClick(() => {
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
}
