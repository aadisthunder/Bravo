const OPENROUTER_API_KEY =
  "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";

export async function sendMessage(messages) {
  try {
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "openrouter/auto", // Uses best available model
          messages: messages,
        }),
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error?.message || `HTTP error! status: ${response.status}`,
      );
    }

    const data = await response.json();
    if (data && data.choices && data.choices[0] && data.choices[0].message) {
      return data.choices[0].message.content;
    } else {
      throw new Error("Invalid response format from OpenRouter API.");
    }
  } catch (error) {
    console.error("Error communicating with OpenRouter:", error);
    throw error;
  }
}
