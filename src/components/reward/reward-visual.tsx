import { rewardIconSrc } from "@/lib/reward-icons";
import { cn } from "@/lib/format";

/** Foto hadiah bila diunggah admin; bila tidak, ikon 3D berwarna. */
export function RewardVisual({ id, icon, imageAt, name, size = "md", muted = false, className }: { id: string; icon: string | null; imageAt: Date | string | null; name: string; size?: "sm" | "md"; muted?: boolean; className?: string }) {
  const photo = imageAt ? `/api/reward/${id}/foto?v=${new Date(imageAt).getTime()}` : null;
  return (
    <div className={cn("relative flex items-center justify-center overflow-hidden", size === "sm" ? "size-12 rounded-xl" : "aspect-[4/3] w-full rounded-xl", photo ? "bg-ink-50" : "bg-gradient-to-br from-brand-50 via-white to-gold/15 ring-1 ring-inset ring-brand-100", muted && "grayscale opacity-70", className)}>
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photo} alt={name} loading="lazy" className="h-full w-full object-cover" />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={rewardIconSrc(icon)} alt="" aria-hidden loading="lazy" className={cn("drop-shadow-sm", size === "sm" ? "size-9" : "size-[58%] max-h-24 max-w-24 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3")} />
      )}
    </div>
  );
}
