// --------------------------------------
// AUTO-DETECT ENVIRONMENT (LIVE / STAGING)
// --------------------------------------
const hostname_feedback = window.location.hostname;
let FEEDBACK_ENDPOINT = "";

// STAGING DOMAIN
if (hostname_feedback.includes("webflow.io")) {
  FEEDBACK_ENDPOINT = "https://reseller-api-dev.lightmetrics.co/v1/llm-kb/save-feedback";
}
// LIVE DOMAIN
else if (hostname_feedback.includes("lightmetrics.co")) {
  FEEDBACK_ENDPOINT = "https://reseller-api.lightmetrics.co/v1/llm-kb/save-feedback";
}
// FALLBACK (LOCAL or OTHER)
else {
  console.log("Send Feedback Api is not set");
}
// // Netlify endpoint
// const FEEDBACK_ENDPOINT =
//   "https://reseller-api-dev.lightmetrics.co/v1/llm-kb/save-feedback";

// -------------------------------------------------------
// Show success message INSIDE the specific answer block
// -------------------------------------------------------
function showLocalSuccess(answerBlock, message) {
  const el = answerBlock.querySelector(".chatbot-action-form-response");
  if (!el) return;

  el.textContent = message || "Thank you for your feedback!";
  el.style.display = "block";
  el.style.opacity = 1;

  setTimeout(() => {
    el.style.opacity = 0;
    setTimeout(() => {
      el.style.display = "none";
    }, 300);
  }, 2000);
}

// ---------------------------------------
// Build feedback payload
// ---------------------------------------
function buildPayload(type, comment = "", commentType = "") {
  return {
    sessionId: window.__sessionId,
    query: window.__lastQuestion,
    answer: window.__lastAnswer,
    type,
    comment,
    commentType,
    timestampUTC: new Date().toISOString(),
    status: "IN_REVIEW",
    metadata: { userId: 123 },
  };
}

