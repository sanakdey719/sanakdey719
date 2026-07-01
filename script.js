/* ===================================================
   script.js
   Handles UI rendering, events, and localStorage persistence.
   All AI API calls are delegated to assistant.js
   =================================================== */

// ---------- DOM references ----------
const sidebar = document.getElementById("sidebar");
const chatList = document.getElementById("chatList");
const messagesEl = document.getElementById("messages");
const emptyState = document.getElementById("emptyState");
const inputForm = document.getElementById("inputForm");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const chatTitle = document.getElementById("chatTitle");

const newChatBtn = document.getElementById("newChatBtn");
const settingsBtn = document.getElementById("settingsBtn");
const clearAllBtn = document.getElementById("clearAllBtn");
const clearChatsBtn = document.getElementById("clearChatsBtn");
const exportBtn = document.getElementById("exportBtn");
const menuToggle = document.getElementById("menuToggle");
const sidebarBackdrop = document.getElementById("sidebarBackdrop");

const settingsModal = document.getElementById("settingsModal");
const providerSelect = document.getElementById("providerSelect");
const apiKeyInput = document.getElementById("apiKeyInput");
const modelInput = document.getElementById("modelInput");
const modelHint = document.getElementById("modelHint");
const systemPromptInput = document.getElementById("systemPromptInput");
const saveSettingsBtn = document.getElementById("saveSettingsBtn");
const closeSettingsBtn = document.getElementById("closeSettingsBtn");

// ---------- Storage keys ----------
const STORAGE_KEYS = {
  CONVERSATIONS: "ai_assistant_conversations",
  SETTINGS: "ai_assistant_settings",
  ACTIVE_CHAT: "ai_assistant_active_chat"
};

// ---------- Default model / hint per provider ----------
const PROVIDER_DEFAULTS = {
  anthropic: { model: "claude-sonnet-4-6", hint: "Anthropic example: claude-sonnet-4-6" },
  openai: { model: "gpt-4o", hint: "OpenAI example: gpt-4o" },
  groq: { model: "llama-3.3-70b-versatile", hint: "Groq example: llama-3.3-70b-versatile" }
};

// ---------- State ----------
let state = {
  conversations: [],   // [{ id, title, messages: [{role, content}] }]
  activeChatId: null,
  settings: {
    provider: "anthropic",
    apiKey: "",
    model: "claude-sonnet-4-6",
    systemPrompt: "You are a helpful, friendly AI assistant. Give clear and direct answers."
  }
};

// ---------- Persistence helpers ----------
function loadState() {
  try {
    const conv = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
    state.conversations = conv ? JSON.parse(conv) : [];

    const settings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (settings) {
      state.settings = { ...state.settings, ...JSON.parse(settings) };
    }

    const activeId = localStorage.getItem(STORAGE_KEYS.ACTIVE_CHAT);
    state.activeChatId = activeId || null;
  } catch (err) {
    console.error("Failed to load saved data:", err);
    // If stored data is corrupted, reset it so the app doesn't crash
    state.conversations = [];
    state.activeChatId = null;
  }
}

function saveConversations() {
  localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(state.conversations));
}

function saveSettings() {
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(state.settings));
}

function saveActiveChat() {
  if (state.activeChatId) {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_CHAT, state.activeChatId);
  }
}

// ---------- Conversation helpers ----------
function getActiveChat() {
  return state.conversations.find(c => c.id === state.activeChatId) || null;
}

function createNewChat() {
  const chat = {
    id: "chat_" + Date.now(),
    title: "New Chat",
    messages: []
  };
  state.conversations.unshift(chat);
  state.activeChatId = chat.id;
  saveConversations();
  saveActiveChat();
  renderChatList();
  renderMessages();
}

function deleteChat(id, evt) {
  evt.stopPropagation();
  state.conversations = state.conversations.filter(c => c.id !== id);
  if (state.activeChatId === id) {
    state.activeChatId = state.conversations[0]?.id || null;
  }
  saveConversations();
  saveActiveChat();
  renderChatList();
  renderMessages();
}

function switchChat(id) {
  state.activeChatId = id;
  saveActiveChat();
  renderChatList();
  renderMessages();
  closeSidebar();
}

// ---------- Rendering ----------
function renderChatList() {
  chatList.innerHTML = "";
  state.conversations.forEach(chat => {
    const item = document.createElement("div");
    item.className = "chat-item" + (chat.id === state.activeChatId ? " active" : "");
    item.innerHTML = `
      <span>${escapeHtml(chat.title)}</span>
      <span class="delete-x" data-id="${chat.id}">✕</span>
    `;
    item.addEventListener("click", () => switchChat(chat.id));
    item.querySelector(".delete-x").addEventListener("click", (e) => deleteChat(chat.id, e));
    chatList.appendChild(item);
  });
}

