/* ===================================================
   assistant.js
   This file ONLY handles communication with the AI API.
   No UI code here — just request/response handling.
   =================================================== */

const Assistant = (() => {

  /**
   * Sends a request to the Anthropic (Claude) API
   */
  async function callAnthropic({ apiKey, model, systemPrompt, messages }) {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true"
      },
      body: JSON.stringify({
        model: model || "claude-sonnet-4-6",
        max_tokens: 2000,
        system: systemPrompt || undefined,
        messages: messages.map(m => ({ role: m.role, content: m.content }))
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Anthropic API error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const textBlock = data.content?.find(c => c.type === "text");
    return textBlock ? textBlock.text : "(No response received)";
  }

  /**
   * Sends a request to the OpenAI (ChatGPT) API
   */
  async function callOpenAI({ apiKey, model, systemPrompt, messages }) {
    const chatMessages = [];
    if (systemPrompt) {
      chatMessages.push({ role: "system", content: systemPrompt });
    }
    chatMessages.push(...messages.map(m => ({ role: m.role, content: m.content })));

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model || "gpt-4o",
        messages: chatMessages
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenAI API error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "(No response received)";
  }

  /**
   * Sends a request to the Groq API.
   * Groq exposes an OpenAI-compatible /chat/completions endpoint,
   * so the request/response shape is identical to OpenAI's — only
   * the base URL and default model differ.
   */
  async function callGroq({ apiKey, model, systemPrompt, messages }) {
    const chatMessages = [];
    if (systemPrompt) {
      chatMessages.push({ role: "system", content: systemPrompt });
    }
    chatMessages.push(...messages.map(m => ({ role: m.role, content: m.content })));

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model || "llama-3.3-70b-versatile",
        messages: chatMessages
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Groq API error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "(No response received)";
  }

  /**
   * Routes the request to the correct provider function.
   * messages format: [{ role: "user"|"assistant", content: "..." }, ...]
   */
  async function sendMessage({ provider, apiKey, model, systemPrompt, messages }) {
    if (!apiKey) {
      throw new Error("No API key set. Please add your API key in Settings.");
    }

    if (provider === "openai") {
      return callOpenAI({ apiKey, model, systemPrompt, messages });
    }
    if (provider === "groq") {
      return callGroq({ apiKey, model, systemPrompt, messages });
    }
    return callAnthropic({ apiKey, model, systemPrompt, messages });
  }

  return { sendMessage };
})();
