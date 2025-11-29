(async function () {
    const BASE = "https://lightmetrics-chatbot.netlify.app";
  
    // ---- 1. Load Chatbot HTML ----
    try {
      const res = await fetch(`${BASE}/index.html`);
      const html = await res.text();
  
      const container = document.createElement("div");
      container.innerHTML = html;
      document.body.appendChild(container);
    } catch (err) {
      console.error("Failed to load chatbot HTML:", err);
      return;
    }
  
    // ---- 2. Load CSS files ----
    const cssFiles = [
      "/css/styles.css",
    ];
  
    cssFiles.forEach(file => {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = BASE + file;
      document.head.appendChild(link);
    });

    // ---- 3. Load JavaScript sequentially ----
    async function loadScript(src) {
      return new Promise((resolve, reject) => {
        const s = document.createElement("script");
        s.src = src;
        s.onload = resolve;
        s.onerror = reject;
        document.body.appendChild(s);
      });
    }

    try {
      await loadScript(`${BASE}/env.js`);

      await loadScript(`${BASE}/js/chatbot-modal.js`);
      await loadScript(`${BASE}/js/get-all-categories.js`);
      await loadScript(`${BASE}/js/get-category-question.js`);
      await loadScript(`${BASE}/js/ask-question.js`);
      await loadScript(`${BASE}/js/send-feedback.js`);

    } catch (err) {
      console.error("Failed to load scripts:", err);
    }
  
    // ---- 4. Show wrapper after all elements exist ----
    function showChatbotWrapper() {
      const wrapper = document.querySelector(".chatbot_wrapper");
      if (!wrapper) return;
  
      wrapper.style.opacity = "1";
      wrapper.style.pointerEvents = "auto";
    }
  
    // Wait a little for DOM injection
    setTimeout(showChatbotWrapper, 500);
  })();
  