// Endpoints

const QUESTIONS_ENDPOINT =
  "https://lightmetrics-chatbot.netlify.app/api/category-questions";

const screen1 = document.querySelector(".chatbot_modal-screen1");
const screen2 = document.querySelector(".chatbot_modal-screen2");
const screen2head = document.querySelector(".chatbot_modal-screen-header");
const headerList = document.querySelector(".chatbot_modal-topic-header-list");
const lookingLabelEl = screen2head.querySelector(".chatbot_modal-form-label-copy");
const selectedHeadingEl = screen2.querySelector(".chatbot_topic-heading-text");
const selectedTopicInlineEl = screen2.querySelector(".chatbot_selected-topic");
const suggestionsWrapper = screen2.querySelector(".chatbot_topic-category");
const suggestionsList = screen2.querySelector(
  ".chatbot_topic-suggestions-list"
);
const loadingState = screen2.querySelector(".chatbot_loading-state");

let allCategories = {};
let activeKey = null;
let resizeBound = false; // ✅ prevent multiple resize events
let isAsking = false;

// Set default label text on page load
if (lookingLabelEl) {
  lookingLabelEl.textContent = "Select a category to see questions.";
}

// ---------- BUILD HEADER + DROPDOWN ----------
function renderHeader(categoriesMap, activeKey) {
  headerList.innerHTML = ""; // reset clean

  // Create category chips
  Object.entries(categoriesMap).forEach(([k, v]) => {
    const chip = document.createElement("div");
    chip.className = "chatbot_modal-topic-item";
    chip.dataset.categoryKey = k;
    if (k === activeKey) chip.classList.add("is-active");
    chip.innerHTML = `
      <div>${v}</div>
      <img src="https://cdn.prod.website-files.com/6560b4c29203fafcb9f6c716/69141f99bb1c116f61715ecc_close.svg"
           loading="lazy" alt="close-icon" class="chatbot_modal-topic-close">
    `;
    headerList.appendChild(chip);
  });

  // Add dropdown (only once)
  const dropdown = document.createElement("div");
  dropdown.className = "chatbot_topic-dropdown w-dropdown";
  dropdown.innerHTML = `
    <div class="chatbot_topic-dropdown-toggle w-dropdown-toggle" role="button" tabindex="0">
      <div>+<span id="topics-counter">0</span> more</div>
      <img src="https://cdn.prod.website-files.com/6560b4c29203fafcb9f6c716/69142ff8cd34d1be0d12bc6f_arrow_down.svg" loading="lazy" alt="">
    </div>
    <nav class="chatbot_topic-dropdown-navigation w-dropdown-list" style="display:none;">
      <div class="chatbot_topic-dropdown-list"></div>
    </nav>
  `;
  headerList.appendChild(dropdown);
  dropdown.style.display = "none";

  adjustHeaderDropdown();

  if (!resizeBound) {
    window.addEventListener("resize", adjustHeaderDropdown);
    resizeBound = true;
  }
}

// ---------- ADJUST DROPDOWN RESPONSIVELY AND KEEP SELECTED CATEGORY OUTSIDE THE DROPDOWN ----------
// function adjustHeaderDropdown() {
//   const container = headerList;
//   const dropdown = container.querySelector(".chatbot_topic-dropdown");
//   if (!dropdown) return;

//   const dropdownList = dropdown.querySelector(".chatbot_topic-dropdown-list");
//   const counter = dropdown.querySelector("#topics-counter");
//   dropdownList.innerHTML = ""; // ✅ clear existing hidden chips

//   const chips = Array.from(
//     container.querySelectorAll(".chatbot_modal-topic-item")
//   );
//   const availableWidth = container.clientWidth - 130;
//   let usedWidth = 0;
//   let hidden = [];

//   chips.forEach((chip) => {
//     chip.style.display = "inline-flex";
//     const chipWidth = chip.offsetWidth + 12;
//     if (usedWidth + chipWidth > availableWidth) {
//       chip.style.display = "none";
//       hidden.push(chip);
//     } else {
//       usedWidth += chipWidth;
//     }
//   });

//   if (hidden.length > 0) {
//     dropdown.style.display = "inline-block";
//     counter.textContent = hidden.length;

