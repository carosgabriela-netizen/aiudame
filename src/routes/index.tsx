import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Sparkles, ChevronRight, Loader2, AlertCircle, LogOut, IdCard } from "lucide-react";
import { AppShell, AREAS, GRADOS } from "@/components/AppShell";
import { generarPistas } from "@/lib/pistas.functions";
import { supabase } from "@/integrations/supabase/client";
import {
  leerIdentidad,
  guardarIdentidad,
  borrarIdentidad,
  etiquetaIdentidad,
  type Identidad,
} from "@/lib/identidad";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Pistas de aprendizaje | I.E. Peruano Suizo" },
      {
        name: "description",
        content:
          "Asistente con inteligencia artificial de la I.E. Peruano Suizo para secundaria: entrega de 3 a 5 pistas por pregunta, adaptadas al grado y área según el currículo del Ministerio.",
      },
      { property: "og:title", content: "Pistas de aprendizaje | I.E. Peruano Suizo" },
      {
        property: "og:description",
        content: "Pistas guiadas, nunca la respuesta: aprendizaje acompañado para secundaria.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Inicio,
});

type Pista = { titulo: string; texto: string };

function Ingreso({ onListo }: { onListo: (i: Identidad) => void }) {
  const [modo, setModo] = useState<"dni" | "nombre">("dni");
  const [dni, setDni] = useState("");
  const [nombre, setNombre] = useState("");

  const dniValido = /^\d{8}$/.test(dni.trim());
  const nombreValido = nombre.trim().length >= 2;

  const entrar = () => {
    const identidad: Identidad =
      modo === "dni" ? { dni: dni.trim(), nombre: null } : { dni: null, nombre: nombre.trim() };
    guardarIdentidad(identidad);
    onListo(identidad);
  };

  return (
    <section className="tarjeta mt-2 grid gap-3 p-5">
      <div className="flex items-center gap-2">
        <span className="marca-degradado flex size-9 items-center justify-center rounded-full text-primary-foreground">
          <IdCard className="size-4" />
        </span>
        <div>
          <h2 className="text-sm font-bold">Ingresa para empezar</h2>
          <p className="text-xs text-muted-foreground">
            Así se guarda quién hizo cada consulta en el historial.
          </p>
        </div>
      </div>

      {modo === "dni" ? (
        <>
          <label className="grid gap-1.5">
            <span className="text-xs font-semibold text-muted-foreground">Tu DNI (8 dígitos)</span>
            <input
              value={dni}
              onChange={(e) => setDni(e.target.value.replace(/\D/g, "").slice(0, 8))}
              inputMode="numeric"
              autoComplete="off"
              placeholder="12345678"
              className="rounded-lg border border-input bg-card px-3 py-2.5 text-sm tracking-widest"
            />
          </label>
          <button
            type="button"
            disabled={!dniValido}
            onClick={entrar}
            className="boton-primario flex items-center justify-center gap-2 px-4 py-3 text-sm disabled:opacity-50"
          >
            Ingresar
          </button>
          <button
            type="button"
            onClick={() => setModo("nombre")}
            className="text-xs font-semibold text-primary underline underline-offset-2"
          >
            No sé mi DNI — ingresar solo con mi nombre
          </button>
        </>
      ) : (
        <>
          <label className="grid gap-1.5">
            <span className="text-xs font-semibold text-muted-foreground">Tu nombre</span>
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              autoComplete="off"
              placeholder="Ejemplo: Carlos"
              className="rounded-lg border border-input bg-card px-3 py-2.5 text-sm"
            />
            <span className="text-[11px] text-muted-foreground">
              Solo tu nombre, sin apellidos.
            </span>
          </label>
          <button
            type="button"
            disabled={!nombreValido}
            onClick={entrar}
            className="boton-primario flex items-center justify-center gap-2 px-4 py-3 text-sm disabled:opacity-50"
          >
            Entrar con mi nombre
          </button>
          <button
            type="button"
            onClick={() => setModo("dni")}
            className="text-xs font-semibold text-primary underline underline-offset-2"
          >
            Prefiero poner mi DNI
          </button>
        </>
      )}
    </section>
  );
}

function Inicio() {
  const [identidad, setIdentidad] = useState<Identidad | null>(null);
  const [cargado, setCargado] = useState(false);
  const [grado, setGrado] = useState<string>(GRADOS[0]);
  const [area, setArea] = useState<string>(AREAS[0]);
  const [pregunta, setPregunta] = useState("");
  const [visibles, setVisibles] = useState(1);

  useEffect(() => {
    setIdentidad(leerIdentidad());
    setCargado(true);
  }, []);

  const pedirPistas = useServerFn(generarPistas);

  const mutacion = useMutation({
    mutationFn: async () => {
      const resultado = await pedirPistas({ data: { grado, area, pregunta } });
      await supabase.from("consultas").insert({
        grado,
        area,
        pregunta,
        pistas: resultado.pistas,
        estrategia: resultado.estrategia,
        usuario_dni: identidad?.dni ?? null,
        usuario_nombre: identidad?.nombre ?? null,
      });
      return resultado;
    },
    onMutate: () => setVisibles(1),
  });

  const resultado = mutacion.data;

  if (cargado && !identidad) {
    return (
      <AppShell>
        <Ingreso onListo={setIdentidad} />
      </AppShell>
    );
  }

  return (
    <AppShell>
      {identidad && (
        <div className="mb-3 flex items-center justify-between rounded-lg border border-border bg-secondary px-3 py-2">
          <p className="text-xs font-semibold text-secondary-foreground">
            Hola, {etiquetaIdentidad(identidad)}
          </p>
          <button
            type="button"
            onClick={() => {
              borrarIdentidad();
              setIdentidad(null);
            }}
            className="flex items-center gap-1 text-xs font-semibold text-primary"
          >
            <LogOut className="size-3.5" /> Salir
          </button>
        </div>
      )}

      <section className="tarjeta p-4">
        <div className="mt-2 grid gap-3">
          <label className="grid gap-1.5">
            <span className="text-xs font-semibold text-muted-foreground">Grado</span>
            <select
              value={grado}
              onChange={(e) => setGrado(e.target.value)}
              className="rounded-lg border border-input bg-card px-3 py-2.5 text-sm"
            >
              {GRADOS.map((g) => (
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
