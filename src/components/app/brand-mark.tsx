import { BriefcaseBusiness } from "lucide-react";
import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-brand text-primary-foreground shadow-glow",
        className,
      )}
    >
      <BriefcaseBusiness className="size-[18px]" strokeWidth={2.2} />
    </div>
  );
}
