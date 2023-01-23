import GPT3Notes from "../src/main";
import SettingsView from "../src/SettingsView";

jest.mock("../src/SettingsView", () => {
	return jest.fn().mockImplementation(() => {
		return {
			display: jest.fn().mockReturnValue(true),
		};
	});
});

describe("SettingsView:display", () => {
	it("should return true", () => {
		let settingsView = new SettingsView({} as GPT3Notes);
		expect(settingsView.display()).toBe(true);
	});

	it("should clear the container element", () => {
		let containerEl = {
			empty: jest.fn(),
		};
		let settingsView = new SettingsView({} as GPT3Notes);
		settingsView.display();
		expect(containerEl.empty).toHaveBeenCalled();
	});
});
