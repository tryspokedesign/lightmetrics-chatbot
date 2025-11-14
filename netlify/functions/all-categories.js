// netlify/functions/health-proxy.js

const UPSTREAM_URL =
//   process.env.ALL_CATEGORY ||
  "https://reseller-api-dev.lightmetrics.co/v1/llm-kb/all-categories";

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

  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders(origin), body: "" };
  }

//   // Self-test mode (skip upstream)
//   if (event.queryStringParameters?.self === "1") {
//     return {
//       statusCode: 200,
//       headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
//       body: JSON.stringify({
//         ok: true,
//         upstream: UPSTREAM_URL,
//         note: "Self-test successful (no upstream call).",
//       }),
//     };
//   }

  try {
    // ✅ Forward request to upstream with required cookie header
    const upstreamResponse = await fetch(UPSTREAM_URL, {
      method: "GET",
      headers: {
        "Cookie":
          "AWSALBAuthNonce=okt2e445GMpRJB8d; AWSELBAuthSessionCookie-0=UhGFE/nA2P2AjXgn+5YyVo2dkOUvLR1oAX0FWqVG8jwVYvvrH3fdjWgHCi2bXEmqPUodyerVp1iQiA0KZJgmny0zI2c5mg7F/WPDQBlUO7T5EJFOKSHNGcrXgszuNVUONR1JeplhavVg+1IQ9dpbV8eJdei0zfpweX0urbDSx88SJQSecS6aFx9NEhEYmCruYZRjti0zSwDrqr4cJfQP8pycEm474d6dtRGJK2YpovE7empf+L2SnBMZdnYTO3qD5PIK/N+d4zhLieADPb/j7s5lN9763QbiZBuyss3JzI7psOHRu1yJBnfZlyXvCj8zV19xtMbmG9yviHkD0pOxk1f9mB+fanLfjivLXMWc0mTmGg0vR/CkqFoJabql02GGhS/8D/uw7b+EGmT/OEESJu1O8Fw3soPKtCY4MDRMbnzEFIx44TdhLuQXFdEhtPg7qHHgCH/Un3VZjSy+DzaVqiv5N3ejnPynU7vvcEO7t43tdjCmEoNIO8mz2r15kO9nbWj8GZJAyEzWI+aSrtML6S1jjfc6NqiC88GBUDeYOPFL2baL/BHLtQ==",
      },
    });

    const contentType = upstreamResponse.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");
    const data = isJson
      ? await upstreamResponse.json()
      : await upstreamResponse.text();

    return {
      statusCode: upstreamResponse.status,
      headers: {
        ...corsHeaders(origin),
        "Content-Type": isJson ? "application/json" : "text/plain",
      },
      body: isJson ? JSON.stringify(data, null, 2) : data,
    };
  } catch (error) {
    console.error("Proxy error:", error);
    return {
      statusCode: 500,
      headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
      body: JSON.stringify({ error: error.message }),
    };
  }
};
