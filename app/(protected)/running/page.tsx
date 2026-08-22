"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function RunningRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/activities");
  }, [router]);

  return (
    <div className="py-24 text-center flex flex-col items-center justify-center space-y-3">
      <Loader2 className="h-7 w-7 animate-spin text-emerald-400" />
      <p className="text-xs text-foreground-muted font-semibold">
        Redirecting to Unified Activities Hub...
      </p>
    </div>
  );
}
