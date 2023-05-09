# Obsidian GPT-3 Notes

To download Obsidian: [Click here](https://www.obsidian.md)

To view the plugin page: [Click here](https://obsidian.md/plugins?id=gpt3-notes)

![build](https://github.com/micahke/obsidian-gpt3-notes/actions/workflows/build.yml/badge.svg)

This plugin improves your Obsidian workflow by helping you generate notes using OpenAI's GPT-3 language model. The plugin also has support for older language models as well.

## Setup

In order to configure up the plugin, you must first set your OpenAI API key in the plugin settings.

1. Generate an OpenAI API key [here](https://beta.openai.com/account/api-keys).
2. In Obsidian, go to `Settings` and select `GPT-3 Notes` from the `Community Plugins` folder in the left menu.
3. Set your key in the `OpenAI API Key` field.

## Usage

GPT-3 is capable of generating many different types of notes. As of now, the output may need a small amount of reformatting after being inserted into the Obsidian document. The plugin can be accessed through the Obsidian ribbon on the left. The plugin is also available through the Obsidian command "Create GPT-3 Note". This can also be mapped to a keyboard shortcut. Some helpful prompts are:

> Write bullet points about...

> Write 5-10 dashed notes about..

> Write an article about ... with sources

> Write 3 paragraphs about...

> Write an essay outline about

Loading time has been cut out a bit but here's an example:

![usage](https://github.com/micahke/obsidian-gpt3-notes/raw/master/example.gif)

## Contributing

I'm not very smart so community help would go a long way in making sure new ideas can be added to the plugin. To get started, clone the repo to the plugins folder in an Obsidian vault. You can find more about this on the main Obsidian developer's page. To install dependencies, run:

```zsh
npm install
```

That's basically it for now.
