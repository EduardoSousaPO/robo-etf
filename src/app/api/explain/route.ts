import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server"; // Import Clerk auth
import { explainAllocation } from "@/lib/openai";

export async function POST(req: NextRequest) {
  try {
    // Verify user authentication using Clerk
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json({ error: "Usuário não autenticado" }, { status: 401 });
    }

    const { portfolio, riskScore } = await req.json();

    if (!portfolio || typeof riskScore !== 'number') {
      return NextResponse.json(
        { error: "Dados incompletos ou inválidos para gerar explicação" },
        { status: 400 }
      );
    }

    // Gerar explicação da carteira usando OpenAI
    const explanation = await explainAllocation(portfolio, riskScore);

    return NextResponse.json({ explanation });

  } catch (error: any) {
    console.error("Erro ao gerar explicação:", error);
    // Check if the error is from OpenAI API (e.g., rate limit, invalid key)
    const errorMessage =
      error.message || "Erro interno ao gerar explicação da carteira";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

