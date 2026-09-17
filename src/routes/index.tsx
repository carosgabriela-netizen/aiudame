import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Sparkles, ChevronRight, Loader2, AlertCircle } from "lucide-react";
import { AppShell, AREAS, GRADOS } from "@/components/AppShell";
import { generarPistas } from "@/lib/pistas.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Pistas de aprendizaje | I.E. Peruano Suizo" },
      {
        name: "description",
        content:
          "Asistente con inteligencia artificial de la I.E. Peruano Suizo: entrega de 3 a 5 pistas por pregunta, adaptadas a primaria y secundaria según el currículo del Ministerio.",
      },
      { property: "og:title", content: "Pistas de aprendizaje | I.E. Peruano Suizo" },
      {
        property: "og:description",
        content: "Pistas guiadas, nunca la respuesta: aprendizaje acompañado para primaria y secundaria.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Inicio,
});

type Nivel = "primaria" | "secundaria";

function Inicio() {
  const [nivel, setNivel] = useState<Nivel>("primaria");
  const [grado, setGrado] = useState<string>(GRADOS.primaria[0]);
  const [area, setArea] = useState<string>(AREAS[0]);
  const [pregunta, setPregunta] = useState("");
  const [visibles, setVisibles] = useState(1);

  const pedirPistas = useServerFn(generarPistas);

  const mutacion = useMutation({
    mutationFn: async () => {
      const resultado = await pedirPistas({ data: { nivel, grado, area, pregunta } });
      await supabase.from("consultas").insert({
        nivel,
        grado,
        area,
        pregunta,
        pistas: resultado.pistas,
        estrategia: resultado.estrategia,
      });
      return resultado;
    },
    onMutate: () => setVisibles(1),
  });

  const cambiarNivel = (nuevo: Nivel) => {
    setNivel(nuevo);
    setGrado(GRADOS[nuevo][0]);
  };

  const resultado = mutacion.data;

  return (
    <AppShell>
      <section className="tarjeta p-4">
        <p className="text-xs font-semibold text-muted-foreground">Nivel escolar</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {(["primaria", "secundaria"] as const).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => cambiarNivel(n)}
              className={
                nivel === n
                  ? "boton-primario px-3 py-2.5 text-sm capitalize"
                  : "rounded-lg border border-border bg-secondary px-3 py-2.5 text-sm font-medium text-secondary-foreground capitalize"
              }
            >
              {n}
            </button>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          {nivel === "primaria"
            ? "Pistas cortas, con ejemplos concretos y palabras sencillas."
            : "Pistas con vocabulario académico, razonamiento y justificación."}
        </p>

        <div className="mt-4 grid gap-3">
          <label className="grid gap-1.5">
            <span className="text-xs font-semibold text-muted-foreground">Grado</span>
            <select
              value={grado}
              onChange={(e) => setGrado(e.target.value)}
              className="rounded-lg border border-input bg-card px-3 py-2.5 text-sm"
            >
              {GRADOS[nivel].map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1.5">
            <span className="text-xs font-semibold text-muted-foreground">Área curricular</span>
            <select
              value={area}
              onChange={(e) => setArea(e.target.value)}
              className="rounded-lg border border-input bg-card px-3 py-2.5 text-sm"
            >
              {AREAS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1.5">
            <span className="text-xs font-semibold text-muted-foreground">Tu pregunta o tarea</span>
            <textarea
              value={pregunta}
              onChange={(e) => setPregunta(e.target.value)}
              rows={4}
              placeholder="Ejemplo: ¿Cómo hallo el área de un triángulo si conozco su base y su altura?"
              className="resize-none rounded-lg border border-input bg-card px-3 py-2.5 text-sm"
            />
          </label>

          <button
            type="button"
            disabled={pregunta.trim().length < 4 || mutacion.isPending}
            onClick={() => mutacion.mutate()}
            className="boton-primario flex items-center justify-center gap-2 px-4 py-3 text-sm disabled:opacity-50"
          >
            {mutacion.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Preparando pistas...
              </>
            ) : (
              <>
                <Sparkles className="size-4" /> Dame pistas
              </>
            )}
          </button>
        </div>
      </section>

      {mutacion.isError && (
        <div className="tarjeta mt-4 flex gap-2 p-4 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <p>{(mutacion.error as Error).message}</p>
        </div>
      )}

      {resultado && (
        <section className="mt-4 grid gap-3">
          <div className="tarjeta p-4">
            <p className="text-xs font-semibold tracking-wide text-primary uppercase">Cómo abordarlo</p>
            <p className="mt-1 text-sm text-foreground">{resultado.estrategia}</p>
          </div>

          {resultado.pistas.slice(0, visibles).map((p, i) => (
            <article key={i} className="tarjeta p-4">
              <div className="flex items-center gap-2">
                <span className="marca-degradado flex size-7 items-center justify-center rounded-full text-xs font-bold text-primary-foreground">
                  {i + 1}
                </span>
                <h2 className="text-sm font-semibold">{p.titulo}</h2>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-foreground">{p.texto}</p>
            </article>
          ))}

          {visibles < resultado.pistas.length ? (
            <button
              type="button"
              onClick={() => setVisibles((v) => v + 1)}
              className="flex items-center justify-center gap-1 rounded-lg border border-border bg-secondary px-4 py-3 text-sm font-semibold text-secondary-foreground"
            >
              Ver siguiente pista ({visibles}/{resultado.pistas.length})
              <ChevronRight className="size-4" />
            </button>
          ) : (
            <div className="tarjeta p-4">
              <p className="text-xs font-semibold tracking-wide text-primary uppercase">
                Para pensar
              </p>
              <p className="mt-1 text-sm">{resultado.pregunta_reflexion}</p>
            </div>
          )}
        </section>
      )}
    </AppShell>
  );
}
