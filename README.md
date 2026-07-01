# My AI Assistant

A ChatGPT-style chat app — fully yours, runs entirely in the browser, no server needed.

## File Structure

```
ai-assistant/
├── index.html      → Page structure (UI elements)
├── style.css        → Styling (dark theme)
├── script.js         → UI logic + localStorage data persistence
├── assistant.js    → AI API calling logic only (Anthropic/OpenAI/Groq)
└── README.md      → This file
```

## How to Run

1. Keep the entire `ai-assistant` folder together on your phone (in Acode or any file manager)
2. Open `index.html` in any browser (Chrome/Firefox)
   - or use Acode's Live Preview feature
3. On first launch, click **⚙️ Settings** in the top right:
   - Choose your **Provider**: Anthropic (Claude), OpenAI (ChatGPT), or **Groq**
   - Enter your **API Key** (see below for where to get one)
   - Enter the **Model** name (e.g. `claude-sonnet-4-6`, `gpt-4o`, or `llama-3.3-70b-versatile`)
   - Set the **System Prompt** to define how your assistant behaves
4. Save and start chatting

## Where to Get an API Key

- **Anthropic (Claude):** https://console.anthropic.com/ → API Keys
- **OpenAI (ChatGPT):** https://platform.openai.com/api-keys
- **Groq:** https://console.groq.com/keys

⚠️ Note: using an API key incurs a small pay-as-you-go cost per message (Groq currently offers a generous free tier), but it's typically much cheaper than a ChatGPT/Claude subscription for normal use.

## About Groq

Groq doesn't make its own AI models — it runs open models (like Meta's Llama, and others) on extremely fast custom hardware ("LPUs"), so responses come back noticeably faster than most providers. It uses an OpenAI-compatible API, so in this app it works just like OpenAI mode, just pointed at Groq's servers.

Some popular Groq model names (check https://console.groq.com/docs/models for the current list):
- `llama-3.3-70b-versatile` — strong general-purpose model
- `llama-3.1-8b-instant` — smaller, very fast, cheaper
- `mixtral-8x7b-32768` — long context window (may be deprecated, check docs)

## Where Your Data Is Stored

All chat history, settings, and your API key are stored in your browser's **localStorage** — meaning it stays on your phone, nothing is sent to any external server except the AI provider you chose. Clearing your browser cache/data will erase this, so use the **⬇️ Export** button occasionally to back up your chats.

## Features

- ✅ Multiple chats/conversations, each saved and managed separately
- ✅ Chat history auto-saves (won't be lost on refresh or app close)
- ✅ Three providers supported: Anthropic, OpenAI, and Groq
- ✅ Custom System Prompt to control the assistant's personality/style
- ✅ Mobile-friendly responsive design
- ✅ Export data as JSON
- ✅ One-click clear all data
- ✅ Error handling — if stored data is corrupted, the app resets it instead of crashing

## A Note on "No Restrictions"

These providers' APIs enforce their own safety rules — these can't be fully bypassed by a developer, and attempting to do so would violate that provider's Terms of Service (which could get your API key banned). However, the **System Prompt** lets you shape the assistant's tone, style, personality, and response format quite extensively — that's the most realistic and effective way to customize its behavior.

## Ideas for What to Add Next

- Voice input/output (Web Speech API)
- File upload support
- Multi-language UI toggle
- Light/dark theme switcher
- Streaming responses (token-by-token, instead of waiting for the full reply)
