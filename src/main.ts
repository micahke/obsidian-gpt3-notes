import CommandHandler from "CommandHandler";
import { EventHandler } from "EventHandler";
import { HistoryHandler } from "HistoryHandler";
import { Editor, Menu, Modal, Notice, Plugin, View } from "obsidian";
import { PluginModal } from "PluginModal";
import { PreviewModal } from "PreviewModal";
import SettingsView, { models } from "SettingsView";
import { GPT3ModelParams, GPTHistoryItem } from "types";

// Remember to rename these classes and interfaces!

interface GPT3_NOTES_SETTINGS {
	appName: string;
	token: string | null;
	model: string;
	tokens: number;
	temperature: number;
	promptHistory: GPTHistoryItem[];
}

const DEFAULT_SETTINGS: GPT3_NOTES_SETTINGS = {
	appName: "GP3_NOTES",
	token: null,
	model: models[0],
	tokens: 300,
	temperature: 5,
	promptHistory: [],
};

export default class GPT3Notes extends Plugin {
	settings: GPT3_NOTES_SETTINGS;
	event_handler: EventHandler;
	settings_view: SettingsView;
	command_handler: CommandHandler;
	history_handler: HistoryHandler;

	// Executed when the app is first loaded
	async onload() {
		await this.loadSettings();

		this.settings_view = new SettingsView(this);
		this.command_handler = new CommandHandler(this);
		this.command_handler.setup();
		this.history_handler = new HistoryHandler(this);

		this.addSettingTab(this.settings_view);
		this.registerRibbonButtons();
	}

	onunload() {}

	// Registers the ribbon button
	private registerRibbonButtons() {
		const ribbonIcon = this.addRibbonIcon(
			"bot",
			"GPT-3 Notes",
			(evt: MouseEvent) => {
				new PluginModal(this).open();
			}
		);
	}

	showPreviewModal(modelParams: GPT3ModelParams, response: any) {
		new PreviewModal(this, modelParams, response).open();
	}

	// Loads the settings from memory
	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	// Save the settings after the session settings have been changed
	async saveSettings() {
		await this.saveData(this.settings);
	}
}
