// src/app/api/profile/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { createOrUpdateProfile, getProfileById } from "@/lib/repository"; // Use Prisma repository

interface ProfileUpdateRequest {
  userId: string; // Passed explicitly from frontend for now, but rely on getAuth
  name?: string | null;
  riskScore: number;
}

export async function POST(request: NextRequest) {
  try {
    // Verify user authentication using Clerk
    const { userId: authUserId } = getAuth(request);
    if (!authUserId) {
      return NextResponse.json({ error: "Usuário não autenticado" }, { status: 401 });
    }

    // Get data from request body
    const { userId, name, riskScore } = (await request.json()) as ProfileUpdateRequest;

    // Security check: Ensure the userId in the body matches the authenticated user
    if (userId !== authUserId) {
      console.warn(`Tentativa de atualizar perfil para usuário diferente: ${userId} por ${authUserId}`);
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    // Validate risk score
    if (typeof riskScore !== "number" || riskScore < 1 || riskScore > 5) {
      return NextResponse.json(
        { error: "Perfil de risco inválido. Deve ser um número entre 1 e 5." },
        { status: 400 }
      );
    }

    // Prepare data for saving
    const profileData = {
      id: authUserId,
      name: name, // Allow null or string
      risk_score: riskScore,
      // subscription_status will default to 'free' via Prisma schema or be preserved if exists
    };

    // Save or update profile using Prisma repository
    const savedProfile = await createOrUpdateProfile(profileData);

    console.log(`Perfil salvo/atualizado para usuário ${authUserId}:`, savedProfile);

    return NextResponse.json(savedProfile);

  } catch (error: any) {
    console.error("Erro ao salvar/atualizar perfil:", error);
    // Check for specific Prisma errors if needed
    return NextResponse.json(
      { error: error.message || "Erro interno ao salvar perfil." },
      { status: 500 }
    );
  }
}

// Optional: GET handler to fetch profile (might be redundant if pages fetch directly)
export async function GET(request: NextRequest) {
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ error: "Usuário não autenticado" }, { status: 401 });
    }

    const profile = await getProfileById(userId);

    if (!profile) {
      // You might want to return a 404 or a default profile structure
      return NextResponse.json({ error: "Perfil não encontrado" }, { status: 404 });
    }

    return NextResponse.json(profile);

  } catch (error: any) {
    console.error("Erro ao buscar perfil:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno ao buscar perfil." },
      { status: 500 }
    );
  }
}

