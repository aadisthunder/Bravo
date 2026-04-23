const OPENROUTER_API_KEY =
  "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";

async function fetchFromModel(model, systemPrompt, originalMessages) {
  try {
    // Prepend system prompt to the messages
    const messages = [
      { role: "system", content: systemPrompt },
      ...originalMessages,
    ];

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: model,
          messages: messages,
        }),
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return `Error from ${model}: ${errorData.error?.message || response.statusText}`;
    }

    const data = await response.json();
    if (data && data.choices && data.choices[0] && data.choices[0].message) {
      return data.choices[0].message.content;
    } else {
      return `Invalid response format from ${model}.`;
    }
  } catch (error) {
    return `Exception from ${model}: ${error.message}`;
  }
}

export async function sendMessage(messages, onProgress) {
  let res1 = "⏳ *Thinking...*";
  let res2 = "⏳ *Thinking...*";
  let res3 = "⏳ *Thinking...*";

  const updateProgress = () => {
    if (onProgress) {
      onProgress(
        `### 🕵️ Agent 1: Research & Context\n${res1}\n\n---\n\n### ⚖️ Agent 2: Authenticity & Verification\n${res2}\n\n---\n\n### 🤖 Agent 3: AI Generation Analysis\n${res3}`
      );
    }
  };

  updateProgress();

  // Agent 1: Researcher (Retrieves relevant info)
  const p1 = fetchFromModel(
    "openrouter/free",
    "You are a Research Agent. Your job is to gather detailed factual information, news, and context regarding the user's request. Provide a comprehensive summary of relevant facts. Do NOT output markdown headers larger than h3 (###).",
    messages,
  ).then(data => {
    res1 = data;
    updateProgress();
    return data;
  });

  // Agent 2: Fact-checker / Authenticator
  const p2 = fetchFromModel(
    "nvidia/nemotron-3-super-120b-a12b:free",
    "You are a Verification Agent. Your job is to analyze the user's premise for logical fallacies, biases, or inconsistencies. Check the authenticity of the claims made. Provide a skeptical analysis. Do NOT output markdown headers larger than h3 (###).",
    messages,
  ).then(data => {
    res2 = data;
    updateProgress();
    return data;
  });

  // Agent 3: AI Detector / Content Analyst
  const p3 = fetchFromModel(
    "liquid/lfm-2.5-1.2b-instruct:free",
    "You are an AI-Detection Agent. Your job is to analyze the prompt and estimate whether the claims or the style of the text sound artificially generated or reflect organic, human writing. Focus on stylistic and structural analysis. Do NOT output markdown headers larger than h3 (###).",
    messages,
  ).then(data => {
    res3 = data;
    updateProgress();
    return data;
  });

  await Promise.all([p1, p2, p3]);

  return `### 🕵️ Agent 1: Research & Context\n${res1}\n\n---\n\n### ⚖️ Agent 2: Authenticity & Verification\n${res2}\n\n---\n\n### 🤖 Agent 3: AI Generation Analysis\n${res3}`;
}
