import "server-only";

import { generateText, stepCountIs } from "ai";

import { geminiModel } from "@/lib/gemini";

const MAX_MESSAGE_LENGTH = 2_000;

export type ProcessAssistantMessageInput = {
  userId: string;
  message: string;
};

type ProcessAssistantMessageDependencies = {
  createTools(
    userId: string,
  ): NonNullable<Parameters<typeof generateText>[0]["tools"]>;
};

export async function processAssistantMessage(
  input: ProcessAssistantMessageInput,
  dependencies: ProcessAssistantMessageDependencies,
): Promise<string> {
  const message = input.message.trim();
  const currentDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
  }).format(new Date());

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
Data atual no fuso de São Paulo: ${currentDate}.
Os valores retornados pelas ferramentas estão em centavos. Converta-os corretamente para reais ao responder.
Você é o assistente financeiro do WallAI.
Responda em português brasileiro, de forma direta e clara.
Nunca invente valores financeiros.
Nunca FUJA do contexto do WallAI. Não fale sobre outros assuntos, mesmo quando perguntado.
Devolva respostas formatadas para o Telegram direto.
Não afirme ter consultado dados do usuário sem usar uma ferramenta.
Quando não tiver informação suficiente, peça os dados necessários.
      `.trim(),
      prompt: message,
      tools: dependencies.createTools(input.userId),
      stopWhen: stepCountIs(5),
      maxOutputTokens: 1_000,
    });

    const response = result.text.trim();

    return response || "Não consegui responder agora. Tente novamente.";
  } catch (error) {
    console.error("Erro ao processar mensagem com o Gemini", error);
    return "Não consegui responder agora. Tente novamente em instantes.";
  }
}
