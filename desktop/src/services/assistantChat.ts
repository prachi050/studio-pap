const API_BASE = "http://127.0.0.1:8000";

export interface AssistantChatRequest {
  question: string;
  latest_analysis: Record<string, unknown> | null;
  image?: File | null;
}

export interface AssistantChatResponse {
  answer: string;
}

export async function askAssistant(
  request: AssistantChatRequest
): Promise<string> {

  // If there is an uploaded image, use the new endpoint.
  if (request.image) {
    const form = new FormData();

    form.append("question", request.question);

    form.append(
      "latest_analysis",
      JSON.stringify(request.latest_analysis)
    );

    form.append("image", request.image);

    const response = await fetch(
      `${API_BASE}/assistant/chat-with-image`,
      {
        method: "POST",
        body: form,
      }
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || "Assistant request failed.");
    }

    const data: AssistantChatResponse = await response.json();

    return data.answer;
  }

  // Otherwise continue using the normal endpoint.
  const response = await fetch(
    `${API_BASE}/assistant/chat`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        question: request.question,
        latest_analysis: request.latest_analysis,
      }),
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Assistant request failed.");
  }

  const data: AssistantChatResponse = await response.json();

  return data.answer;
}