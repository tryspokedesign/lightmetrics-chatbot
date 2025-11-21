// netlify/functions/health-proxy.js

const UPSTREAM_URL =
//   process.env.ALL_CATEGORY ||
  "https://reseller-api-dev.lightmetrics.co/v1/llm-kb/all-categories";

const ALLOWED_ORIGINS = [
  "https://lightmetrics-chatbot.netlify.app",
  "https://lightmetrics-chatbot.webflow.io",
  "http://localhost:8888",
];

// --- TOKEN HELPER ---
function getToken(event) {
  const origin = event.headers?.origin || "";
  console.log("origin", event.headers["authorization"],origin )
  const LOCALHOSTS = [
    "http://localhost:8888",
    "https://lightmetrics-chatbot.netlify.app/"
  ];

  const HARDCODED_TOKEN = `Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjZmNjU3ZGRiYWJmYmZkOTVhNGVkNjZjMjMyNDExZWFhNjE5OGQ4NGMxYmJkOGEyYTI5M2I4MTVmYjRhOTlhYjEifQ.eyJpZCI6Im1lbV9zYl9jbWV3aHJvcTcwMDE0MHd2YWhrcW00d2J6IiwidHlwZSI6Im1lbWJlciIsImlhdCI6MTc2MjkzODAwNiwiZXhwIjoxNzk0MDQyMDA2LCJhdWQiOiJhcHBfY2x6Mmt4dHB5MDA3ejB0cnA2aGNoM3g0eCIsImlzcyI6Imh0dHBzOi8vYXBpLm1lbWJlcnN0YWNrLmNvbSJ9.J1O4dBGRZyoJfCO1vxAqVTKlRWbUjtVQwcmzlpoOALifXDycfvZzsZlcyizJ8WHXNLA0GGyUvgv1hHXRxNGjZnE-g-4hr7yg1LLgMMPoXbJhzA9klwXQGNPB8aOwVoUXYUH_QPPLRMGTRnCWr9LUX7n5qFJsxkp-62_62eXA6QtwaoNVHOEU3MnD1D-NEqFEiSGknOt4AKWFrzTEg-wrbOtk4_DOut9Q9KAIjZ9gTN81SOJr8RaSgu29yQNdVBQnFWLbkKKpPTMhYcDqUjtUK5xgZpQ5ELqI9dCduqztWB9o7_w94lBeljvp8HyKWBYhUqR_gd6dHR4ntjD8gDUiaA`;

  if (LOCALHOSTS.includes(origin)) return HARDCODED_TOKEN;
  return event.headers["authorization"] || "";
}

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
    console.log("origin",  )
  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders(origin), body: "" };
  }


  try {
    // 🔥 GET TOKEN FROM BROWSER
    const incomingToken = getToken(event)


    
    // ✅ Forward request to upstream with required cookie header
    const upstreamResponse = await fetch(UPSTREAM_URL, {
      method: "GET",
      headers: {
        // "Authorization": `Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjZmNjU3ZGRiYWJmYmZkOTVhNGVkNjZjMjMyNDExZWFhNjE5OGQ4NGMxYmJkOGEyYTI5M2I4MTVmYjRhOTlhYjEifQ.eyJpZCI6Im1lbV9zYl9jbWV3aHJvcTcwMDE0MHd2YWhrcW00d2J6IiwidHlwZSI6Im1lbWJlciIsImlhdCI6MTc2MjkzODAwNiwiZXhwIjoxNzk0MDQyMDA2LCJhdWQiOiJhcHBfY2x6Mmt4dHB5MDA3ejB0cnA2aGNoM3g0eCIsImlzcyI6Imh0dHBzOi8vYXBpLm1lbWJlcnN0YWNrLmNvbSJ9.J1O4dBGRZyoJfCO1vxAqVTKlRWbUjtVQwcmzlpoOALifXDycfvZzsZlcyizJ8WHXNLA0GGyUvgv1hHXRxNGjZnE-g-4hr7yg1LLgMMPoXbJhzA9klwXQGNPB8aOwVoUXYUH_QPPLRMGTRnCWr9LUX7n5qFJsxkp-62_62eXA6QtwaoNVHOEU3MnD1D-NEqFEiSGknOt4AKWFrzTEg-wrbOtk4_DOut9Q9KAIjZ9gTN81SOJr8RaSgu29yQNdVBQnFWLbkKKpPTMhYcDqUjtUK5xgZpQ5ELqI9dCduqztWB9o7_w94lBeljvp8HyKWBYhUqR_gd6dHR4ntjD8gDUiaA`,
        "Authorization": incomingToken,
       //  "AWSALBAuthNonce=okt2e445GMpRJB8d; AWSELBAuthSessionCookie-0=UhGFE/nA2P2AjXgn+5YyVo2dkOUvLR1oAX0FWqVG8jwVYvvrH3fdjWgHCi2bXEmqPUodyerVp1iQiA0KZJgmny0zI2c5mg7F/WPDQBlUO7T5EJFOKSHNGcrXgszuNVUONR1JeplhavVg+1IQ9dpbV8eJdei0zfpweX0urbDSx88SJQSecS6aFx9NEhEYmCruYZRjti0zSwDrqr4cJfQP8pycEm474d6dtRGJK2YpovE7empf+L2SnBMZdnYTO3qD5PIK/N+d4zhLieADPb/j7s5lN9763QbiZBuyss3JzI7psOHRu1yJBnfZlyXvCj8zV19xtMbmG9yviHkD0pOxk1f9mB+fanLfjivLXMWc0mTmGg0vR/CkqFoJabql02GGhS/8D/uw7b+EGmT/OEESJu1O8Fw3soPKtCY4MDRMbnzEFIx44TdhLuQXFdEhtPg7qHHgCH/Un3VZjSy+DzaVqiv5N3ejnPynU7vvcEO7t43tdjCmEoNIO8mz2r15kO9nbWj8GZJAyEzWI+aSrtML6S1jjfc6NqiC88GBUDeYOPFL2baL/BHLtQ==",
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






// const upstreamResponse = await fetch('https://reseller-api-dev.lightmetrics.co/v1/llm-kb/health-check', {
//   method: "GET",
//   headers: {
//     "Authorization": `Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjZmNjU3ZGRiYWJmYmZkOTVhNGVkNjZjMjMyNDExZWFhNjE5OGQ4NGMxYmJkOGEyYTI5M2I4MTVmYjRhOTlhYjEifQ.eyJpZCI6Im1lbV9zYl9jbWV3aHJvcTcwMDE0MHd2YWhrcW00d2J6IiwidHlwZSI6Im1lbWJlciIsImlhdCI6MTc2MjkzODAwNiwiZXhwIjoxNzk0MDQyMDA2LCJhdWQiOiJhcHBfY2x6Mmt4dHB5MDA3ejB0cnA2aGNoM3g0eCIsImlzcyI6Imh0dHBzOi8vYXBpLm1lbWJlcnN0YWNrLmNvbSJ9.J1O4dBGRZyoJfCO1vxAqVTKlRWbUjtVQwcmzlpoOALifXDycfvZzsZlcyizJ8WHXNLA0GGyUvgv1hHXRxNGjZnE-g-4hr7yg1LLgMMPoXbJhzA9klwXQGNPB8aOwVoUXYUH_QPPLRMGTRnCWr9LUX7n5qFJsxkp-62_62eXA6QtwaoNVHOEU3MnD1D-NEqFEiSGknOt4AKWFrzTEg-wrbOtk4_DOut9Q9KAIjZ9gTN81SOJr8RaSgu29yQNdVBQnFWLbkKKpPTMhYcDqUjtUK5xgZpQ5ELqI9dCduqztWB9o7_w94lBeljvp8HyKWBYhUqR_gd6dHR4ntjD8gDUiaA`,
//    //  "AWSALBAuthNonce=okt2e445GMpRJB8d; AWSELBAuthSessionCookie-0=UhGFE/nA2P2AjXgn+5YyVo2dkOUvLR1oAX0FWqVG8jwVYvvrH3fdjWgHCi2bXEmqPUodyerVp1iQiA0KZJgmny0zI2c5mg7F/WPDQBlUO7T5EJFOKSHNGcrXgszuNVUONR1JeplhavVg+1IQ9dpbV8eJdei0zfpweX0urbDSx88SJQSecS6aFx9NEhEYmCruYZRjti0zSwDrqr4cJfQP8pycEm474d6dtRGJK2YpovE7empf+L2SnBMZdnYTO3qD5PIK/N+d4zhLieADPb/j7s5lN9763QbiZBuyss3JzI7psOHRu1yJBnfZlyXvCj8zV19xtMbmG9yviHkD0pOxk1f9mB+fanLfjivLXMWc0mTmGg0vR/CkqFoJabql02GGhS/8D/uw7b+EGmT/OEESJu1O8Fw3soPKtCY4MDRMbnzEFIx44TdhLuQXFdEhtPg7qHHgCH/Un3VZjSy+DzaVqiv5N3ejnPynU7vvcEO7t43tdjCmEoNIO8mz2r15kO9nbWj8GZJAyEzWI+aSrtML6S1jjfc6NqiC88GBUDeYOPFL2baL/BHLtQ==",
//   },
// });
// const data = await upstreamResponse.json();
// c