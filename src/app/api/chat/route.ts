import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server"; // Import Clerk auth
import { generateChatResponse } from "@/lib/openai";

export async function POST(req: NextRequest) {
  try {
    // Verify user authentication using Clerk
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json({ error: "Usuário não autenticado" }, { status: 401 });
    }

    const { message } = await req.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Mensagem inválida ou ausente" },
        { status: 400 }
      );
    }

    // Gerar resposta usando OpenAI
    // Consider passing userId or user context to OpenAI if personalization is needed
    const response = await generateChatResponse(message);

    return NextResponse.json({ response });

  } catch (error: any) {
    console.error("Erro na API de chat:", error);
    const errorMessage =
      error.message || "Erro interno ao processar sua mensagem";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

