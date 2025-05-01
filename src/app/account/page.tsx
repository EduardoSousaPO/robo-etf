// src/app/account/page.tsx
import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getProfileById } from "@/lib/repository";
import AccountClient from "@/components/account/account-client"; // New client component
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Profile } from "@prisma/client";

// Loading Skeleton
function AccountLoadingSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Skeleton className="mb-6 h-8 w-48" />
      <div className="mb-4 border-b">
        <div className="flex space-x-4">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-10 w-48" />
        </CardContent>
      </Card>
    </div>
  );
}

// Server component to fetch data
async function AccountData() {
  const { userId } = auth();

  if (!userId) {
    redirect("/sign-in");
  }

  let profile: Profile | null = null;
  try {
    profile = await getProfileById(userId);
    // If profile doesn't exist, create a basic one?
    // This should ideally happen during onboarding or first login.
    // For now, we assume it exists or handle the null case in the client.
    if (!profile) {
      console.warn(`Perfil não encontrado para ${userId}, será tratado no cliente.`);
      // Optionally create a default profile here if needed
      // profile = await createOrUpdateProfile({ id: userId, name: null, risk_score: null, subscription_status: 'free' });
    }
  } catch (error) {
    console.error("Erro ao buscar perfil do usuário na página da conta:", error);
    // Handle error state - maybe pass error to client component?
  }

  // Pass profile data (or null) to the client component
  return <AccountClient profile={profile} />;
}

// Main Page Component (Server Component)
export default function AccountPage() {
  return (
    <Suspense fallback={<AccountLoadingSkeleton />}>
      <AccountData />
    </Suspense>
  );
}

