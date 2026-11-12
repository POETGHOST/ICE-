(() => {
  const form = document.getElementById('message-form');
  const input = document.getElementById('message-input');
  const list = document.getElementById('messages');
  const welcome = document.getElementById('welcome');
  const status = document.getElementById('connection-status');
  const storageNote = document.getElementById('storage-note');
  const storageKey = 'ice-chat-messages-v1';
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

  function renderMessage(message, isLocal) {
    const item = document.createElement('li');
    item.className = `message${isLocal ? ' message-local' : ''}`;

    const bubble = document.createElement('p');
    bubble.className = 'message-bubble';
    bubble.textContent = String(message.text ?? message);
    item.appendChild(bubble);

    if (message.time) {
      const time = document.createElement('time');
      time.className = 'message-time';
      time.dateTime = message.time;
      time.textContent = new Date(message.time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      item.appendChild(time);
    }

    list.appendChild(item);
    welcome.hidden = list.children.length > 0;
    list.scrollTop = list.scrollHeight;
  }

  function showLocalMode() {
    online = false;
    status.textContent = 'On this device';
    storageNote.textContent = 'Messages are saved in this browser on this device.';
  }

  function startSocketIfAvailable() {
    // Opening index.html directly uses local storage. When served by server.js,
    // load its Socket.IO client so multiple connected browsers can chat.
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
          status.textContent = 'Connected';
          storageNote.textContent = 'Messages are shared with everyone connected to this server.';
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

  localMessages.forEach((message) => renderMessage(message, true));
  showLocalMode();
  startSocketIfAvailable();

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const text = input.value.trim();
    if (!text) return;

    if (socket && online) {
      socket.emit('chat message', text);
    } else {
      const message = { text, time: new Date().toISOString() };
      localMessages.push(message);
      try {
        localStorage.setItem(storageKey, JSON.stringify(localMessages));
      } catch (error) {
        storageNote.textContent = 'Could not save messages in this browser.';
      }
      renderMessage(message, true);
    }

    input.value = '';
    input.focus();
  });
})();