//     hidden.forEach((chip) => {
//       const clone = chip.cloneNode(true);
//       clone.style.display = "flex";
//       dropdownList.appendChild(clone);
//     });
//   } else {
//     dropdown.style.display = "none";
//   }
// }
function adjustHeaderDropdown() {
  const container = headerList;
  const dropdown = container.querySelector(".chatbot_topic-dropdown");
  if (!dropdown) return;

  const dropdownList = dropdown.querySelector(".chatbot_topic-dropdown-list");
  const counter = dropdown.querySelector("#topics-counter");
  dropdownList.innerHTML = "";

  const chips = Array.from(
    container.querySelectorAll(".chatbot_modal-topic-item")
  );

  const activeChip = chips.find(
    chip => chip.dataset.categoryKey === activeKey
  );

  const availableWidth = container.clientWidth - 130;
  let usedWidth = 0;
  let hidden = [];

  // ---------------------------------------------------
  // STEP 1: Reset all chips
  // ---------------------------------------------------
  chips.forEach(chip => {
    chip.style.display = "inline-flex";
  });

  // ---------------------------------------------------
  // STEP 2: ALWAYS place active chip first
  // ---------------------------------------------------
  if (activeChip) {
    const width = activeChip.offsetWidth + 12;
    activeChip.style.display = "inline-flex";
    usedWidth = width; // reserve first space
  }

  // ---------------------------------------------------
  // STEP 3: Loop through other chips
  // ---------------------------------------------------
  chips.forEach(chip => {
    if (chip === activeChip) return; // already placed

    const chipWidth = chip.offsetWidth + 12;

    if (usedWidth + chipWidth > availableWidth) {
      chip.style.display = "none";
      hidden.push(chip);
    } else {
      chip.style.display = "inline-flex";
      usedWidth += chipWidth;
    }
  });

  // ---------------------------------------------------
  // STEP 4: Show dropdown if needed
  // ---------------------------------------------------
  if (hidden.length > 0) {
    dropdown.style.display = "inline-block";
    counter.textContent = hidden.length;

    hidden.forEach(chip => {
      const clone = chip.cloneNode(true);
      clone.style.display = "flex";
      dropdownList.appendChild(clone);
    });
  } else {
    dropdown.style.display = "none";
  }
}




// ---------- RENDER QUESTIONS ----------
// function renderQuestions(questions) {
//   suggestionsList.innerHTML = "";
//   const items = Array.isArray(questions) ? questions : [];
//   items.forEach((q) => {
//     const text = typeof q === "string" ? q : q?.question || "";
//     if (!text) return;
//     const pill = document.createElement("div");
//     pill.className = "chatbot_topic-suggections-item";
//     pill.innerHTML = `
//       <div>${text}</div>
//       <img src="https://cdn.prod.website-files.com/6560b4c29203fafcb9f6c716/69141f99bb1c116f61715ecc_close.svg"
//            loading="lazy" alt="" class="chatbot_modal-topic-close">
//     `;
//     suggestionsList.appendChild(pill);
//   });
// }
function renderQuestions(questions) {
  console.log("🎯 Rendering questions:", questions);

  suggestionsList.innerHTML = "";
  const items = Array.isArray(questions) ? questions : [];

  items.forEach((q) => {
    const text = typeof q === "string" ? q : q?.question || "";
    if (!text) return;

    const pill = document.createElement("div");
    pill.className = "chatbot_topic-suggections-item";
    pill.innerHTML = `
      <div>${text}</div>
      <img src="https://cdn.prod.website-files.com/6560b4c29203fafcb9f6c716/69141f99bb1c116f61715ecc_close.svg"
           loading="lazy" alt="" class="chatbot_modal-topic-close">
    `;

    // NEW - when clicking question → ask LLM
    pill.addEventListener("click", () => {
      if (isAsking) {
        console.log("⛔ Ignored click — already awaiting answer");
        return;
      }

      console.log("🟢 User clicked suggested question:", text);

      isAsking = true; // 🔐 lock clicks
      disableUI();
      askLLM(text);
    });

    suggestionsList.appendChild(pill);
  });
}

