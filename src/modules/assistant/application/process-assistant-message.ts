import "server-only";

import { generateText } from "ai";

import { geminiModel } from "@/lib/gemini";

const MAX_MESSAGE_LENGTH = 2_000;

export type ProcessAssistantMessageInput = {
  message: string;
};

export async function processAssistantMessage(
  input: ProcessAssistantMessageInput,
): Promise<string> {
  const message = input.message.trim();

  if (!message) {
    return "Envie uma mensagem para eu poder ajudar.";
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    return "Sua mensagem está muito longa. Resuma e tente novamente.";
  }

  try {
    const result = await generateText({
      model: geminiModel,
      system: `
Você é o assistente financeiro do Wallai.
Responda em português brasileiro, de forma direta e clara.
Nunca invente valores financeiros.
Não afirme ter consultado dados do usuário sem usar uma ferramenta.
Quando não tiver informação suficiente, peça os dados necessários.
      `.trim(),
      prompt: message,
      maxOutputTokens: 500,
      timeout: 15_000,
    });

    const response = result.text.trim();

    return response || "Não consegui responder agora. Tente novamente.";
  } catch (error) {
    console.error("Erro ao processar mensagem com o Gemini", error);
    return "Não consegui responder agora. Tente novamente em instantes.";
  }
}