// -----------------------------------------------
// 1️⃣ LIKE BUTTON → SEND POSITIVE FEEDBACK
// -----------------------------------------------
document.addEventListener("click", async (e) => {
  const btn = e.target.closest(".chatbot_modal-action-like");
  if (!btn) return;

  console.log("👍 Sending LIKE feedback...");

  const answerBlock = btn.closest(".chatbot_topic-answer-wrapper");

  const formWrapper = answerBlock.querySelector(".chatbot-action-form-wrapper");
  const dislikeBtn = answerBlock.querySelector(".chatbot_modal-action-dislike");

  if (formWrapper) formWrapper.style.display = "none";
  if (dislikeBtn) {
    dislikeBtn.querySelector(".selected-dislike-icon").style.display = "none";
    dislikeBtn.querySelector(".default-dislike-icon").style.display = "block";
  }

  btn.querySelector(".default-like-icon").style.display = "none";
  btn.querySelector(".selected-like-icon").style.display = "block";

  const payload = buildPayload("POSITIVE");

  const memberstack = window.$memberstackDom;
    const token = await memberstack.getMemberCookie();

  const res = await fetch(FEEDBACK_ENDPOINT, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  showLocalSuccess(answerBlock, data.message);
});

// ----------------------------------------------------------------------
// ⭐ NEW: VALIDATE CHECKBOXES — enable/disable submit button PER BLOCK
// ----------------------------------------------------------------------
document.addEventListener("change", (e) => {
  if (!e.target.closest(".chatbot_action-form-checkbox")) return;

  const answerBlock = e.target.closest(".chatbot_topic-answer-wrapper");
  const submitBtn = answerBlock.querySelector(".chatbot_action-form-submit");
  const checkboxes = answerBlock.querySelectorAll(
    ".chatbot_action-form-checkbox input"
  );

  const anyChecked = Array.from(checkboxes).some((c) => c.checked);

  if (anyChecked) {
    submitBtn.classList.remove("is-disabled");

    const err = answerBlock.querySelector(".chatbot_action-form-error");
    if (err) err.style.display = "none";
  } else {
    submitBtn.classList.add("is-disabled");
  }
});

// ------------------------------------------------------------
// 2️⃣ DISLIKE → SUBMIT FORM inside the correct answer block ONLY
// ------------------------------------------------------------
document.addEventListener("click", async (e) => {
  const btn = e.target.closest(".chatbot_action-form-submit");
  if (!btn) return;

  const answerBlock = btn.closest(".chatbot_topic-answer-wrapper");
  const formWrapper = answerBlock.querySelector(".chatbot-action-form-wrapper");

  const checkboxes = answerBlock.querySelectorAll(
    ".chatbot_action-form-checkbox input"
  );
  const anyChecked = Array.from(checkboxes).some((c) => c.checked);

  const errorEl = answerBlock.querySelector(".chatbot_action-form-error");

  // ❌ If no checkbox selected → show error + stop submit
  if (!anyChecked) {
    btn.classList.add("is-disabled");
    if (errorEl) {
      errorEl.style.display = "block";
      errorEl.style.opacity = 1;
    }
    return;
  }

  // ✔ Hide error if conditions are correct
  if (errorEl) errorEl.style.display = "none";

  // Collect selected types
  let selectedTypes = [];
  answerBlock
    .querySelectorAll(".chatbot_action-form-checkbox input:checked")
    .forEach((input) => selectedTypes.push(input.dataset.name));

  const commentText =
    answerBlock.querySelector(".chatbot_action-aditional-text")?.value ||
    "No additional details provided.";

  const payload = buildPayload(
    "NEGATIVE",
    commentText,
    selectedTypes.join(", ")
  );
  const memberstack = window.$memberstackDom;
    const token = await memberstack.getMemberCookie();

  const res = await fetch(FEEDBACK_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
     },
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  formWrapper.style.opacity = 0;
  setTimeout(() => {
    formWrapper.style.display = "none";
  }, 300);

  showLocalSuccess(answerBlock, data.message);

  // Reset checkboxes + comment
  checkboxes.forEach((c) => (c.checked = false));
  const textField = answerBlock.querySelector(".chatbot_action-aditional-text");
  if (textField) textField.value = "";

  // After submit → disable the button again
  btn.classList.add("is-disabled");

  // 🔒 Disable LIKE + DISLIKE after submitting feedback
  const likeBtn = answerBlock.querySelector(".chatbot_modal-action-like");
  const dislikeBtn = answerBlock.querySelector(".chatbot_modal-action-dislike");

  if (likeBtn) {
    likeBtn.style.pointerEvents = "none";
    likeBtn.style.opacity = "0.4";
  }

  if (dislikeBtn) {
    dislikeBtn.style.pointerEvents = "none";
    dislikeBtn.style.opacity = "0.4";
  }
});

// -----------------------------------------------------------
// COPY BUTTON → COPY THE ANSWER TEXT INSIDE THIS ANSWER BLOCK
// -----------------------------------------------------------
document.addEventListener("click", async (e) => {
  const btn = e.target.closest(".chatbot_modal-action-copy");
  if (!btn) return;

  const answerBlock = btn.closest(".chatbot_topic-answer-wrapper");
  const answerTextEl = answerBlock.querySelector(
    ".chatbot_topic-answer-richtext"
  );

  if (!answerTextEl) return;

  const textToCopy = answerTextEl.innerText.trim();
  try {
    await navigator.clipboard.writeText(textToCopy);
  } catch (err) {
    console.error("❌ Clipboard failed", err);
    return;
  }

  const msg = btn.querySelector(".chatbot-action-form-response");
  msg.textContent = "Copied!";
  if (msg) {
    msg.style.display = "block";
    msg.style.opacity = 1;

    setTimeout(() => {
      msg.style.opacity = 0;
      setTimeout(() => (msg.style.display = "none"), 200);
    }, 1500);
  }
});
