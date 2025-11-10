// netlify/functions/health-proxy.js
const UPSTREAM_URL = process.env.UPSTREAM_URL
  || "https://reseller-api-dev.lightmetrics.co/v1/llm-kb/health-check";

// Change this to your production domain(s)
const ALLOWED_ORIGINS = [
  "https://lightmetrics-chatbot.webflow.io/"
//   "https://your-custom-domain.com"
];

function corsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : "";
  return {
    "Access-Control-Allow-Origin": allowed || "*", // tighten to specific domains in prod
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    "Access-Control-Max-Age": "86400",
  };
}

exports.handler = async (event) => {
  const origin = event.headers?.origin || "";

  // 1) Preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: corsHeaders(origin),
      body: "",
    };
  }

  try {
    // 2) Call your upstream API (GET)
    const res = await fetch(UPSTREAM_URL, {
      method: "GET",
      // If the upstream needs auth, set it via Netlify env var and forward here
      headers: {
        "Accept": "application/json",
        // Example: "Authorization": `Bearer ${process.env.UPSTREAM_BEARER}`,
      },
    });

    const contentType = res.headers.get("content-type") || "text/plain";
    const body = await res.text();

    return {
      statusCode: res.status,
      headers: {
        ...corsHeaders(origin),
        "Content-Type": contentType,
      },
      body,
    };
  } catch (err) {
    return {
      statusCode: 502,
      headers: corsHeaders(origin),
      body: JSON.stringify({ error: "Upstream request failed", message: err.message }),
    };
  }
};
