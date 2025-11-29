// --------------------------------------------------
// SIMPLE ENV CONFIG (Using match + base URL variables)
// --------------------------------------------------
const HOST = window.location.hostname;

// Base URLs (define ONCE)
const devBaseUrl  = "https://reseller-api-dev.lightmetrics.co/v1/llm-kb";
const liveBaseUrl = "https://reseller-api.lightmetrics.co/v1/llm-kb";

// Global API endpoint variables
let API_ALL_CATEGORIES     = "";
let API_CATEGORY_QUESTIONS = "";
let API_ASK_QUESTION       = "";
let API_SAVE_FEEDBACK      = "";

// STAGING (webflow)
if (HOST.match(/^lightmetrics-website\.webflow\.io$/)) {
  API_ALL_CATEGORIES     = `${devBaseUrl}/all-categories`;
  API_CATEGORY_QUESTIONS = `${devBaseUrl}/category-questions`;
  API_ASK_QUESTION       = `${devBaseUrl}/get-answer`;
  API_SAVE_FEEDBACK      = `${devBaseUrl}/save-feedback`;
}

// LIVE (lightmetrics.co)
else if (HOST.match(/^(www\.)?lightmetrics\.co$/)) {
  API_ALL_CATEGORIES     = `${liveBaseUrl}/all-categories`;
  API_CATEGORY_QUESTIONS = `${liveBaseUrl}/category-questions`;
  API_ASK_QUESTION       = `${liveBaseUrl}/get-answer`;
  API_SAVE_FEEDBACK      = `${liveBaseUrl}/save-feedback`;
}

// Unknown domain
else {
  console.warn("⚠️ Chatbot API not configured for this domain:", HOST);
}
