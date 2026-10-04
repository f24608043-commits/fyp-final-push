import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-[24px] bg-surface-border", className)}
      {...props}
    />
  )
}

export { Skeleton }
