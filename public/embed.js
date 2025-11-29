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
  
    // ---- 3. Load JavaScript (chatbot scripts) ----
    const scripts = [
      "/js/chatbot-modal.js",
      "/js/get-all-categories.js",
      "/js/get-category-question.js",
      "/js/ask-question.js",
      "/js/send-feedback.js"
    ];
  
    for (const file of scripts) {
      const tag = document.createElement("script");
      tag.src = BASE + file;
      tag.defer = true;
      document.body.appendChild(tag);
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
  