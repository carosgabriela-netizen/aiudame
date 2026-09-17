import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/historial")({
  head: () => ({
    meta: [
      { title: "Historial de pistas | I.E. Peruano Suizo" },
      {
        name: "description",
        content:
          "Revisa las preguntas consultadas y las pistas recibidas por nivel, grado y área en la I.E. Peruano Suizo.",
      },
      { property: "og:title", content: "Historial de pistas | I.E. Peruano Suizo" },
      {
        property: "og:description",
        content: "Todas las consultas guardadas con sus pistas, listas para repasar.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Historial,
});

type Pista = { titulo: string; texto: string };

function Historial() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["consultas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("consultas")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  const borrar = async (id: string) => {
    await supabase.from("consultas").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["consultas"] });
  };

  return (
    <AppShell>
      <h2 className="text-base font-bold">Consultas guardadas</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Se conservan para repasar el camino que siguió cada estudiante.
      </p>

      {isLoading && <p className="mt-6 text-sm text-muted-foreground">Cargando...</p>}
      {data?.length === 0 && (
        <p className="mt-6 text-sm text-muted-foreground">Todavía no hay consultas registradas.</p>
      )}

      <div className="mt-4 grid gap-3">
        {data?.map((c) => (
          <details key={c.id} className="tarjeta p-4">
            <summary className="cursor-pointer list-none">
              <span className="text-[11px] font-semibold tracking-wide text-primary uppercase">
                {c.nivel} · {c.grado} · {c.area}
              </span>
              <p className="mt-1 text-sm font-medium">{c.pregunta}</p>
            </summary>
            {c.estrategia && <p className="mt-3 text-sm text-muted-foreground">{c.estrategia}</p>}
            <ol className="mt-3 grid gap-2">
              {((c.pistas as unknown as Pista[]) ?? []).map((p, i) => (
                <li key={i} className="rounded-lg bg-secondary p-3">
                  <p className="text-xs font-semibold text-secondary-foreground">
                    {i + 1}. {p.titulo}
                  </p>
                  <p className="mt-1 text-sm">{p.texto}</p>
                </li>
              ))}
            </ol>
            <button
              type="button"
              onClick={() => borrar(c.id)}
              className="mt-3 flex items-center gap-1 text-xs font-semibold text-destructive"
            >
              <Trash2 className="size-3.5" /> Eliminar
            </button>
          </details>
        ))}
      </div>
    </AppShell>
  );
}