function renderMessages() {
  const chat = getActiveChat();
  messagesEl.innerHTML = "";

  if (!chat || chat.messages.length === 0) {
    chatTitle.textContent = chat ? chat.title : "New Chat";
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.innerHTML = "<h2>How can I help you today?</h2><p>Type your message below to start the conversation.</p>";
    messagesEl.appendChild(empty);
    return;
  }

  chatTitle.textContent = chat.title;

  chat.messages.forEach(msg => {
    messagesEl.appendChild(buildMessageEl(msg.role, msg.content));
  });

  scrollToBottom();
}

// Parses content into a mix of plain-text and fenced-code segments.
// Returns an array of { type: "text"|"code", content, lang }
function parseMessageContent(content) {
  const segments = [];
  const codeBlockRegex = /```(\w*)\n?([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: "text", content: content.slice(lastIndex, match.index) });
    }
    segments.push({ type: "code", lang: match[1] || "", content: match[2].replace(/\n$/, "") });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    segments.push({ type: "text", content: content.slice(lastIndex) });
  }

  return segments.length ? segments : [{ type: "text", content }];
}

function buildMessageEl(role, content) {
  const wrap = document.createElement("div");
  wrap.className = `message ${role}`;

  const avatar = document.createElement("div");
  avatar.className = "avatar";
  avatar.textContent = role === "user" ? "🧑" : "🤖";

  const bubble = document.createElement("div");
  bubble.className = "bubble";

  const segments = parseMessageContent(content);

  segments.forEach(seg => {
    if (seg.type === "code") {
      bubble.appendChild(buildCodeBlockEl(seg.lang, seg.content));
    } else if (seg.content.trim() !== "" || segments.length === 1) {
      const p = document.createElement("div");
      p.className = "text-segment";
      p.textContent = seg.content.trim();
      bubble.appendChild(p);
    }
  });

  wrap.appendChild(avatar);
  wrap.appendChild(bubble);
  return wrap;
}

function buildCodeBlockEl(lang, code) {
  const block = document.createElement("div");
  block.className = "code-block";

  const header = document.createElement("div");
  header.className = "code-block-header";

  const langLabel = document.createElement("span");
  langLabel.className = "code-lang";
  langLabel.textContent = lang || "code";

  const copyBtn = document.createElement("button");
  copyBtn.className = "code-copy-btn";
  copyBtn.textContent = "Copy";
  copyBtn.addEventListener("click", () => {
    navigator.clipboard?.writeText(code).then(() => {
      copyBtn.textContent = "Copied!";
      setTimeout(() => (copyBtn.textContent = "Copy"), 1500);
    });
  });

  header.appendChild(langLabel);
  header.appendChild(copyBtn);

  const pre = document.createElement("pre");
  const codeEl = document.createElement("code");
  codeEl.textContent = code;
  pre.appendChild(codeEl);

  block.appendChild(header);
  block.appendChild(pre);
  return block;
}

function showTypingIndicator() {
  const wrap = document.createElement("div");
  wrap.className = "message assistant";
  wrap.id = "typingIndicator";
  wrap.innerHTML = `
    <div class="avatar">🤖</div>
    <div class="bubble typing-dots"><span></span><span></span><span></span></div>
  `;
  messagesEl.appendChild(wrap);
  scrollToBottom();
}

function removeTypingIndicator() {
  document.getElementById("typingIndicator")?.remove();
}

function scrollToBottom() {
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// ---------- Sending messages ----------
async function handleSend(e) {
  e.preventDefault();
  const text = userInput.value.trim();
  if (!text) return;

  let chat = getActiveChat();
  if (!chat) {
    createNewChat();
    chat = getActiveChat();
  }

  // Add and save the user's message
  chat.messages.push({ role: "user", content: text });

  // Update chat title from the first message
  if (chat.messages.length === 1) {
    chat.title = text.slice(0, 40) + (text.length > 40 ? "..." : "");
  }

  saveConversations();
  renderChatList();
  renderMessages();

  userInput.value = "";
  autoResize();
  sendBtn.disabled = true;
  showTypingIndicator();

  try {
    const reply = await Assistant.sendMessage({
      provider: state.settings.provider,
      apiKey: state.settings.apiKey,
      model: state.settings.model,
      systemPrompt: state.settings.systemPrompt,
      messages: chat.messages
    });

    chat.messages.push({ role: "assistant", content: reply });
    saveConversations();
  } catch (err) {
    chat.messages.push({
      role: "assistant",
      content: "⚠️ Error: " + err.message
    });
    saveConversations();
  } finally {
    removeTypingIndicator();
    renderMessages();
    sendBtn.disabled = false;
  }
}

function autoResize() {
  userInput.style.height = "auto";
  userInput.style.height = Math.min(userInput.scrollHeight, 160) + "px";
}

// ---------- Settings modal ----------
function updateModelHint(provider) {
  const def = PROVIDER_DEFAULTS[provider] || PROVIDER_DEFAULTS.anthropic;
  if (modelHint) modelHint.textContent = def.hint;
  if (modelInput) modelInput.placeholder = "e.g. " + def.model;
}

function openSettings() {
  providerSelect.value = state.settings.provider;
  apiKeyInput.value = state.settings.apiKey;
  modelInput.value = state.settings.model;
  systemPromptInput.value = state.settings.systemPrompt;
  updateModelHint(state.settings.provider);
  settingsModal.classList.add("open");
}

function closeSettings() {
  settingsModal.classList.remove("open");
}

function saveSettingsFromModal() {
  state.settings.provider = providerSelect.value;
  state.settings.apiKey = apiKeyInput.value.trim();
  state.settings.model = modelInput.value.trim() || PROVIDER_DEFAULTS[providerSelect.value]?.model || "";
  state.settings.systemPrompt = systemPromptInput.value.trim();
  saveSettings();
  closeSettings();
}

// ---------- Export / Clear data ----------
function exportData() {
  const exportObj = {
    conversations: state.conversations,
    exportedAt: new Date().toISOString()
  };
  const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "ai-assistant-chats.json";
  a.click();
  URL.revokeObjectURL(url);
}

// Deletes only the chat history — settings and API key are left untouched
function clearAllChats() {
  const confirmed = confirm("Are you sure? All chats will be deleted, but your Settings and API key will stay saved. This cannot be undone.");
  if (!confirmed) return;

  localStorage.removeItem(STORAGE_KEYS.CONVERSATIONS);
  localStorage.removeItem(STORAGE_KEYS.ACTIVE_CHAT);

  state.conversations = [];
  state.activeChatId = null;

  createNewChat();
  closeSidebar();
}

function clearAllData() {
  const confirmed = confirm("Are you sure? All chat history and settings will be deleted. This cannot be undone.");
  if (!confirmed) return;

  localStorage.removeItem(STORAGE_KEYS.CONVERSATIONS);
  localStorage.removeItem(STORAGE_KEYS.SETTINGS);
  localStorage.removeItem(STORAGE_KEYS.ACTIVE_CHAT);

  state.conversations = [];
  state.activeChatId = null;
  renderChatList();
  renderMessages();
}

// ---------- Event listeners ----------
inputForm.addEventListener("submit", handleSend);

userInput.addEventListener("input", autoResize);

newChatBtn.addEventListener("click", createNewChat);
settingsBtn.addEventListener("click", openSettings);
closeSettingsBtn.addEventListener("click", closeSettings);
saveSettingsBtn.addEventListener("click", saveSettingsFromModal);
clearAllBtn.addEventListener("click", clearAllData);
clearChatsBtn.addEventListener("click", clearAllChats);
exportBtn.addEventListener("click", exportData);

function openSidebar() {
  sidebar.classList.add("open");
  sidebarBackdrop?.classList.add("open");
}

function closeSidebar() {
  sidebar.classList.remove("open");
  sidebarBackdrop?.classList.remove("open");
}

function toggleSidebar() {
  if (sidebar.classList.contains("open")) {
    closeSidebar();
  } else {
    openSidebar();
  }
}

menuToggle.addEventListener("click", toggleSidebar);
sidebarBackdrop?.addEventListener("click", closeSidebar);

providerSelect.addEventListener("change", () => {
  updateModelHint(providerSelect.value);
  const def = PROVIDER_DEFAULTS[providerSelect.value];
  if (def) modelInput.value = def.model;
});

settingsModal.addEventListener("click", (e) => {
  if (e.target === settingsModal) closeSettings();
});

// ---------- Init ----------
function init() {
  loadState();

  if (state.conversations.length === 0) {
    createNewChat();
  } else {
    if (!getActiveChat()) {
      state.activeChatId = state.conversations[0].id;
    }
    renderChatList();
    renderMessages();
  }
}

init();
