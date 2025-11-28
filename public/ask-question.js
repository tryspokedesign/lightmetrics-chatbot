// --------------------------------------
// AUTO-DETECT ENVIRONMENT (LIVE / STAGING)
// --------------------------------------
const hostname_ask_question = window.location.hostname;
let ANSWER_ENDPOINT = "";

// STAGING DOMAIN
if (hostname_ask_question.match(/^lightmetrics-website\.webflow\.io$/)) {
  ANSWER_ENDPOINT = "https://reseller-api-dev.lightmetrics.co/v1/llm-kb/get-answer";
}
// LIVE DOMAIN
else if (hostname_ask_question.match(/^(www\.)?lightmetrics\.co$/)) {
  ANSWER_ENDPOINT = "https://reseller-api.lightmetrics.co/v1/llm-kb/get-answer";
}
// FALLBACK (LOCAL or OTHER)
else {
  console.log("Ask Question Api is not set");
}

// ----------------------------------
// GLOBAL VARIABLES FOR FEEDBACK
// ----------------------------------
window.__lastQuestion = "";
window.__lastAnswer = "";
window.__CHAT_CANCELED__ = false;
window.__sessionId = null;          // backend session ID
window.__messageCount = 0;          // count only input questions
window.__MESSAGE_LIMIT = 3;        // max allowed


