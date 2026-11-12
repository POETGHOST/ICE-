
(() => {
  const style = document.createElement("style");
  style.textContent = `
    #ice-auth {
      position: fixed;
      inset: 0;
      z-index: 99999;
      display: grid;
      place-items: center;
      padding: 20px;
      background: #101a20;
      color: white;
      font-family: Arial, sans-serif;
    }
    #ice-auth .auth-card {
      width: min(100%, 390px);
      padding: 28px;
      border: 1px solid #34454d;
      border-radius: 20px;
      background: #19272e;
    }
    #ice-auth h1 { margin-top: 0; }
    #ice-auth p { color: #aabac0; }
    #ice-auth input {
      box-sizing: border-box;
      width: 100%;
      padding: 14px;
      margin: 7px 0;
      border: 1px solid #40545c;
      border-radius: 9px;
      background: #101a20;
      color: white;
      font-size: 16px;
    }
    #ice-auth button {
      width: 100%;
      padding: 14px;
      margin-top: 12px;
      border: 0;
      border-radius: 9px;
      background: #69d6c4;
      color: #102329;
      font-weight: bold;
      font-size: 16px;
    }
    #ice-auth .switch {
      background: transparent;
      color: #69d6c4;
    }
    #ice-auth .error { color: #ff9292; }
    #ice-auth .success { color: #69d6c4; }
  `;
  document.head.appendChild(style);

  const root = document.createElement("div");
  root.id = "ice-auth";
  root.innerHTML = `
    <div class="auth-card">
      <h1>ice<span style="color:#69d6c4">.</span></h1>
      <p id="auth-description">Sign in to your ICE account</p>
      <form id="auth-form">
        <input id="auth-username" placeholder="Username"
          autocomplete="username" maxlength="30" hidden>
        <input id="auth-email" type="email" placeholder="Email"
          autocomplete="email" required>
        <input id="auth-password" type="password"
          placeholder="Password (minimum 10 characters)"
          autocomplete="current-password" minlength="10"
          maxlength="128" required>
        <button id="auth-submit" type="submit">Sign in</button>
      </form>
      <button class="switch" id="auth-switch" type="button">
        Create a new account
      </button>
      <p id="auth-status" role="status"></p>
    </div>
  `;
  document.body.appendChild(root);

  let registering = false;
  const form = root.querySelector("#auth-form");
  const username = root.querySelector("#auth-username");
  const email = root.querySelector("#auth-email");
  const password = root.querySelector("#auth-password");
  const status = root.querySelector("#auth-status");
  const submit = root.querySelector("#auth-submit");
  const description = root.querySelector("#auth-description");
  const switchButton = root.querySelector("#auth-switch");

  function showStatus(message, type) {
    status.textContent = message;
    status.className = type || "";
  }

  switchButton.addEventListener("click", () => {
    registering = !registering;
    username.hidden = !registering;
    username.required = registering;
    description.textContent = registering
      ? "Create your ICE account"
      : "Sign in to your ICE account";
    submit.textContent = registering ? "Create account" : "Sign in";
    switchButton.textContent = registering
      ? "Already have an account? Sign in"
      : "Create a new account";
    password.autocomplete = registering
      ? "new-password"
      : "current-password";
    showStatus("", "");
  });

  async function request(url, options = {}) {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {})
      }
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || "Request failed");
    }
    return data;
  }

  async function checkSession() {
    const token = sessionStorage.getItem("ice_token");
    if (!token) return;

    try {
      const data = await request("/api/me", {
        headers: { Authorization: "Bearer " + token }
      });
      root.remove();
      window.ICEAuth = {
        token,
        user: data.user
      };
      document.dispatchEvent(new Event("ice:authenticated"));
    } catch {
      sessionStorage.removeItem("ice_token");
    }
  }

  form.addEventListener("submit", async event => {
    event.preventDefault();
    submit.disabled = true;
    showStatus("Please wait...", "");

    try {
      const endpoint = registering
        ? "/api/auth/register"
        : "/api/auth/login";

      const payload = {
        email: email.value.trim(),
        password: password.value
      };

      if (registering) {
        payload.username = username.value.trim();
      }

      const data = await request(endpoint, {
        method: "POST",
        body: JSON.stringify(payload)
      });

      sessionStorage.setItem("ice_token", data.token);

      window.ICEAuth = {
        token: data.token,
        user: data.user
      };

      showStatus("Welcome to ICE!", "success");

      root.remove();
      document.dispatchEvent(new Event("ice:authenticated"));
    } catch (error) {
      showStatus(error.message, "error");
    } finally {
      submit.disabled = false;
    }
  });

  checkSession();
})();
