(function () {
    const BASE_URL = "https://lightmetrics-chatbot.netlify.app";
  
    // --- 1. Load Chatbot HTML ---
    async function loadChatbot() {
      try {
        const res = await fetch(`${BASE_URL}/chatbot.html`);
        const html = await res.text();
  
        const container = document.createElement("div");
        container.innerHTML = html;
        document.body.appendChild(container);
  
        // Hide modal initially
        const modal = container.querySelector(".chatbot_modal-wrapper");
        if (modal) modal.style.display = "none";
  
        // Open modal
        const btn = container.querySelector(".chatbot_button");
        if (btn) {
          btn.addEventListener("click", () => {
            modal.style.display = "flex";
          });
        }
  
        // Close modal
        const close = container.querySelector(".chatbot_header-close-icon");
        if (close) {
          close.addEventListener("click", () => {
            modal.style.display = "none";
          });
        }
  
        // Load scripts after HTML added
        loadScripts();
  
      } catch (err) {
        console.error("Error loading chatbot:", err);
      }
    }
  
    // --- 2. Inject Chatbot JavaScript Files ---
    function loadScripts() {
      const scripts = [
        "/chatbot-modal.js",
        "/get-all-categories.js",
        "/get-category-question.js",
        "/ask-question.js",
        "/send-feedback.js"
      ];
  
      scripts.forEach((src) => {
        const script = document.createElement("script");
        script.src = BASE_URL + src;
        script.defer = true;
        document.body.appendChild(script);
      });
    }
  
    // --- 3. Inject Chatbot CSS (Optional but recommended) ---
    function loadStyles() {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = `${BASE_URL}/styles.css`;
      document.head.appendChild(link);
    }
  
    // --- INIT ---
    loadStyles();
    loadChatbot();
  })();
  