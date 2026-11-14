(() => {
  const contacts = [
    { id: 'maya', name: 'Maya Chen', initials: 'MC', color: 'coral', status: 'online now', preview: 'That sounds like a plan ✨', time: 'now', unread: 2, messages: [{ text: 'Hey! How has your week been?', from: 'them', time: '10:24 AM' }, { text: 'Pretty good, finally got some sunshine ☀️', from: 'you', time: '10:26 AM' }, { text: 'That sounds like a plan ✨', from: 'them', time: '10:27 AM' }] },
    { id: 'jordan', name: 'Jordan Lee', initials: 'JL', color: 'blue', status: 'last seen recently', preview: 'Sent you a photo', time: '9:42 AM', unread: 0, messages: [{ text: 'Sent you a photo from the hike 📷', from: 'them', time: '9:42 AM' }] },
    { id: 'weekend', name: 'Weekend crew', initials: 'WC', color: 'purple', status: '5 members', preview: 'Sam: Saturday works for me!', time: 'Yesterday', unread: 1, messages: [{ text: 'Sam: Saturday works for me!', from: 'them', time: 'Yesterday' }] },
    { id: 'alex', name: 'Alex Morgan', initials: 'AM', color: 'green', status: 'last seen 12 minutes ago', preview: 'Thanks for sharing that!', time: 'Yesterday', unread: 0, messages: [{ text: 'Thanks for sharing that!', from: 'them', time: 'Yesterday' }] },
    { id: 'nina', name: 'Nina Patel', initials: 'NP', color: 'gold', status: 'last seen today at 8:10 AM', preview: 'Voice message · 0:18', time: 'Mon', unread: 0, messages: [{ text: 'Voice message · 0:18', from: 'them', time: 'Monday' }] }
  ];
  const stories = [{ name: 'Maya', initials: 'M', color: 'coral', label: 'Coffee walk' }, { name: 'Jordan', initials: 'J', color: 'blue', label: 'Weekend escape' }, { name: 'Alex', initials: 'A', color: 'green', label: 'Tiny wins' }, { name: 'Nina', initials: 'N', color: 'gold', label: 'New recipe' }];
  const reels = [
    { title: 'City walk', creator: 'Maya', tag: '#weekend', likes: '24.9K', comments: '1.4K', accent: 'sunset', mood: 'Warm' },
    { title: 'Mini kitchen reset', creator: 'Nina', tag: '#cozy', likes: '18.7K', comments: '943', accent: 'mint', mood: 'Fresh' },
    { title: 'Quick workout', creator: 'Alex', tag: '#hustle', likes: '31.2K', comments: '2.1K', accent: 'pink', mood: 'Boost' }
  ];
  const seedPosts = [
    { name: 'Jordan Lee', initials: 'JL', color: 'blue', time: '18 min ago', text: 'Found a little trail with the best view of the city. Needed this reset today 🌿', likes: 8, comments: 2 },
    { name: 'Nina Patel', initials: 'NP', color: 'gold', time: '1 hr ago', text: 'Trying a new recipe tonight. If it works, I promise to share the recipe (and the mess) 🍋', likes: 12, comments: 4 },
    { name: 'Alex Morgan', initials: 'AM', color: 'green', time: 'Yesterday', text: 'A reminder to celebrate the small things. Made it through a busy week — that counts ✨', likes: 5, comments: 1 }
  ];
  const storageKey = 'ice-social-demo-v1';
  const contactList = document.getElementById('contact-list');
  const messages = document.getElementById('messages');
  const conversation = document.getElementById('conversation');
  const messageInput = document.getElementById('message-input');
  const toast = document.getElementById('toast');
  const studyTimerEl = document.getElementById('study-timer');
  const studyNotesEl = document.getElementById('study-notes');
  const studyTaskListEl = document.getElementById('study-task-list');
  const studyTaskCountEl = document.getElementById('study-task-count');
  const studyTaskInputEl = document.getElementById('study-task-input');
  const studyTaskFormEl = document.getElementById('study-task-form');
  let activeId = 'maya';
  let showUnreadOnly = false;
  let toastTimer;
  let persisted = {};
  let studySecondsLeft = 45 * 60;
  let studyTimer = null;
  try { persisted = JSON.parse(localStorage.getItem(storageKey) || '{}') || {}; } catch (_) { persisted = {}; }

  function escapeText(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  }
  function initialsClass(color) { return `avatar-${color}`; }
  function showToast(message) {
    toast.textContent = message;
    toast.hidden = false;
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => { toast.hidden = true; }, 2500);
  }
  function save() {
    try { localStorage.setItem(storageKey, JSON.stringify(persisted)); }
    catch (_) { showToast('Could not save this update in your browser.'); }
  }
  function padNumber(value) { return String(value).padStart(2, '0'); }
  function formatStudyTime(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${padNumber(hours)}:${padNumber(minutes)}:${padNumber(seconds)}`;
  }
  function updateStudyTimer() {
    studyTimerEl.textContent = formatStudyTime(studySecondsLeft);
  }
  function stopStudyTimer() {
    if (studyTimer) {
      window.clearInterval(studyTimer);
      studyTimer = null;
    }
  }
  function startStudyTimer() {
    if (studyTimer) return;
    studyTimer = window.setInterval(() => {
      if (studySecondsLeft > 0) {
        studySecondsLeft -= 1;
        updateStudyTimer();
      } else {
        stopStudyTimer();
        showToast('Focus session complete. Great work.');
      }
    }, 1000);
  }
  function resetStudyTimer() {
    stopStudyTimer();
    studySecondsLeft = 45 * 60;
    updateStudyTimer();
  }
  function renderStudyTasks() {
    const tasks = Array.isArray(persisted.studyTasks) ? persisted.studyTasks : [];
    studyTaskListEl.replaceChildren();
    tasks.forEach((task, index) => {
      const item = document.createElement('li');
      item.className = `study-task-item${task.done ? ' done' : ''}`;
      item.innerHTML = `
        <label>
          <input type="checkbox" data-task-index="${index}" ${task.done ? 'checked' : ''}>
          <span>${escapeText(task.text)}</span>
        </label>
        <button type="button" class="study-task-remove" data-task-index="${index}" aria-label="Remove task">×</button>
      `;
      studyTaskListEl.appendChild(item);
    });
    studyTaskCountEl.textContent = String(tasks.length);
  }
  function ensureStudyState() {
    const notes = persisted.studyNotes || '';
    studyNotesEl.value = notes;
    renderStudyTasks();
    updateStudyTimer();
  }
  function getMessages(contact) { return Array.isArray(persisted.messages && persisted.messages[contact.id]) ? persisted.messages[contact.id] : contact.messages; }
  function renderContacts(query = '') {
    const normalized = query.trim().toLocaleLowerCase();
    const filtered = contacts.filter((contact) => (!showUnreadOnly || contact.unread) && `${contact.name} ${contact.preview}`.toLocaleLowerCase().includes(normalized));
    contactList.replaceChildren();
    if (!filtered.length) { contactList.innerHTML = '<p class="empty-state">No conversations found.</p>'; return; }
    filtered.forEach((contact) => {
      const button = document.createElement('button');
      button.type = 'button'; button.className = `contact${contact.id === activeId ? ' selected' : ''}`; button.setAttribute('role', 'listitem');
      const unread = contact.unread ? `<span class="unread-badge">${contact.unread}</span>` : '';
      button.innerHTML = `<span class="avatar ${initialsClass(contact.color)}">${escapeText(contact.initials)}</span><span class="contact-copy"><span class="contact-top"><strong>${escapeText(contact.name)}</strong><time>${escapeText(contact.time)}</time></span><span class="contact-bottom"><span>${escapeText(contact.preview)}</span>${unread}</span></span>`;
      button.addEventListener('click', () => selectContact(contact.id));
      contactList.appendChild(button);
    });
  }
  function renderStories() {
    const row = document.getElementById('story-row');
    stories.forEach((story) => {
      const button = document.createElement('button'); button.type = 'button'; button.className = 'story';
      button.innerHTML = `<span class="story-ring"><span class="avatar ${initialsClass(story.color)}">${escapeText(story.initials)}</span></span><span>${escapeText(story.name)}</span>`;
      button.addEventListener('click', () => showToast(`${story.name}'s update: ${story.label}`)); row.appendChild(button);
    });
  }
  function renderReels() {
    const row = document.getElementById('reels-row');
    row.replaceChildren();
    reels.forEach((reel) => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = `reel-card reel-${reel.accent}`;
      card.innerHTML = `
        <span class="reel-tag">${escapeText(reel.tag)}</span>
        <span class="reel-meta"><span class="reel-user">${escapeText(reel.creator)}</span><span class="reel-mood">${escapeText(reel.mood)}</span></span>
        <span class="reel-title">${escapeText(reel.title)}</span>
        <span class="reel-stats"><span>♡ ${escapeText(reel.likes)}</span><span>💬 ${escapeText(reel.comments)}</span></span>
      `;
      card.addEventListener('click', () => showToast(`${reel.creator} just posted a fresh short video.`));
      row.appendChild(card);
    });
  }
  function renderMessages() {
    const contact = contacts.find((item) => item.id === activeId);
    messages.replaceChildren();
    getMessages(contact).forEach((message) => {
      const item = document.createElement('li'); item.className = `message ${message.from === 'you' ? 'message-out' : 'message-in'}`;
      item.innerHTML = `<p>${escapeText(message.text)}</p><time>${escapeText(message.time || 'now')}${message.from === 'you' ? ' <span aria-label="sent">✓✓</span>' : ''}</time>`;
      messages.appendChild(item);
    });
    conversation.scrollTop = conversation.scrollHeight;
  }
  function selectContact(id) {
    activeId = id;
    const contact = contacts.find((item) => item.id === id);
    document.getElementById('active-name').textContent = contact.name;
    document.getElementById('active-status').textContent = contact.status;
    const avatar = document.getElementById('active-avatar');
    avatar.className = `avatar chat-avatar ${initialsClass(contact.color)}`;
    avatar.textContent = contact.initials;
    contact.unread = 0;
    renderContacts(document.getElementById('chat-search').value);
    renderMessages();
    document.body.classList.add('chat-open');
    messageInput.focus();
  }
  function renderFeed() {
    const feed = document.getElementById('feed-list');
    const posts = Array.isArray(persisted.posts) ? [...persisted.posts, ...seedPosts] : seedPosts;
    feed.replaceChildren();
    posts.forEach((post, index) => {
      const article = document.createElement('article'); article.className = 'feed-post';
      article.innerHTML = `<div class="post-author"><span class="avatar ${initialsClass(post.color)}">${escapeText(post.initials)}</span><span><strong>${escapeText(post.name)}</strong><time>${escapeText(post.time)}</time></span><button type="button" class="post-menu" aria-label="More post options">···</button></div><p class="post-copy">${escapeText(post.text)}</p><div class="post-stats"><span>♡ ${post.likes} likes</span><span>${post.comments} comments</span></div><div class="post-actions"><button type="button" data-like="${index}" aria-pressed="false">♡ Like</button><button type="button" data-comment="${index}">▢ Comment</button><button type="button" data-share="${index}">↗ Share</button></div>`;
      feed.appendChild(article);
    });
    feed.querySelectorAll('[data-like]').forEach((button) => button.addEventListener('click', () => { const pressed = button.getAttribute('aria-pressed') === 'true'; button.setAttribute('aria-pressed', String(!pressed)); button.classList.toggle('liked', !pressed); button.textContent = pressed ? '♡ Like' : '♥ Liked'; }));
    feed.querySelectorAll('[data-comment]').forEach((button) => button.addEventListener('click', () => showToast('Comments will be available when community accounts are connected.')));
    feed.querySelectorAll('[data-share]').forEach((button) => button.addEventListener('click', () => showToast('Sharing will be available when community accounts are connected.')));
    feed.querySelectorAll('.post-menu').forEach((button) => button.addEventListener('click', () => showToast('More post options coming soon.')));
  }
  function currentTime() { return new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }); }

  renderStories();
  renderReels();
  renderContacts();
  renderMessages();
  renderFeed();
  ensureStudyState();
  document.getElementById('online-people').innerHTML = contacts.slice(0, 4).map((person) => `<button type="button" class="online-person" data-contact="${person.id}"><span class="avatar ${initialsClass(person.color)}">${escapeText(person.initials)}</span><span>${escapeText(person.name.split(' ')[0])}</span><i></i></button>`).join('');
  document.querySelectorAll('.online-person').forEach((button) => button.addEventListener('click', () => selectContact(button.dataset.contact)));

  document.getElementById('message-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const text = messageInput.value.trim();
    if (!text) return;
    const contact = contacts.find((item) => item.id === activeId);
    const history = getMessages(contact).slice();
    history.push({ text, from: 'you', time: currentTime() });
    persisted.messages = { ...(persisted.messages || {}), [activeId]: history };
    contact.preview = text; contact.time = 'now';
    save(); renderMessages(); renderContacts(document.getElementById('chat-search').value);
    messageInput.value = '';
  });
  document.getElementById('chat-search').addEventListener('input', (event) => {
  if (!window.ICEAuth?.user) renderContacts(event.target.value);
});
  document.getElementById('filter-unread').addEventListener('click', (event) => { showUnreadOnly = !showUnreadOnly; event.currentTarget.textContent = showUnreadOnly ? 'Unread' : 'All'; renderContacts(document.getElementById('chat-search').value); });
  document.getElementById('back-to-chats').addEventListener('click', () => document.body.classList.remove('chat-open'));
  document.getElementById('theme-toggle').addEventListener('click', () => document.body.classList.toggle('light-theme'));
  document.getElementById('chat-search-toggle').addEventListener('click', () => { document.getElementById('chat-search').focus(); showToast('Search conversations from the list on the left.'); });
  document.getElementById('chat-info').addEventListener('click', () => showToast('This is a local demo conversation.'));
  document.getElementById('new-chat').addEventListener('click', () => { document.getElementById('chat-search').focus(); showToast('Choose someone from your chat list to start chatting.'); });
  document.getElementById('add-status').addEventListener('click', () => showToast('Status sharing will be available with accounts.'));
  document.getElementById('publish-post').addEventListener('click', () => {
    const input = document.getElementById('post-input'); const text = input.value.trim();
    if (!text) { input.focus(); return; }
    const youPost = { name: 'You', initials: 'Y', color: 'you', time: 'Just now', text, likes: 0, comments: 0 };
    persisted.posts = [youPost, ...(persisted.posts || [])]; save(); input.value = ''; renderFeed(); showToast('Your update was saved in this browser.');
  });
  document.getElementById('feed-refresh').addEventListener('click', () => { renderFeed(); renderReels(); showToast('Your community feed is up to date.'); });
  document.querySelectorAll('.nav-item').forEach((item) => item.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach((nav) => nav.classList.toggle('active', nav === item));
    if (item.dataset.view === 'updates') showToast('Updates from your people are shown above the chat list.');
    if (item.dataset.view === 'community') document.querySelector('.social-panel').scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (item.dataset.view === 'study') {
      document.body.classList.toggle('study-mode');
      showToast('Private study mode is now active.');
    }
    if (item.dataset.view === 'chats') document.getElementById('chat-search').focus();
  }));
  document.getElementById('study-toggle').addEventListener('click', () => {
    document.body.classList.toggle('study-mode');
    const enabled = document.body.classList.contains('study-mode');
    showToast(enabled ? 'Private study space enabled.' : 'Private study space paused.');
  });
  document.getElementById('study-start').addEventListener('click', () => {
    startStudyTimer();
    showToast('Focus timer started.');
  });
  document.getElementById('study-pause').addEventListener('click', () => {
    stopStudyTimer();
    showToast('Focus timer paused.');
  });
  document.getElementById('study-reset').addEventListener('click', () => {
    resetStudyTimer();
    showToast('Focus timer reset.');
  });
  document.querySelectorAll('[data-study-action]').forEach((button) => button.addEventListener('click', () => {
    const action = button.dataset.studyAction;
    showToast(action === 'notes' ? 'Study notes opened in a private workspace.' : 'Your study tasks are ready to review.');
  }));
  studyNotesEl.addEventListener('input', () => {
    persisted.studyNotes = studyNotesEl.value;
    save();
  });
  studyTaskFormEl.addEventListener('submit', (event) => {
    event.preventDefault();
    const taskText = studyTaskInputEl.value.trim();
    if (!taskText) return;
    const tasks = Array.isArray(persisted.studyTasks) ? persisted.studyTasks.slice() : [];
    tasks.push({ text: taskText, done: false });
    persisted.studyTasks = tasks;
    studyTaskInputEl.value = '';
    save();
    renderStudyTasks();
  });
  studyTaskListEl.addEventListener('change', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement) || !target.matches('input[type="checkbox"]')) return;
    const tasks = Array.isArray(persisted.studyTasks) ? persisted.studyTasks : [];
    const index = Number(target.dataset.taskIndex);
    if (!Number.isInteger(index) || !tasks[index]) return;
    tasks[index].done = target.checked;
    persisted.studyTasks = tasks;
    save();
    renderStudyTasks();
  });
  studyTaskListEl.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement) || !target.matches('.study-task-remove')) return;
    const index = Number(target.dataset.taskIndex);
    const tasks = Array.isArray(persisted.studyTasks) ? persisted.studyTasks : [];
    tasks.splice(index, 1);
    persisted.studyTasks = tasks;
    save();
    renderStudyTasks();
  });
  document.getElementById('add-note').addEventListener('click', () => {
    studyNotesEl.focus();
    showToast('Private note pad ready.');
  });
  document.getElementById('global-search').addEventListener('keydown', (event) => { if (event.key === 'Enter') { document.getElementById('chat-search').value = event.currentTarget.value; renderContacts(event.currentTarget.value); document.getElementById('chat-search').focus(); } });
  document.getElementById('emoji-button').addEventListener('click', () => { const start = messageInput.selectionStart ?? messageInput.value.length; messageInput.value = `${messageInput.value.slice(0, start)}😊${messageInput.value.slice(start)}`; messageInput.focus(); });
  document.getElementById('reel-toggle').addEventListener('click', () => showToast('Short-form content is in the preview feed for a quick social scroll.'));
  window.addEventListener('keydown', (event) => { if (event.key === 'Escape') document.body.classList.remove('chat-open'); });
})();
