// netlify/functions/category-questions.js
const BASE = 
// process.env.CATEGORY_QUESTIONS_BASE ||
  "https://reseller-api-dev.lightmetrics.co/v1/llm-kb/category-questions";

const ALLOWED_ORIGINS = [
  "https://lightmetrics-chatbot.netlify.app",
  "https://lightmetrics-chatbot.webflow.io",
];

function corsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : "";
  return {
    "Access-Control-Allow-Origin": allowed || "*",
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    "Access-Control-Max-Age": "86400",
  };
}

exports.handler = async (event) => {
  const origin = event.headers?.origin || "";

  // CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders(origin), body: "" };
  }
  console.log("event", event);
  const category = event.queryStringParameters?.category || "";
  if (!category) {
    return {
      statusCode: 400,
      headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Missing required query param: category" }),
    };
  }

  try {
    const url = `${BASE}?category=${encodeURIComponent(category)}`;
    const upstream = await fetch(url, {
      method: "GET",
      headers: {
        // include cookie if your upstream requires it (same as your all-categories func)
        "Cookie":
          "AWSALBAuthNonce=okt2e445GMpRJB8d; AWSELBAuthSessionCookie-0=UhGFE/nA2P2AjXgn+5YyVo2dkOUvLR1oAX0FWqVG8jwVYvvrH3fdjWgHCi2bXEmqPUodyerVp1iQiA0KZJgmny0zI2c5mg7F/WPDQBlUO7T5EJFOKSHNGcrXgszuNVUONR1JeplhavVg+1IQ9dpbV8eJdei0zfpweX0urbDSx88SJQSecS6aFx9NEhEYmCruYZRjti0zSwDrqr4cJfQP8pycEm474d6dtRGJK2YpovE7empf+L2SnBMZdnYTO3qD5PIK/N+d4zhLieADPb/j7s5lN9763QbiZBuyss3JzI7psOHRu1yJBnfZlyXvCj8zV19xtMbmG9yviHkD0pOxk1f9mB+fanLfjivLXMWc0mTmGg0vR/CkqFoJabql02GGhS/8D/uw7b+EGmT/OEESJu1O8Fw3soPKtCY4MDRMbnzEFIx44TdhLuQXFdEhtPg7qHHgCH/Un3VZjSy+DzaVqiv5N3ejnPynU7vvcEO7t43tdjCmEoNIO8mz2r15kO9nbWj8GZJAyEzWI+aSrtML6S1jjfc6NqiC88GBUDeYOPFL2baL/BHLtQ==", // <-- keep your full cookie here
      },
    });

    const ctype = upstream.headers.get("content-type") || "";
    const isJson = ctype.includes("application/json");
    const data = isJson ? await upstream.json() : await upstream.text();

    return {
      statusCode: upstream.status,
      headers: {
        ...corsHeaders(origin),
        "Content-Type": isJson ? "application/json" : "text/plain",
      },
      body: isJson ? JSON.stringify(data, null, 2) : data,
    };
  } catch (err) {
    console.error("category-questions proxy error:", err);
    return {
      statusCode: 500,
      headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
      body: JSON.stringify({ error: err.message }),
    };
  }
};
