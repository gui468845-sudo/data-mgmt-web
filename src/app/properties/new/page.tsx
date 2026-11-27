import { Suspense } from "react";
import { PropertyForm } from "@/components/properties/property-form";
import { createClient } from "@/lib/supabase/server";
import type { MandalayTownship } from "@/lib/types";

export const instant = false;

async function NewPropertyContent() {
  const supabase = await createClient();
  const { data: townships } = await supabase
    .from("mandalay_townships")
    .select("id, name_mm, name_en")
    .order("id");

  return (
    <PropertyForm
      mode="create"
      townships={(townships ?? []) as MandalayTownship[]}
    />
  );
}

export default function NewPropertyPage() {
  return (
    <Suspense fallback={<div className="text-sm text-muted">Loading form…</div>}>
      <NewPropertyContent />
    </Suspense>
  );
}
