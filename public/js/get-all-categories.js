// --------------------------------------
// AUTO-DETECT ENVIRONMENT (LIVE / STAGING)
// --------------------------------------
const hostname = window.location.hostname;

let ENDPOINT = "";

// STAGING DOMAIN
if (hostname.match(/^lightmetrics-website\.webflow\.io$/)) {
  ENDPOINT = "https://reseller-api-dev.lightmetrics.co/v1/llm-kb/all-categories";
}
// LIVE DOMAIN
else if (hostname.match(/^(www\.)?lightmetrics\.co$/)) {
  ENDPOINT = "https://reseller-api.lightmetrics.co/v1/llm-kb/all-categories";
}
// FALLBACK (LOCAL or OTHER)
else {
  console.log("Category Api is not set");
}

const LIST_ID = "all-category";

(async function () {
  const container = document.getElementById(LIST_ID);
  container.innerHTML = "<div>Loading topics...</div>";


  const memberstack = window.$memberstackDom;
  const token = await memberstack.getMemberCookie();

  try {
    const res = await fetch(ENDPOINT, {
      method: "GET",
      mode: "cors",
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const ctype = res.headers.get("content-type") || "";
    const data = ctype.includes("application/json")
      ? await res.json()
      : await res.text();
    if (!res.ok)
      throw new Error(typeof data === "string" ? data : JSON.stringify(data));

    if (typeof data === "object" && !Array.isArray(data)) {
      container.innerHTML = "";

      // NEW: expose categories globally so the questions file can use them
      window.__CATEGORIES__ = data; // NEW
      window.__CATEGORIES_READY__ = true; 

      Object.entries(data).forEach(([key, value]) => {
        const item = document.createElement("div");
        item.classList.add("chatbot_modal-topic-item");
        item.dataset.categoryKey = key;
        item.innerHTML = `
          <div>${value}</div>
          <img
            src="https://lightmetrics-chatbot.netlify.app/assets/close.svg"
            alt="close-icon"
            class="chatbot_modal-topic-close"
          >
        `;

        // When a user clicks from Screen 1 list → delegate to questions module
        item.addEventListener("click", () => {
          if (typeof window.__selectCategory === "function") {
            window.__selectCategory(key);
          }
        });

        container.appendChild(item);
      });
    } else {
      container.innerHTML = "<div>Invalid response format</div>";
    }
  } catch (e) {
    container.innerHTML = `<div style="color:red;">Error: ${e.message}</div>`;
    console.error(e);
  }
})();