function markdownToHtml(md) {
  if (!md) return "";

  return md
    .replace(/^### (.*$)/gim, "<h3>$1</h3>")
    .replace(/^## (.*$)/gim, "<h2>$1</h2>")
    .replace(/^# (.*$)/gim, "<h1>$1</h1>")
    .replace(/\*\*(.*?)\*\*/gim, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/gim, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\n\- (.*)/g, "<ul><li>$1</li></ul>")
    .replace(/\n([^\n]+)/g, "<p>$1</p>");
}

function disableUI() {
  // Disable suggestion questions
  document
    .querySelectorAll(".chatbot_topic-suggections-item")
    .forEach((el) => el.classList.add("is-disabled"));

  // Disable input + submit
  const input = document.querySelector(".chatbot_question-input");
  const btn = document.querySelector(".chatbot_question-submit");
  if (input) input.classList.add("is-disabled");
  if (btn) btn.classList.add("is-disabled");
}

function enableUI() {

    // STOP enabling UI if message limit is reached
    if (window.__messageCount >= window.__MESSAGE_LIMIT) {
      disableUI();   // force-disable everything
      return;
    }

  const input = document.querySelector(".chatbot_question-input");
  const btn = document.querySelector(".chatbot_question-submit");
  if (input) input.classList.remove("is-disabled");
  if (btn) btn.classList.remove("is-disabled");
}


// Show the Limit message element
function showLimitReached() {

  const limitWrapper = document.querySelector(".chatbot_modal-limit-wrapper");
  const input = document.querySelector(".chatbot_question-input");
  const btn = document.querySelector(".chatbot_question-submit");

  if (limitWrapper) limitWrapper.style.display = "block";
  if (input) input.classList.add("is-disabled");
  if (btn) btn.classList.add("is-disabled");
}

async function askLLM(question) {

  // Abort any previous stream
  if (window.__LLM_CONTROLLER__) {
    window.__LLM_CONTROLLER__.abort();
  }
  
  // Create new AbortController for this request
  window.__LLM_CONTROLLER__ = new AbortController();
  const controller = window.__LLM_CONTROLLER__;

  window.__CHAT_CANCELED__ = false;
  isAsking = true;

  // 1️⃣ Append question bubble
  appendQuestionBubble(question);

  // 2️⃣ Add loader bubble (already used in your UI)
  const thread = document.querySelector(".chatbot_modal-screen2-inner");
  const loaderBubble = document.createElement("div");
  loaderBubble.className = "chatbot_loading-state chat-loader";
  loaderBubble.innerHTML = `
      <div class="chatbot_icon">
      <div class="chatbot_embed-icon w-embed">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="28" height="28" rx="14" fill="#156168"></rect>
            <path d="M19.5535 11.8182L20.5452 9.81818L22.727 8.90909L20.5452 8L19.5535 6L18.5617 8L16.3799 8.90909L18.5617 9.81818L19.5535 11.8182ZM13.603 12.1818L11.6196 8.18182L9.6361 12.1818L5.27246 14L9.6361 15.8182L11.6196 19.8182L13.603 15.8182L17.9667 14L13.603 12.1818ZM19.5535 16.1818L18.5617 18.1818L16.3799 19.0909L18.5617 20L19.5535 22L20.5452 20L22.727 19.0909L20.5452 18.1818L19.5535 16.1818Z" fill="white"></path>
            </svg>
      </div>
      </div>
      <div class="chatbot_loading-dots">
        <div class="chatbot_loading-dot"></div>
        <div class="chatbot_loading-dot"></div>
        <div class="chatbot_loading-dot"></div>
      </div>
  `;
  thread.appendChild(loaderBubble);

  try {
    const memberstack = window.$memberstackDom;
    const token = await memberstack.getMemberCookie();

    //---------------------------
    // 3️⃣ START STREAM REQUEST
    //---------------------------
    const res = await fetch(ANSWER_ENDPOINT + "?stream=true", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        question,
        sessionId: window.__sessionId || ""
      }),
      signal: controller.signal 
    });

    if (!res.ok) throw new Error("Bad streaming response");

    const reader = res.body.getReader();
    const decoder = new TextDecoder("utf-8");

    let fullAnswer = "";
    let sources = [];
    let answerHtmlLive = "";  // live streamed html for incremental display

    
    loaderBubble.remove(); // remove loader

    // Temporary bubble for streamed text
    let streamedBubble = document.createElement("div");
    streamedBubble.className = "chatbot_topic-answer-wrapper dynamic-answer";
    streamedBubble.innerHTML = `
      <div class="chatbot_topic-answer-inner">
        <div class="chatbot_topic-suggestions-inner">
          <div class="chatbot_icon">
            <div class="chatbot_embed-icon w-embed">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="28" height="28" rx="14" fill="#156168"></rect>
              <path d="M19.5535 11.8182L20.5452 9.81818L22.727 8.90909L20.5452 8L19.5535 6L18.5617 8L16.3799 8.90909L18.5617 9.81818L19.5535 11.8182ZM13.603 12.1818L11.6196 8.18182L9.6361 12.1818L5.27246 14L9.6361 15.8182L11.6196 19.8182L13.603 15.8182L17.9667 14L13.603 12.1818ZM19.5535 16.1818L18.5617 18.1818L16.3799 19.0909L18.5617 20L19.5535 22L20.5452 20L22.727 19.0909L20.5452 18.1818L19.5535 16.1818Z" fill="white"></path>
              </svg>
            </div>
          </div>
          <div class="chatbot_topic-answer-content">
            <div class="chatbot_topic-answer-richtext"></div>
          </div>
        </div>
      </div>
    `;
    thread.appendChild(streamedBubble);

    const liveRich = streamedBubble.querySelector(".chatbot_topic-answer-richtext");

    //-------------------------------------
    // 4️⃣ READ THE STREAM CHUNKS
    //-------------------------------------
    while (true) {

      if (window.__CHAT_CANCELED__) {
        controller.abort();      // stop backend stream
        return;                  // exit askLLM
      }

      const { value, done } = await reader.read();
      if (done) break;

      let chunk = decoder.decode(value, { stream: true });

      // SSE Format → split by "data:"
      const lines = chunk.split("\n");
      for (let ln of lines) {
        if (!ln.startsWith("data:")) continue;

        const json = ln.replace("data:", "").trim();
        if (!json) continue;

        let obj;
        try {
          obj = JSON.parse(json);
        } catch {
          continue;
        }

        // Backend sends session_id (snake_case)
        if (obj.session_id) {
          window.__sessionId = obj.session_id;
        }

        // Also handle camelCase if backend changes later
        if (obj.sessionId) {
          window.__sessionId = obj.sessionId;
        }


        // ✔ 4a — text token received
        if (obj.text) {
          fullAnswer += obj.text;
          answerHtmlLive = markdownToHtml(fullAnswer);

          // Live update inside the streamed bubble
          liveRich.innerHTML = answerHtmlLive;

          // auto-scroll
          thread.scrollTop = thread.scrollHeight;
        }

        // ✔ 4b — final sources event
        if (obj.sources) {
          sources = obj.sources;

          if (obj.session_id) {
            window.__sessionId = obj.session_id;
          }
        
          if (obj.sessionId) { 
            window.__sessionId = obj.sessionId;
          }
        }
      }
    }

    //-------------------------------------
    // 5️⃣ STREAM COMPLETED
    //-------------------------------------

    streamedBubble.remove(); // remove temp bubble

    if (window.__CHAT_CANCELED__) return;

    // Build citations
    const sourceMarkers = sources
      .map(
        (s, i) =>
          `<a class="chatbot_source-number" href="${s.fd_article}" target="_blank">[${i + 1}]</a>`
      )
      .join(" ");

    const finalHTML = `
      ${markdownToHtml(fullAnswer)}
      <div class="chatbot_sources-inline">${sourceMarkers}</div>
    `;

    appendAnswerBubble(finalHTML);

    window.__lastQuestion = question;
    window.__lastAnswer = fullAnswer;

    // ⬅️ NEW: After FULL answer received
    if (window.__messageCount >= window.__MESSAGE_LIMIT) {
      showLimitReached();
      disableUI();
      return; // stop enabling UI
    }

    isAsking = false;
    enableUI();

    setTimeout(() => {
      thread.scrollTop = thread.scrollHeight;
    }, 50);

  } catch (err) {
    loaderBubble.remove();
    isAsking = false;
    enableUI();
  }
}


