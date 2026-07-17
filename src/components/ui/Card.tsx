import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glass?: boolean;
}

export default function Card({ children, className, hover = false, glass = false }: CardProps) {
  return <div className={cn("rounded-2xl border border-slate-200 p-6", glass ? "bg-slate-50/80" : "bg-slate-50/50", hover && "transition-colors duration-200 hover:border-slate-300", className)}>{children}</div>;
}
