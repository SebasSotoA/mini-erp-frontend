import { cn } from "@/lib/utils"

interface SkeletonStyledProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
}

export function SkeletonStyled({ className, ...props }: SkeletonStyledProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-camouflage-green-100",
        className
      )}
      {...props}
    />
  )
}