// ---------- FETCH QUESTIONS ----------
async function fetchQuestions(categoryKey) {
  const memberstack = window.$memberstackDom;
  const token = await memberstack.getMemberCookie();

  const url = `${QUESTIONS_ENDPOINT}?category=${encodeURIComponent(
    categoryKey
  )}`;
  const res = await fetch(url, {
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
  return data;
}

// ---------- MAIN SHOW FUNCTION ----------
async function showCategory(categoryKey) {
  clearChatHistory();
disableUI()
  allCategories = window.__CATEGORIES__ || {};
  activeKey = categoryKey;
  const label = allCategories[categoryKey] || categoryKey;

  screen1.style.display = "none";
  screen2.style.display = "block";
  screen2head.style.display = "block";

  const clearBtn = document.querySelector(".chatbot_modal-clear-chat");
  if (clearBtn) clearBtn.style.display = "flex";

  renderHeader(allCategories, categoryKey);

  // update text labels
  if (lookingLabelEl)
    lookingLabelEl.textContent = `You are looking in the '${label}' category.`;
  if (selectedHeadingEl) selectedHeadingEl.textContent = `'${label}.'`;
  if (selectedTopicInlineEl) selectedTopicInlineEl.textContent = label;

  loadingState.style.display = "flex";
  suggestionsWrapper.style.opacity = "0.4";
  suggestionsWrapper.style.display = "none";

  try {
    const data = await fetchQuestions(categoryKey);
    const questions = Array.isArray(data) ? data : data?.questions || [];
    renderQuestions(questions);
  } catch (e) {
    console.error(e);
    suggestionsList.innerHTML = `<div style="color:#c00;">Failed to load questions: ${e.message}</div>`;
  } finally {
    loadingState.style.display = "none";
    suggestionsWrapper.style.opacity = "1";
    suggestionsWrapper.style.display = "block";
    adjustHeaderDropdown();
    enableUI()
  }
}

// ---------- GLOBAL FUNCTIONS ----------
window.__selectCategory = (key) => showCategory(key);

// ✅ handle clicks for both visible and dropdown categories
headerList.addEventListener("click", (e) => {
  const chip = e.target.closest(".chatbot_modal-topic-item");
  if (!chip) return;
  const key = chip.dataset.categoryKey;
  if (!key) return;

  // close dropdown if inside
  const dropdownNav = headerList.querySelector(
    ".chatbot_topic-dropdown-navigation"
  );
  if (dropdownNav) dropdownNav.style.display = "none";

  // If suggestions were hidden → show container again
  const wrapper = document.querySelector(".chatbot_topic-suggestions-wrapper");
  if (wrapper) wrapper.style.display = "block";

  showCategory(key);
});

// ✅ dropdown toggle open/close
document.addEventListener("click", (e) => {
  const dropdown = headerList.querySelector(".chatbot_topic-dropdown");
  if (!dropdown) return;
  const toggle = dropdown.querySelector(".chatbot_topic-dropdown-toggle");
  const nav = dropdown.querySelector(".chatbot_topic-dropdown-navigation");

  if (toggle.contains(e.target)) {
    nav.style.display = nav.style.display === "block" ? "none" : "block";
  } else if (!dropdown.contains(e.target)) {
    nav.style.display = "none";
  }
});

// ---------------  adjust header on chatbot expand ----------------
const scaleBtn = document.querySelector(".chatbot_header-scale-icon");
if (scaleBtn) {
  scaleBtn.addEventListener("click", () => {
    // Wait a short delay so CSS transitions / resizing finish first
    setTimeout(() => {
      adjustHeaderDropdown();
    }, 300);
  });
}
const SubmitBtn = document.querySelector(".chatbot_question-submit");
if (SubmitBtn) {
  SubmitBtn.addEventListener("click", () => {
    // Wait a short delay so CSS transitions / resizing finish first
    setTimeout(() => {
      adjustHeaderDropdown();
    }, 300);
  });
}

// --------------- remove active category & hide suggestions ---------------
document.addEventListener("click", function (e) {
  const closeIcon = e.target.closest(".chatbot_modal-topic-close");
  if (!closeIcon) return;

  // detect if user closed an ACTIVE category chip
  const chipItem = closeIcon.closest(".chatbot_modal-topic-item");
  const closedKey = chipItem?.dataset?.categoryKey;

  // remove active style
  $(".chatbot_modal-topic-header-list")
    .find(".chatbot_modal-topic-item")
    .removeClass("is-active");

  // hide suggestions 
  const wrapper = document.querySelector(".chatbot_topic-category");
  if (wrapper) wrapper.style.display = "none";

  // ONLY reset label if user actually closed the active category
  if (closedKey === activeKey) {
    activeKey = null;

    const label = document.querySelector(".chatbot_modal-form-label-copy");
    if (label) {
      label.textContent = "Select a category to see questions.";
    }
  }

  // also hide selected category inline text
  if (selectedTopicInlineEl) selectedTopicInlineEl.textContent = "";
});
