import { Link } from "@tanstack/react-router";
import { Lightbulb, History, BookOpen } from "lucide-react";
import type { ReactNode } from "react";

const items = [
  { to: "/", label: "Pistas", icon: Lightbulb },
  { to: "/historial", label: "Historial", icon: History },
  { to: "/recursos", label: "Material", icon: BookOpen },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-background">
      <header className="marca-degradado sticky top-0 z-10 px-5 pt-6 pb-5 text-primary-foreground">
        <p className="text-[11px] font-semibold tracking-[0.18em] uppercase opacity-90">
          I.E. Peruano Suizo
        </p>
        <h1 className="mt-1 text-xl leading-tight font-bold">Guía de aprendizaje</h1>
        <p className="mt-1 text-xs opacity-90">
          Pistas inteligentes, nunca la respuesta. Basadas en el currículo del Ministerio.
        </p>
      </header>

      <main className="flex-1 px-4 pt-5 pb-28">{children}</main>

      <nav className="fixed bottom-0 left-1/2 z-20 w-full max-w-md -translate-x-1/2 border-t border-border bg-card px-2 pt-2 pb-3">
        <ul className="flex items-center justify-around">
          {items.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <Link
                to={to}
                activeOptions={{ exact: to === "/" }}
                className="flex w-20 flex-col items-center gap-1 rounded-lg py-1 text-[11px] font-medium text-muted-foreground transition-colors"
                activeProps={{ className: "text-primary" }}
              >
                <Icon className="size-5" />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

export const GRADOS = {
  primaria: ["1° primaria", "2° primaria", "3° primaria", "4° primaria", "5° primaria", "6° primaria"],
  secundaria: ["1° secundaria", "2° secundaria", "3° secundaria", "4° secundaria", "5° secundaria"],
} as const;

export const AREAS = [
  "Matemática",
  "Comunicación",
  "Ciencia y Tecnología",
  "Personal Social",
  "Ciencias Sociales",
  "Desarrollo Personal, Ciudadanía y Cívica",
  "Inglés",
  "Arte y Cultura",
  "Educación Física",
  "Educación Religiosa",
] as const;
