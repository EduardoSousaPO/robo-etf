import { NextRequest, NextResponse } from "next/server";
import { generatePortfolioPDF } from "@/lib/pdf-generator";
import { createClient } from "@supabase/supabase-js";
import { getAuth } from "@clerk/nextjs/server"; // Use Clerk server-side auth
import { Portfolio as PrismaPortfolio } from "@prisma/client"; // Use Prisma type for consistency
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from "@/lib/constants"; // Use constants for keys

// Create a dedicated Supabase client for Storage using service key
// Ensure RLS policies on the bucket allow uploads based on user auth if needed,
// or rely on the service key's bypass capabilities (use with caution).
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Type for the request body (matching client-side structure)
// Use PrismaPortfolio['weights'] and PrismaPortfolio['metrics'] if they are JsonValue
interface PDFRequest {
  portfolio: {
    weights: Record<string, number>;
    metrics: {
      expectedReturn: number;
      risk: number;
      sharpeRatio: number;
    };
    rebalance_date: string; // Assuming string from client
  };
  riskScore: number;
  explanation: string;
}

export async function POST(request: NextRequest) {
  try {
    // Verify user authentication using Clerk
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ error: "Usuário não autenticado" }, { status: 401 });
    }

    // Get data from request body
    const { portfolio, riskScore, explanation } = (await request.json()) as PDFRequest;

    if (!portfolio || !riskScore || !explanation) {
      return NextResponse.json(
        { error: "Dados incompletos para gerar PDF" },
        { status: 400 }
      );
    }

    // Adapt portfolio metrics names if needed for pdf-generator
    const portfolioForPDF = {
      weights: portfolio.weights,
      metrics: {
        return: portfolio.metrics.expectedReturn,
        volatility: portfolio.metrics.risk,
        sharpe: portfolio.metrics.sharpeRatio,
      },
      rebalance_date: portfolio.rebalance_date,
    };

    // Generate PDF bytes
    const pdfBytes = await generatePortfolioPDF(
      portfolioForPDF,
      riskScore,
      explanation
    );

    // Define file name
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const fileName = `carteira-robo-etf-${userId}-${timestamp}.pdf`;
    const filePath = `${userId}/${fileName}`; // Store in user-specific folder

    // Upload PDF to Supabase Storage
    console.log(`Fazendo upload do PDF para: portfolio-pdfs/${filePath}`);
    const { error: uploadError } = await supabaseAdmin.storage
      .from("portfolio-pdfs") // Bucket name from setup
      .upload(filePath, pdfBytes, {
        contentType: "application/pdf",
        upsert: false, // Avoid overwriting accidentally, generate unique names
      });

    if (uploadError) {
      console.error("Erro ao fazer upload do PDF para o Supabase Storage:", uploadError);
      return NextResponse.json(
        { error: `Erro ao salvar PDF: ${uploadError.message}` },
        { status: 500 }
      );
    }
    console.log(`PDF carregado com sucesso: ${filePath}`);

    // Get public URL for the uploaded file
    const { data: urlData } = supabaseAdmin.storage
      .from("portfolio-pdfs")
      .getPublicUrl(filePath);

    if (!urlData?.publicUrl) {
        console.error("Não foi possível obter a URL pública para o PDF:", filePath);
        // Return success but without URL, or handle as error?
        // For now, return success but log the issue.
        return NextResponse.json({
            success: true,
            message: "PDF gerado e salvo, mas URL pública não disponível.",
            filePath: filePath // Provide path for potential manual retrieval
        });
    }

    console.log(`URL pública do PDF: ${urlData.publicUrl}`);

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
    });

  } catch (error: unknown) {
    console.error("Erro inesperado na API de geração de PDF:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Erro interno ao gerar PDF";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

