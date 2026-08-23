import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DynamicNutritionService } from "@/lib/services/dynamic-nutrition.service";
import { YesterdaysDataClient } from "@/components/yesterday/YesterdaysDataClient";

export const dynamic = "force-dynamic";

export default async function YesterdaysDataPage() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    redirect("/login");
  }

  const initialData = await DynamicNutritionService.calculateDynamicOptimization(session.user.id);

  return (
    <div className="p-4 sm:p-8">
      <YesterdaysDataClient initialData={initialData} />
    </div>
  );
}
