const FEEDBACK_URL =
  "https://reseller-api-dev.lightmetrics.co/v1/llm-kb/save-feedback";

const ALLOWED_ORIGINS = [
  "https://lightmetrics-chatbot.netlify.app",
  "https://lightmetrics-chatbot.webflow.io",
];

function getToken(event) {
  const origin = event.headers?.origin || "";

  const LOCALHOSTS = [
    "http://localhost:8888",
    "https://lightmetrics-chatbot.netlify.app/"
  ];

  const HARDCODED_TOKEN = `Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjZmNjU3ZGRiYWJmYmZkOTVhNGVkNjZjMjMyNDExZWFhNjE5OGQ4NGMxYmJkOGEyYTI5M2I4MTVmYjRhOTlhYjEifQ.eyJpZCI6Im1lbV9zYl9jbWV3aHJvcTcwMDE0MHd2YWhrcW00d2J6IiwidHlwZSI6Im1lbWJlciIsImlhdCI6MTc2MjkzODAwNiwiZXhwIjoxNzk0MDQyMDA2LCJhdWQiOiJhcHBfY2x6Mmt4dHB5MDA3ejB0cnA2aGNoM3g0eCIsImlzcyI6Imh0dHBzOi8vYXBpLm1lbWJlcnN0YWNrLmNvbSJ9.J1O4dBGRZyoJfCO1vxAqVTKlRWbUjtVQwcmzlpoOALifXDycfvZzsZlcyizJ8WHXNLA0GGyUvgv1hHXRxNGjZnE-g-4hr7yg1LLgMMPoXbJhzA9klwXQGNPB8aOwVoUXYUH_QPPLRMGTRnCWr9LUX7n5qFJsxkp-62_62eXA6QtwaoNVHOEU3MnD1D-NEqFEiSGknOt4AKWFrzTEg-wrbOtk4_DOut9Q9KAIjZ9gTN81SOJr8RaSgu29yQNdVBQnFWLbkKKpPTMhYcDqUjtUK5xgZpQ5ELqI9dCduqztWB9o7_w94lBeljvp8HyKWBYhUqR_gd6dHR4ntjD8gDUiaA`;

  if (LOCALHOSTS.includes(origin)) return HARDCODED_TOKEN;
  return event.headers["authorization"] || "";
}

function corsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : "*";
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    "Access-Control-Max-Age": "86400",
  };
}

exports.handler = async (event) => {
  const origin = event.headers?.origin || "";

  // Preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: corsHeaders(origin), body: "" };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  
  try {
    const incomingToken = getToken(event);
    const payload = JSON.parse(event.body || "{}");

    const upstream = await fetch(FEEDBACK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": incomingToken,
        // "Authorization": `Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjZmNjU3ZGRiYWJmYmZkOTVhNGVkNjZjMjMyNDExZWFhNjE5OGQ4NGMxYmJkOGEyYTI5M2I4MTVmYjRhOTlhYjEifQ.eyJpZCI6Im1lbV9zYl9jbWV3aHJvcTcwMDE0MHd2YWhrcW00d2J6IiwidHlwZSI6Im1lbWJlciIsImlhdCI6MTc2MjkzODAwNiwiZXhwIjoxNzk0MDQyMDA2LCJhdWQiOiJhcHBfY2x6Mmt4dHB5MDA3ejB0cnA2aGNoM3g0eCIsImlzcyI6Imh0dHBzOi8vYXBpLm1lbWJlcnN0YWNrLmNvbSJ9.J1O4dBGRZyoJfCO1vxAqVTKlRWbUjtVQwcmzlpoOALifXDycfvZzsZlcyizJ8WHXNLA0GGyUvgv1hHXRxNGjZnE-g-4hr7yg1LLgMMPoXbJhzA9klwXQGNPB8aOwVoUXYUH_QPPLRMGTRnCWr9LUX7n5qFJsxkp-62_62eXA6QtwaoNVHOEU3MnD1D-NEqFEiSGknOt4AKWFrzTEg-wrbOtk4_DOut9Q9KAIjZ9gTN81SOJr8RaSgu29yQNdVBQnFWLbkKKpPTMhYcDqUjtUK5xgZpQ5ELqI9dCduqztWB9o7_w94lBeljvp8HyKWBYhUqR_gd6dHR4ntjD8gDUiaA`,
      },
      body: JSON.stringify(payload),
    });

    const resultText = await upstream.text();

    return {
      statusCode: upstream.status,
      headers: corsHeaders(origin),
      body: resultText,
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: corsHeaders(origin),
      body: JSON.stringify({ error: err.message }),
    };
  }
};
