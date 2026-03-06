export const chatWithSiggy = async (message: string, history: { role: "user" | "model", parts: { text: string }[] }[] = []) => {
  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message, history }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to summon Siggy");
    }

    const data = await response.json();
    return data.text || "Siggy is currently distracted by a cosmic laser pointer.";
  } catch (error) {
    console.error("Siggy is having a hairball (API Error):", error);
    return "I've encountered a glitch in the space-time continuum. Or maybe I just don't want to talk right now. *knocks your connection off the table*";
  }
};
