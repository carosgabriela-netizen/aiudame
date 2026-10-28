import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Trash2, Upload, Loader2 } from "lucide-react";
import { AppShell, AREAS, GRADOS } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/recursos")({
  head: () => ({
    meta: [
      { title: "Material del Ministerio | I.E. Peruano Suizo" },
      {
        name: "description",
        content:
          "Carga los cuadernos y fichas del Ministerio de Educación para que las pistas se ajusten al currículo nacional peruano.",
      },
      { property: "og:title", content: "Material del Ministerio | I.E. Peruano Suizo" },
      {
        property: "og:description",
        content: "Biblioteca curricular que alimenta las pistas del asistente escolar.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Recursos,
});

function Recursos() {
  const qc = useQueryClient();
  const [titulo, setTitulo] = useState("");
  const [grado, setGrado] = useState("");
  const [area, setArea] = useState<string>(AREAS[0]);
  const [contenido, setContenido] = useState("");
  const [archivo, setArchivo] = useState<File | null>(null);

  const { data } = useQuery({
    queryKey: ["recursos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("recursos_ministerio")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const guardar = useMutation({
    mutationFn: async () => {
      let archivo_url: string | null = null;
      if (archivo) {
        const ruta = `${Date.now()}-${archivo.name.replace(/[^\w.\-]/g, "_")}`;
        const { error } = await supabase.storage.from("material-ministerio").upload(ruta, archivo);
        if (error) throw error;
        archivo_url = ruta;
      }
      const { error } = await supabase.from("recursos_ministerio").insert({
        titulo: titulo || archivo?.name || "Material del Ministerio",
        nivel: "secundaria",
        grado: grado || null,
        area,
        contenido: contenido || null,
        archivo_url,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setTitulo("");
      setContenido("");
      setGrado("");
      setArchivo(null);
      qc.invalidateQueries({ queryKey: ["recursos"] });
    },
  });

  const borrar = async (id: string) => {
    await supabase.from("recursos_ministerio").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["recursos"] });
  };

  const grados = [...GRADOS];

  return (
    <AppShell>
      <h2 className="text-base font-bold">Material del Ministerio</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Sube los archivos o pega el texto de materialeducativoperu.com. Las pistas se apoyarán en
        este contenido antes que en cualquier otra fuente.
      </p>

      <section className="tarjeta mt-4 grid gap-3 p-4">
        <label className="grid gap-1.5">
          <span className="text-xs font-semibold text-muted-foreground">Título</span>
          <input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Cuaderno de trabajo Matemática 3°"
            className="rounded-lg border border-input bg-card px-3 py-2.5 text-sm"
          />
        </label>

        <label className="grid gap-1.5">
          <span className="text-xs font-semibold text-muted-foreground">Grado (opcional)</span>
          <select
            value={grado}
            onChange={(e) => setGrado(e.target.value)}
            className="rounded-lg border border-input bg-card px-3 py-2.5 text-sm"
          >
            <option value="">Todos los grados</option>
            {grados.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1.5">
          <span className="text-xs font-semibold text-muted-foreground">Área</span>
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
          <span className="text-xs font-semibold text-muted-foreground">
            Contenido o resumen (lo que usará la IA)
          </span>
          <textarea
            value={contenido}
            onChange={(e) => setContenido(e.target.value)}
            rows={4}
            placeholder="Pega aquí el texto de la ficha, competencias, capacidades o desempeños."
            className="resize-none rounded-lg border border-input bg-card px-3 py-2.5 text-sm"
          />
        </label>

        <label className="grid gap-1.5">
          <span className="text-xs font-semibold text-muted-foreground">Archivo (PDF, imagen)</span>
          <input
            type="file"
            onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
            className="rounded-lg border border-dashed border-input bg-card px-3 py-2.5 text-xs"
          />
        </label>

        <button
          type="button"
          disabled={guardar.isPending || (!titulo && !archivo && !contenido)}
          onClick={() => guardar.mutate()}
          className="boton-primario flex items-center justify-center gap-2 px-4 py-3 text-sm disabled:opacity-50"
        >
          {guardar.isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Guardando...
            </>
          ) : (
            <>
              <Upload className="size-4" /> Agregar al material
            </>
          )}
        </button>
        {guardar.isError && (
          <p className="text-xs text-destructive">{(guardar.error as Error).message}</p>
        )}
      </section>

      <div className="mt-4 grid gap-2">
        {data?.map((r) => (
          <article key={r.id} className="tarjeta flex items-start justify-between gap-3 p-3">
            <div>
              <p className="text-sm font-semibold">{r.titulo}</p>
              <p className="text-[11px] text-muted-foreground">
                {r.grado ?? "todos los grados"} · {r.area ?? "área general"}
              </p>
            </div>
            <button type="button" onClick={() => borrar(r.id)} className="text-destructive">
              <Trash2 className="size-4" />
            </button>
          </article>
        ))}
      </div>
    </AppShell>
  );
}
