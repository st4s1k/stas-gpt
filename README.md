# Stas-GPT

Stas-GPT is an AI bot designed to provide responses to user messages using OpenAI API. The bot is implemented as a Cloudflare Worker, which handles incoming VKontakte (VK) message events and uses the OpenAI API to generate responses.

## Bot Setup

1. Install [Node.js](https://nodejs.org/en/) (version 14.x or newer) on your local machine.
2. Install [Wrangler CLI](https://developers.cloudflare.com/workers/cli-wrangler/install-update) (version 2.13.0 or newer) by running `npm install -g wrangler`.
3. Clone this repository to your local machine: `git clone https://github.com/st4s1k/stas-gpt.git`.
4. Change the current directory to the project folder: `cd stas-gpt`.
5. Install the required dependencies by running `npm install`.

### Configuring VK Community

To connect the Stas-GPT bot with a VK community, follow these steps:

1. Create a new VK community or use an existing one.
2. Go to the community's "Manage" section.
3. In the left-hand menu, select "API usage" and then click on "Create token."
4. Assign the necessary permissions for the bot, such as "messages" and "users." Save the token for later use in the `.dev.vars` file.
5. In the left-hand menu, select "Callback API" under the "API usage" section.
6. Set the API version to 5.131 or the version specified in the `wrangler.toml` file.
7. Add a server and enter the Cloudflare Worker`s URL as the server URL.
8. Save the server and copy the "Confirmation string" provided by VK.
9. In the `wrangler.toml` file, set the `VK_CONFIRMATION_CODE` value to the copied "Confirmation string."
10. Set up event types to handle by selecting "message_new" and any other required event types.
11. Save the settings in VK and proceed with the installation and setup of the Stas-GPT bot as described below.

### Creating and configuring the KV namespace
1. Create a new [KV namespace](https://developers.cloudflare.com/workers/wrangler/workers-kv/) in your Cloudflare account.
    ```sh
    wrangler kv:namespace create "STAS_GPT_KV"
    wrangler kv:namespace create "STAS_GPT_KV" --preview
    ```
2. Take note of the "Namespace ID" and "Preview Namespace ID" values.
3. Update the `wrangler.toml` file by replacing the values of `id` and `preview_id` for the `[[kv_namespaces]]` binding with the respective "Namespace ID" and "Preview Namespace ID" values you obtained in the previous step.

### Configuring environment variables
1. Create a new file named `.dev.vars` in the root directory of the project. This file will store your API tokens and should not be included in version control.
2. In the `.dev.vars` file, add your OpenAI API token and VK community API token in the following format:

    ```sh
    OPENAI_API_TOKEN=your_openai_api_token
    VK_COMMUNITY_API_TOKEN=your_vk_community_api_token
    ```

3. Save the `.dev.vars` file and close it.

### Deploying the bot
1. Deploy the bot to Cloudflare Workers using `npm run deploy`.

## Usage

- Start the local development server using `npm run start`. This allows you to test and debug the worker locally.
- Deploy the project to Cloudflare using `npm run deploy`.
- To build the project without deploying, use `npm run build`. The build artifacts will be generated in the `dist` folder.
- Tail the worker logs in real-time using `npm run tail`.

## Dependencies

- [node-fetch](https://www.npmjs.com/package/node-fetch) (v3.3.1): A light-weight module that brings window.fetch to Node.js
- [@cloudflare/workers-types](https://www.npmjs.com/package/@cloudflare/workers-types) (v4.20230321.0): TypeScript declarations for Cloudflare Workers
- [@typescript-eslint/eslint-plugin](https://www.npmjs.com/package/@typescript-eslint/eslint-plugin) (v5.57.0): TypeScript plugin with TSLint rules for ESLint
- [@typescript-eslint/parser](https://www.npmjs.com/package/@typescript-eslint/parser) (v5.57.0): TypeScript parser for ESLint
- [eslint](https://www.npmjs.com/package/eslint) (v8.37.0): JavaScript and TypeScript linter
- [npm](https://www.npmjs.com/package/npm) (v9.6.2): Node package manager
- [rollup-plugin-node-polyfills](https://www.npmjs.com/package/rollup-plugin-node-polyfills) (v0.2.1): Rollup plugin for Node.js built-in modules
- [typescript](https://www.npmjs.com/package/typescript) (v5.0.3): TypeScript language compiler
- [wrangler](https://www.npmjs.com/package/wrangler) (v2.13.0): Command-line tool for managing and deploying Cloudflare Workers

## License

This project is released under the MIT License. See the [LICENSE](LICENSE) file for details.

(README.md (and most of the code) generated with the help of [GPT-4](https://chat.openai.com/chat))
