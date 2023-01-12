import {
	ButtonComponent,
	MarkdownView,
	Modal,
	TextAreaComponent,
} from "obsidian";
import GPT3Notes from "main";
import { GPT3ModelParams } from "types";

export class PreviewModal extends Modal {
	previewText: string;

	constructor(
		private plugin: GPT3Notes,
		private modelParams: GPT3ModelParams,
		private modelResponse: any
	) {
		super(plugin.app);
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.setText("Preview GPT-3 Note");

		const container = contentEl.createDiv();
		container.className = "gpt_preview-container";

		const text: string = this.modelResponse.choices[0].text as string;
		this.previewText = text.slice(2, text.length);

		const previewTextArea = new TextAreaComponent(container);
		previewTextArea.inputEl.className = "gpt_preview-textarea";
		previewTextArea.setValue(this.previewText);
		previewTextArea.onChange((change: string) => {
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
	}

	onClose(): void {}
}