function initializeSubmitHandler() {

  const input = document.querySelector(".chatbot_question-input");
  const btn = document.querySelector(".chatbot_question-submit");
  const form = document.getElementById("wf-form-Ask-Question-Form");

  const screen1 = document.querySelector(".chatbot_modal-screen1");
  const screen2 = document.querySelector(".chatbot_modal-screen2");
  const screen2head = document.querySelector(".chatbot_modal-screen-header");

  const handleSubmit = (e) => {
    e.preventDefault();

    const q = input.value.trim();

    // 🔴 Show error when empty
    if (!q) {
      input.classList.add("error-input");
      input.placeholder = "Please type your question here...";
      return;
    }

    // Remove error when typing valid text
    input.classList.remove("error-input");

    screen1.style.display = "none";
    screen2.style.display = "block";
    screen2head.style.display = "block";

    const clearBtn = document.querySelector(".chatbot_modal-clear-chat");
    if (clearBtn) clearBtn.style.display = "flex";

    // 🟢 FIX: Re-render category chips
    if (window.__CATEGORIES__) {
      renderHeader(window.__CATEGORIES__, window.activeKey || window.__activeKey);
      setTimeout(() => adjustHeaderDropdown(), 50);
    }

    isAsking = true; // 🔐 lock clicks
    disableUI();
    askLLM(q);

    input.value = "";
    document.querySelector(".chatbot_input-character-count").textContent = "0";
    autosize();
    function autosize() {
      var text = $(".chatbot_question-input");

      text.each(function () {
        $(this).attr("rows", 1);
        resize($(this));
      });

      text.on("input", function () {
        resize($(this));
      });

      function resize($text) {
        $text.css("height", "auto");
        $text.css("height", $text[0].scrollHeight + "px");
      }
    }
    adjustHeaderDropdown();

    window.__messageCount++;

  };

  if (btn) {
    btn.addEventListener("click", handleSubmit);
  }
  if (form) {
    form.addEventListener("submit", handleSubmit);
  }
}

// Run immediately if DOM is ready, otherwise wait
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeSubmitHandler);
} else {
  // DOM is already ready, run immediately
  initializeSubmitHandler();
}

