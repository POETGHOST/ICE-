(() => {
  const form = document.getElementById('message-form');
  const input = document.getElementById('message-input');
  const list = document.getElementById('messages');
  const conversation = document.getElementById('conversation');
  const welcome = document.getElementById('welcome');
  const status = document.getElementById('connection-status');
  const storageNote = document.getElementById('storage-note');
  const storageKey = 'ice-chat-messages-v1';
  const searchBar = document.getElementById('search-bar');
  const searchInput = document.getElementById('search-input');
  const emojiPicker = document.getElementById('emoji-picker');
  let socket = null;
  let online = false;
  let localMessages = readMessages();

  function readMessages() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
      return Array.isArray(saved) ? saved : [];
    } catch (error) {
      return [];
    }
  }

  function updateActivity() {
    const bubbles = list.querySelectorAll('.message-bubble');
    let characters = 0;
    bubbles.forEach((bubble) => { characters += bubble.textContent.length; });
    document.getElementById('message-count').textContent = String(bubbles.length);
    document.getElementById('character-count').textContent = `${characters.toLocaleString()} characters exchanged`;
    document.getElementById('activity-fill').style.width = `${Math.min(100, bubbles.length * 10)}%`;
    welcome.hidden = bubbles.length > 0;
  }

  function renderMessage(message, isLocal) {
    const text = String(message && typeof message === 'object' ? message.text : message);
    const item = document.createElement('li');
    item.className = `message${isLocal ? ' message-local' : ''}`;
    const bubble = document.createElement('p');
    bubble.className = 'message-bubble';
    bubble.textContent = text;
    item.appendChild(bubble);
    const timeValue = message && typeof message === 'object' && message.time ? message.time : new Date().toISOString();
    const time = document.createElement('time');
    time.className = 'message-time';
    time.dateTime = timeValue;
    time.textContent = new Date(timeValue).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    item.appendChild(time);
    list.appendChild(item);
    updateActivity();
    applySearch();
    conversation.scrollTop = conversation.scrollHeight;
  }

  function showLocalMode() {
    online = false;
    status.textContent = 'On this device';
    document.getElementById('chat-subtitle').textContent = 'A quiet place for your thoughts';
    storageNote.textContent = 'Saved on this device · only you can see this local chat';
  }

  function startSocketIfAvailable() {
    if (!/^https?:$/.test(window.location.protocol)) return;
    const script = document.createElement('script');
    script.src = '/socket.io/socket.io.js';
    script.onload = () => {
      if (!window.io) return;
      try {
        socket = window.io();
        status.textContent = 'Connecting…';
        socket.on('connect', () => {
          online = true;
          status.textContent = 'Live';
          document.getElementById('chat-subtitle').textContent = 'Messages shared with connected browsers';
          storageNote.textContent = 'Live chat · messages are shared with everyone connected';
        });
        socket.on('disconnect', showLocalMode);
        socket.on('connect_error', showLocalMode);
        socket.on('chat message', (text) => renderMessage(text, false));
      } catch (error) {
        showLocalMode();
      }
    };
    script.onerror = showLocalMode;
    document.head.appendChild(script);
  }

  function updateClock() {
    const now = new Date();
    document.getElementById('local-time').textContent = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    document.getElementById('local-date').textContent = now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
  }

  function openSearch() {
    searchBar.hidden = false;
    searchInput.focus();
  }

  function applySearch() {
    const query = searchInput.value.trim().toLocaleLowerCase();
    const items = [...list.children];
    let matches = 0;
    items.forEach((item) => {
      const found = !query || item.textContent.toLocaleLowerCase().includes(query);
      item.hidden = !found;
      if (found && query) matches += 1;
    });
    document.getElementById('search-count').textContent = query ? `${matches} found` : '';
  }

  localMessages.forEach((message) => renderMessage(message, true));
  showLocalMode();
  startSocketIfAvailable();
  updateClock();
  window.setInterval(updateClock, 30_000);

  document.getElementById('search-toggle').addEventListener('click', openSearch);
  document.getElementById('mobile-search').addEventListener('click', openSearch);
  document.getElementById('rail-search').addEventListener('click', openSearch);
  document.getElementById('search-close').addEventListener('click', () => {
    searchBar.hidden = true;
    searchInput.value = '';
    applySearch();
  });
  searchInput.addEventListener('input', applySearch);

  const toggleEmojiPicker = () => {
    emojiPicker.hidden = !emojiPicker.hidden;
  };
  document.getElementById('emoji-button').addEventListener('click', toggleEmojiPicker);
  document.getElementById('rail-emoji').addEventListener('click', toggleEmojiPicker);
  emojiPicker.querySelectorAll('button').forEach((button) => {
    button.addEventListener('click', () => {
      const emoji = button.textContent;
      const start = input.selectionStart ?? input.value.length;
      const end = input.selectionEnd ?? input.value.length;
      input.value = input.value.slice(0, start) + emoji + input.value.slice(end);
      input.focus();
      input.setSelectionRange(start + emoji.length, start + emoji.length);
      emojiPicker.hidden = true;
    });
  });

  const fileInput = document.getElementById('file-input');
  const openFilePicker = () => fileInput.click();
  document.getElementById('attach-button').addEventListener('click', openFilePicker);
  document.getElementById('rail-attach').addEventListener('click', openFilePicker);
  fileInput.addEventListener('change', () => {
    const file = fileInput.files && fileInput.files[0];
    if (file) {
      input.value = `📎 ${file.name} (${formatBytes(file.size)})`;
      input.focus();
    }
    fileInput.value = '';
  });

  function formatBytes(bytes) {
    if (!bytes) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const index = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
    return `${(bytes / (1024 ** index)).toFixed(index ? 1 : 0)} ${units[index]}`;
  }

  document.getElementById('clear-history').addEventListener('click', () => {
    if (!list.children.length || !window.confirm('Clear the messages shown in this chat and saved on this browser?')) return;
    localMessages = [];
    try { localStorage.removeItem(storageKey); } catch (error) { storageNote.textContent = 'Could not clear local chat history.'; }
    list.replaceChildren();
    updateActivity();
    applySearch();
  });

  document.getElementById('theme-toggle').addEventListener('click', () => {
    document.body.classList.toggle('light-theme');
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    if (socket && online) {
      socket.emit('chat message', text);
    } else {
      const message = { text, time: new Date().toISOString() };
      localMessages.push(message);
      try { localStorage.setItem(storageKey, JSON.stringify(localMessages)); }
      catch (error) { storageNote.textContent = 'Could not save chat history in this browser.'; }
      renderMessage(message, true);
    }
    input.value = '';
    input.focus();
    emojiPicker.hidden = true;
  });
})();
