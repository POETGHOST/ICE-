(() => {
  let users = [];
  let activeUser = null;
  let socket = null;
  let history = [];

  const list = document.getElementById("contact-list");
  const messages = document.getElementById("messages");
  const input = document.getElementById("message-input");
  const form = document.getElementById("message-form");
  const status = document.getElementById("connection-status");

  if (!list || !messages || !input || !form) return;

  function token() {
    return window.ICEAuth?.token ||
      sessionStorage.getItem("ice_token");
  }

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]);
  }

  async function api(url, options = {}) {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token(),
        ...(options.headers || {})
      }
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || "ICE request failed");
    }

    return data;
  }

  function showError(message) {
    status.textContent = message;
  }

  function renderUsers() {
    const query = (
      document.getElementById("chat-search")?.value || ""
    ).toLowerCase();

    const filtered = users.filter(user =>
      user.username.toLowerCase().includes(query)
    );

    list.replaceChildren();

    if (!filtered.length) {
      list.innerHTML =
        '<p class="empty-state">No other ICE accounts found yet.</p>';
      return;
    }

    filtered.forEach(user => {
      const button = document.createElement("button");
      button.type = "button";
      button.className =
        "contact" +
        (activeUser?.id === user.id ? " selected" : "");

      const initials = user.username.slice(0, 2).toUpperCase();

      button.innerHTML = `
        <span class="avatar avatar-blue">${escapeHTML(initials)}</span>
        <span class="contact-copy">
          <span class="contact-top">
            <strong>${escapeHTML(user.username)}</strong>
            <time>ICE</time>
          </span>
          <span class="contact-bottom">
            <span>Open private chat</span>
          </span>
        </span>
      `;

      button.addEventListener("click", () => openChat(user));
      list.appendChild(button);
    });
  }

  function renderMessages() {
    messages.replaceChildren();

    history.forEach(message => {
      const mine = Number(message.sender_id) ===
        Number(window.ICEAuth.user.id);

      const item = document.createElement("li");
      item.className = "message " +
        (mine ? "message-out" : "message-in");

      const time = message.created_at
        ? new Date(message.created_at).toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit"
          })
        : "now";

      item.innerHTML = `
        <p>${escapeHTML(message.body)}</p>
        <time>${escapeHTML(time)}</time>
      `;

      messages.appendChild(item);
    });

    const conversation = document.getElementById("conversation");
    conversation.scrollTop = conversation.scrollHeight;
  }

  async function openChat(user) {
    activeUser = user;
    history = [];

    document.getElementById("active-name").textContent =
      user.username;

    document.getElementById("active-status").textContent =
      "ICE account";

    const avatar = document.getElementById("active-avatar");
    avatar.textContent = user.username.slice(0, 2).toUpperCase();
    avatar.className = "avatar chat-avatar avatar-blue";

    renderUsers();
    messages.replaceChildren();

    try {
      const data = await api("/api/messages/" + user.id);
      history = data.messages || [];
      renderMessages();
      document.body.classList.add("chat-open");
      input.focus();
    } catch (error) {
      showError(error.message);
    }
  }

  async function loadUsers() {
    try {
      const data = await api("/api/users");
      users = data.users || [];
      renderUsers();

      status.textContent = "Connected to ICE accounts";
    } catch (error) {
      showError(error.message);
    }
  }

  function connectSocket() {
    if (typeof window.io !== "function") {
      showError("Chat connection library did not load");
      return;
    }

    socket = window.io({
      auth: { token: token() }
    });

    socket.on("connect", () => {
      status.textContent = "ICE chat connected";
    });

    socket.on("connect_error", () => {
      status.textContent = "Chat connection failed";
    });

    socket.on("private message", message => {
      if (!activeUser) return;

      const otherPerson =
        Number(message.sender_id) === Number(window.ICEAuth.user.id)
          ? Number(message.recipient_id)
          : Number(message.sender_id);

      if (otherPerson !== Number(activeUser.id)) return;

      if (!history.some(item => item.id === message.id)) {
        history.push(message);
        renderMessages();
      }
    });
  }

  // Capture the submit before the old demo handler can save locally.
  form.addEventListener("submit", async event => {
    event.preventDefault();
    event.stopImmediatePropagation();

    const body = input.value.trim();

    if (!body || !activeUser) {
      showError("Choose an ICE account before sending.");
      return;
    }

    if (!socket || !socket.connected) {
      showError("Chat is not connected. Please try again.");
      return;
    }

    if (body.length > 2000) {
      showError("Messages must be 2000 characters or less.");
      return;
    }

    socket.emit("private message", {
      recipientId: activeUser.id,
      body
    });

    input.value = "";
  }, true);

  document.getElementById("chat-search")
    ?.addEventListener("input", renderUsers);

  document.getElementById("new-chat")
    ?.addEventListener("click", () => {
      document.getElementById("chat-search").focus();
      renderUsers();
    });

  async function start() {
    if (!window.ICEAuth?.user || !token()) return;

    await loadUsers();
    connectSocket();
  }

  document.addEventListener("ice:authenticated", start);

  if (window.ICEAuth?.user) {
    start();
  }
})();