function appendQuestionBubble(text) {
  const thread = document.querySelector(".chatbot_modal-screen2-inner");
  if (!thread) {
    return;
  }

  const q = document.createElement("div");
  q.className = "chatbot_topic-question-wrapper";
  q.innerHTML = `
      <div class="chatbot_topic-question-block">${text}</div>
    `;

  thread.appendChild(q);
}

function appendAnswerBubble(html) {
  const thread = document.querySelector(".chatbot_modal-screen2-inner");
  if (!thread) {
    return;
  }

  const a = document.createElement("div");
  a.className = "chatbot_topic-answer-wrapper dynamic-answer";

  a.innerHTML = `
      <div class="chatbot_topic-answer-inner">
        <div class="chatbot_topic-suggestions-inner">
          <div class="chatbot_icon">
            <div class="chatbot_embed-icon w-embed">
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="28" height="28" rx="14" fill="#156168"></rect>
                <path d="M19.5535 11.8182L20.5452 9.81818L22.727 8.90909L20.5452 8L19.5535 6L18.5617 8L16.3799 8.90909L18.5617 9.81818L19.5535 11.8182ZM13.603 12.1818L11.6196 8.18182L9.6361 12.1818L5.27246 14L9.6361 15.8182L11.6196 19.8182L13.603 15.8182L17.9667 14L13.603 12.1818ZM19.5535 16.1818L18.5617 18.1818L16.3799 19.0909L18.5617 20L19.5535 22L20.5452 20L22.727 19.0909L20.5452 18.1818L19.5535 16.1818Z" fill="white"></path>
                </svg>
            </div>
          </div>
          <div class="chatbot_topic-answer-content">
            <div class="chatbot_topic-answer-richtext">${html}</div>
            <div
            class="chatbot_modal-actions-wrapper"
            style="opacity: 0; display: none"
          >
            <div class="chatbot_modal-actions">
              <div class="chatbot_modal-action-like">
                <div class="icon-embed-xsmall w-embed">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    class="default-like-icon"
                  >
                    <path
                      d="M9 22H18C18.83 22 19.54 21.5 19.84 20.78L22.86 13.73C22.95 13.5 23 13.26 23 13V11C23 9.9 22.1 9 21 9H14.69L15.64 4.43L15.67 4.11C15.67 3.7 15.5 3.32 15.23 3.05L14.17 2L7.58 8.59C7.22 8.95 7 9.45 7 10V20C7 21.1 7.9 22 9 22ZM9 10L13.34 5.66L12 11H21V13L18 20H9V10ZM1 10H5V22H1V10Z"
                      fill="currentColor"
                    ></path>
                  </svg>
    
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    class="selected-like-icon"
                    style="display: none"
                  >
                    <path
                      d="M12.9491 2.75186L7.4091 8.29186C7.0391 8.66186 6.8291 9.17186 6.8291 9.70186V19.6919C6.8291 20.7919 7.7291 21.6919 8.8291 21.6919H17.8291C18.6291 21.6919 19.3491 21.2119 19.6691 20.4819L22.9291 12.8719C23.7691 10.8919 22.3191 8.69186 20.1691 8.69186H14.5191L15.4691 4.11186C15.5691 3.61186 15.4191 3.10186 15.0591 2.74186C14.4691 2.16186 13.5291 2.16186 12.9491 2.75186ZM2.8291 21.6919C3.9291 21.6919 4.8291 20.7919 4.8291 19.6919V11.6919C4.8291 10.5919 3.9291 9.69186 2.8291 9.69186C1.7291 9.69186 0.829102 10.5919 0.829102 11.6919V19.6919C0.829102 20.7919 1.7291 21.6919 2.8291 21.6919Z"
                      fill="#8B2682"
                    ></path>
                  </svg>
                </div>
              </div>
              <div class="chatbot_modal-action-dislike">
                <div class="icon-embed-xsmall w-embed">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    class="default-dislike-icon"
                  >
                    <path
                      d="M15.1588 2.31006H6.16884C5.36884 2.31006 4.64884 2.79006 4.33885 3.52006L1.07884 11.1301C0.228845 13.1101 1.67884 15.3101 3.82885 15.3101H9.47885L8.52884 19.8901C8.42884 20.3901 8.57885 20.9001 8.93885 21.2601C9.22885 21.5501 9.60884 21.6901 9.98884 21.6901C10.3688 21.6901 10.7588 21.5401 11.0488 21.2501L16.5788 15.7101C16.9488 15.3401 17.1588 14.8301 17.1588 14.3001V4.31006C17.1588 3.21006 16.2588 2.31006 15.1588 2.31006ZM10.8288 18.6401L11.4388 15.7201L11.9388 13.3101H3.82885C3.35884 13.3101 3.10884 13.0301 2.99884 12.8601C2.88884 12.6901 2.72884 12.3501 2.91884 11.9101L6.16884 4.31006H15.1588V14.3001L10.8288 18.6401Z"
                      fill="currentColor"
                    ></path>
                    <path
                      d="M21.1688 2.31006C20.0688 2.31006 19.1688 3.21006 19.1688 4.31006V12.3101C19.1688 13.4101 20.0688 14.3101 21.1688 14.3101C22.2688 14.3101 23.1688 13.4101 23.1688 12.3101V4.31006C23.1688 3.21006 22.2688 2.31006 21.1688 2.31006Z"
                      fill="currentColor"
                    ></path>
                  </svg>
    
                  <svg
                    width="22"
                    height="20"
                    viewBox="0 0 22 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    class="selected-dislike-icon"
                    style="display: none"
                  >
                    <path
                      d="M2 9V11H11L9.66 16.34L14 12V2H5L2 9Z"
                      fill="#8B2682"
                    ></path>
                    <path d="M22 0H18V12H22V0Z" fill="#8B2682"></path>
                    <path
                      d="M14 0H5C4.17 0 3.46 0.5 3.16 1.22L0.14 8.27C0.05 8.5 0 8.74 0 9V11C0 12.1 0.9 13 2 13H8.31L7.36 17.57L7.33 17.89C7.33 18.3 7.5 18.68 7.77 18.95L8.83 20L15.42 13.41C15.78 13.05 16 12.55 16 12V2C16 0.9 15.1 0 14 0ZM14 12L9.66 16.34L11 11H2V9L5 2H14V12Z"
                      fill="#8B2682"
                    ></path>
                  </svg>
                </div>
              </div>
              <div class="chatbot_modal-action-copy">
                <div class="icon-embed-xsmall w-embed">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M15.5 20H5.5V7C5.5 6.45 5.05 6 4.5 6C3.95 6 3.5 6.45 3.5 7V20C3.5 21.1 4.4 22 5.5 22H15.5C16.05 22 16.5 21.55 16.5 21C16.5 20.45 16.05 20 15.5 20ZM20.5 16V4C20.5 2.9 19.6 2 18.5 2H9.5C8.4 2 7.5 2.9 7.5 4V16C7.5 17.1 8.4 18 9.5 18H18.5C19.6 18 20.5 17.1 20.5 16ZM18.5 16H9.5V4H18.5V16Z"
                      fill="currentColor"
                    ></path>
                  </svg>
                </div>
                <div class="chatbot-action-form-response">Copied</div>
              </div>
            </div>
          </div>
                <div class="chatbot-action-form-wrapper">
        <div class="margin-0 w-form">
          <form
            id="feedback-form"
            name="feedback-form"
            data-name="Feedback Form"
            method="get"
            class="chatbot_action-form-inner"
            data-wf-page-id="691afeceeb8d3e39cc72f79a"
            data-wf-element-id="a6a7fefe-e544-f162-f7ed-f8937a59c0c8"
            aria-label="Feedback Form"
            data-faitracker-form-bind="true"
            data-hs-cf-bound="true"
          >
            <div class="chatbot_action-form-header">
              <label for="name" class="chatbot_action-form-label"
                >Please help us understand what went wrong.</label
              >
              <div class="chatbot_action-form-close">
                <div class="icon-embed-xsmall w-embed">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z"
                      fill="#575757"
                    ></path>
                  </svg>
                </div>
              </div>
            </div>
            <div class="chatbot_action-form-checboxs">
              <label class="w-checkbox chatbot_action-form-checkbox"
                ><div
                  class="w-checkbox-input w-checkbox-input--inputType-custom chatbot_action-checkbox"
                ></div>
                <input
                  type="checkbox"
                  name="Factually-inaccurate"
                  id="Factually-inaccurate"
                  data-name="Factually inaccurate"
                  style="opacity: 0; position: absolute; z-index: -1" /><span
                  class="w-form-label"
                  for="Factually-inaccurate"
                  >Factually inaccurate</span
                >
                <div class="chatbot_action-checkbox-icon">
                  <div class="icon-embed-xxsmall w-embed">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M12.6663 4.27301L11.7263 3.33301L7.99967 7.05967L4.27301 3.33301L3.33301 4.27301L7.05967 7.99967L3.33301 11.7263L4.27301 12.6663L7.99967 8.93967L11.7263 12.6663L12.6663 11.7263L8.93967 7.99967L12.6663 4.27301Z"
                        fill="#561050"
                      ></path>
                    </svg>
                  </div></div></label
              ><label class="w-checkbox chatbot_action-form-checkbox"
                ><div
                  class="w-checkbox-input w-checkbox-input--inputType-custom chatbot_action-checkbox"
                ></div>
                <input
                  type="checkbox"
                  name="Answer-not-helpful"
                  id="Answer-not-helpful"
                  data-name="Answer not helpful"
                  style="opacity: 0; position: absolute; z-index: -1" /><span
                  class="w-form-label"
                  for="Answer-not-helpful"
                  >Answer not helpful</span
                >
                <div class="chatbot_action-checkbox-icon">
                  <div class="icon-embed-xxsmall w-embed">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M12.6663 4.27301L11.7263 3.33301L7.99967 7.05967L4.27301 3.33301L3.33301 4.27301L7.05967 7.99967L3.33301 11.7263L4.27301 12.6663L7.99967 8.93967L11.7263 12.6663L12.6663 11.7263L8.93967 7.99967L12.6663 4.27301Z"
                        fill="#561050"
                      ></path>
                    </svg>
                  </div></div></label
              ><label class="w-checkbox chatbot_action-form-checkbox"
                ><div
                  class="w-checkbox-input w-checkbox-input--inputType-custom chatbot_action-checkbox"
                ></div>
                <input
                  type="checkbox"
                  name="Did-not-understand-the-question"
                  id="Did-not-understand-the-question"
                  data-name="Did not understand the question"
                  style="opacity: 0; position: absolute; z-index: -1" /><span
                  class="w-form-label"
                  for="Did-not-understand-the-question"
                  >Did not understand the question</span
                >
                <div class="chatbot_action-checkbox-icon">
                  <div class="icon-embed-xxsmall w-embed">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M12.6663 4.27301L11.7263 3.33301L7.99967 7.05967L4.27301 3.33301L3.33301 4.27301L7.05967 7.99967L3.33301 11.7263L4.27301 12.6663L7.99967 8.93967L11.7263 12.6663L12.6663 11.7263L8.93967 7.99967L12.6663 4.27301Z"
                        fill="#561050"
                      ></path>
                    </svg>
                  </div></div></label
              ><label class="w-checkbox chatbot_action-form-checkbox"
                ><div
                  class="w-checkbox-input w-checkbox-input--inputType-custom chatbot_action-checkbox"
                ></div>
                <input
                  type="checkbox"
                  name="Lacks-detail"
                  id="Lacks-detail"
                  data-name="Lacks detail"
                  style="opacity: 0; position: absolute; z-index: -1" /><span
                  class="w-form-label"
                  for="Lacks-detail"
                  >Lacks detail</span
                >
                <div class="chatbot_action-checkbox-icon">
                  <div class="icon-embed-xxsmall w-embed">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M12.6663 4.27301L11.7263 3.33301L7.99967 7.05967L4.27301 3.33301L3.33301 4.27301L7.05967 7.99967L3.33301 11.7263L4.27301 12.6663L7.99967 8.93967L11.7263 12.6663L12.6663 11.7263L8.93967 7.99967L12.6663 4.27301Z"
                        fill="#561050"
                      ></path>
                    </svg>
                  </div></div
              ></label>
            </div>
            <input
              class="chatbot_action-aditional-text w-input"
              maxlength="256"
              name="name"
              data-name="additional text"
              placeholder="(Optional) Describe additional details...."
              type="text"
              id="name"
            />
            <div class="chatbot_action-form-error">Please at least select one option.</div>
            <div class="text-align-right">
              <div
                class="chatbot_action-form-submit is-disabled"
              >SUBMIT</div>

            </div>
          </form>
          <div
            class="w-form-done"
            tabindex="-1"
            role="region"
            aria-label="Feedback Form success"
          >
            <div>Thank you! Your submission has been received!</div>
          </div>
          <div
            class="w-form-fail"
            tabindex="-1"
            role="region"
            aria-label="Feedback Form failure"
          >
            <div>Oops! Something went wrong while submitting the form.</div>
          </div>
        </div>
        
      </div>
      <div class="chatbot_topic-aditional-question">
      <div class="chatbot_topic-aditional-heading">
        Do you have any additional questions about
        <span class="chatbot_topic-aditional-heading-text"
          >Health Events</span
        >?
      </div>
      <div class="chatbot_topic-aditional-buttons">
        <div class="chatbot_topic-button button-yes"><div>Yes</div></div>
        <div class="chatbot_topic-button button-no"><div>No</div></div>
      </div>
    </div>
      <div class="chatbot-action-form-response">Thank you for your feedback! We have recorded your response.</div>
          </div>
        </div>
        <div class="chatbot_topic-ask-wrapper">
        <div class="chatbot_topic-ask-inner">
          <div class="chatbot_icon">
            <div class="chatbot_embed-icon w-embed">
              <svg
                width="28"
                height="28"
                viewBox="0 0 28 28"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect width="28" height="28" rx="14" fill="#156168"></rect>
                <path
                  d="M19.5535 11.8182L20.5452 9.81818L22.727 8.90909L20.5452 8L19.5535 6L18.5617 8L16.3799 8.90909L18.5617 9.81818L19.5535 11.8182ZM13.603 12.1818L11.6196 8.18182L9.6361 12.1818L5.27246 14L9.6361 15.8182L11.6196 19.8182L13.603 15.8182L17.9667 14L13.603 12.1818ZM19.5535 16.1818L18.5617 18.1818L16.3799 19.0909L18.5617 20L19.5535 22L20.5452 20L22.727 19.0909L20.5452 18.1818L19.5535 16.1818Z"
                  fill="white"
                ></path>
              </svg>
            </div>
          </div>
          <div class="chatbot_topic-ask-heading">
            <div class="chatbot_topic-aditional-heading">
              How else may I assist you?
            </div>
          </div>
        </div>
      </div>
      </div>
    `;

  thread.appendChild(a);

  // -------------------------------------
  // 1) UPDATE CATEGORY NAME IN HEADING
  // -------------------------------------
  const catSpan = a.querySelector(".chatbot_topic-aditional-heading-text");
  const heading = a.querySelector(".chatbot_topic-aditional-heading");
  // Get the selected category element
  const activeCat = document.querySelector(".chatbot_modal-topic-item.is-active");

  if (activeCat && catSpan) {
    const labelEl = activeCat.querySelector("div");
    const label = labelEl ? labelEl.textContent.trim() : window.activeKey;

    catSpan.textContent = label;   // Show "Camera Setup"
  } else {
    if (heading && catSpan) {
      heading.textContent = "Do you have any additional questions?";
      catSpan.style.display = "none";
    }
  }

  // -------------------------------------
  // 2) YES / NO BUTTON FUNCTIONALITY
  // -------------------------------------
  const yesBtn = a.querySelector(".button-yes");
  const noBtn = a.querySelector(".button-no");
  const askWrapper = a.querySelector(".chatbot_topic-ask-wrapper");

  if (yesBtn) {
    yesBtn.addEventListener("click", () => {
      yesBtn.classList.add("is-active");
      noBtn?.classList.remove("is-active");
      if (askWrapper) askWrapper.style.display = "block";
    });
  }

  if (noBtn) {
    noBtn.addEventListener("click", () => {
      noBtn.classList.add("is-active");
      yesBtn?.classList.remove("is-active");
      clearChatHistory();
    });
  }
}

function clearChatHistory() {
  clearEverything();
}

function clearEverything() {

  if (window.__LLM_CONTROLLER__) {
    window.__LLM_CONTROLLER__.abort();
  }
  window.__CHAT_CANCELED__ = true;
  enableUI();
  isAsking = false;

  window.__messageCount = 0;
  window.__sessionId = null;

  // hide limit banner
  const limitWrapper = document.querySelector(".chatbot_modal-limit-wrapper");
  if (limitWrapper) limitWrapper.style.display = "none";

  // enable input field
  const input = document.querySelector(".chatbot_question-input");
  const btn = document.querySelector(".chatbot_question-submit");
  if (input) input.classList.remove("is-disabled");
  if (btn) btn.classList.remove("is-disabled");


  // -----------------------------
  // 1️⃣ Remove Chat Thread Content
  // -----------------------------
  const thread = document.querySelector(".chatbot_modal-screen2-inner");
  if (thread) {
    thread
      .querySelectorAll(
        ".chatbot_topic-question-wrapper, .dynamic-answer, .chat-loader"
      )
      .forEach((el) => el.remove());
  }

  // -----------------------------
  // 2️⃣ Reset Header Categories
  // -----------------------------
  const headerList = document.querySelector(".chatbot_modal-topic-header-list");
  if (headerList) headerList.innerHTML = "";

  // Remove active category globally
  window.activeKey = null;
  window.__activeKey = null;

  // Reset category label to default
  const lookingLabelEl = document.querySelector(".chatbot_modal-form-label-copy");
  if (lookingLabelEl) {
    lookingLabelEl.textContent = "Select a category to see questions.";
  }

  // -----------------------------
  // 3️⃣ Hide Suggestions List
  // -----------------------------
  const suggestionsWrapper = document.querySelector(".chatbot_topic-category");
  if (suggestionsWrapper) suggestionsWrapper.style.display = "none";

  const suggestionsList = document.querySelector(
    ".chatbot_topic-suggestions-list"
  );
  if (suggestionsList) suggestionsList.innerHTML = "";

  // -----------------------------
  // 4️⃣ Go Back To First Screen
  // -----------------------------
  document.querySelector(".chatbot_modal-screen1").style.display = "block";
  document.querySelector(".chatbot_modal-screen2").style.display = "none";
  document.querySelector(".chatbot_modal-screen-header").style.display = "none";

  // -----------------------------
  // 5️⃣ Hide Clear Chat Button
  // -----------------------------
  const clearBtn = document.querySelector(".chatbot_modal-clear-chat");
  if (clearBtn) clearBtn.style.display = "none";

}

// ---------------  cleat chat history on clicked ----------------
// document.addEventListener("DOMContentLoaded", () => {
  const clearBtn = document.querySelector(".chatbot_modal-clear-chat");
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      clearEverything();
    });
  }
// });

document.addEventListener("click", (e) => {
  const closeIcon = e.target.closest(".chatbot_modal-topic-close");
  if (!closeIcon) return;

  clearEverything();
});


document.addEventListener("click", (e) => {
  const btn = e.target.closest(".chatbot_chat-button");
  if (!btn) return;


  clearEverything();  // clears UI & thread

  window.__sessionId = null;   // reset session
  window.__messageCount = 0;   // reset message count

  // hide limit wrapper
  const limitWrapper = document.querySelector(".chatbot_modal-limit-wrapper");
  if (limitWrapper) limitWrapper.style.display = "none";

  // enable input again
  const input = document.querySelector(".chatbot_question-input");
  const sendBtn = document.querySelector(".chatbot_question-submit");
  if (input) input.classList.remove("is-disabled");
  if (sendBtn) sendBtn.classList.remove("is-disabled");
});


