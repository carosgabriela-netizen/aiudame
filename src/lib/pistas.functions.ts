import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

const Entrada = z.object({
  grado: z.string().min(1),
  area: z.string().min(1),
  pregunta: z.string().min(3).max(2000),
});

type Pista = { titulo: string; texto: string };

const esquemaPistas = {
  type: "object",
  additionalProperties: false,
  properties: {
    estrategia: { type: "string" },
    pistas: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          titulo: { type: "string" },
          texto: { type: "string" },
        },
        required: ["titulo", "texto"],
      },
    },
    pregunta_reflexion: { type: "string" },
  },
  required: ["estrategia", "pistas", "pregunta_reflexion"],
} as const;

function instruccionesPor(grado: string, area: string) {
  return `Eres el asistente pedagógico de la I.E. Peruano Suizo (Perú). Tu regla absoluta e inviolable: NUNCA das la respuesta final, ni el resultado numérico, ni la palabra exacta, ni la conclusión. Solo das PISTAS que guían al estudiante a descubrirla por sí mismo.

Debes basarte siempre en el Currículo Nacional del Ministerio de Educación del Perú y en los recursos de materialeducativoperu.com que se te entregan como contexto. Si el contexto entregado cubre el tema, prioriza su enfoque, vocabulario y competencias por encima de cualquier otra fuente. La precisión pedagógica y curricular está por encima de la creatividad.

Área: ${area}. Grado: ${grado} (nivel secundaria).

Entrega entre 3 y 5 pistas, ordenadas de la más general a la más cercana a la respuesta (escalera de andamiaje). Cada pista tiene un título corto y un texto. La última pista deja al estudiante a un paso de resolverlo, pero jamás lo resuelve. Nunca incluyas la respuesta escondida, ni en ejemplos, ni entre paréntesis.

TONO PARA SECUNDARIA: lenguaje académico accesible propio de la edad, usa el vocabulario técnico correcto del área y explícalo brevemente. Promueve el razonamiento: pedir identificar datos, formular hipótesis, justificar con evidencia, revisar el procedimiento y verificar el resultado. Sin infantilizar, sin emojis, pistas de 2 a 4 oraciones con precisión conceptual.`;
}

export const generarPistas = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => Entrada.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("Falta la clave de la IA en el servidor.");

    const supabaseUrl = process.env["SUPABASE_URL"] ?? process.env["VITE_SUPABASE_URL"];
    const supabaseKey =
      process.env["SUPABASE_PUBLISHABLE_KEY"] ?? process.env["VITE_SUPABASE_PUBLISHABLE_KEY"];

    let contexto = "";
    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false },
      });
      const { data: recursos } = await supabase
        .from("recursos_ministerio")
        .select("titulo, nivel, grado, area, fuente, contenido")
        .in("nivel", ["secundaria", "ambos"])
        .order("created_at", { ascending: false })
        .limit(12);

      if (recursos?.length) {
        contexto = recursos
          .map(
            (r) =>
              `- ${r.titulo} (${r.area ?? "área general"} · ${r.grado ?? "todos los grados"} · fuente: ${r.fuente ?? "MINEDU"})\n${(r.contenido ?? "").slice(0, 1500)}`,
          )
          .join("\n\n");
      }
    }

    const entradaUsuario = `Pregunta del estudiante (secundaria, ${data.grado}, ${data.area}):\n"${data.pregunta}"\n\nRecursos curriculares del Ministerio disponibles:\n${contexto || "(Sin material cargado todavía: apóyate estrictamente en el Currículo Nacional del Perú y en el enfoque de materialeducativoperu.com para este grado y área.)"}\n\nDevuelve la respuesta en formato json con estrategia, pistas y pregunta_reflexion. Recuerda: pistas, nunca la respuesta.`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        stream: true,
        reasoning: { effort: "low", summary: "auto" },
        instructions: instruccionesPor(data.grado, data.area),
        input: [{ role: "user", content: [{ type: "input_text", text: entradaUsuario }] }],
        text: {
          format: {
            type: "json_schema",
            name: "pistas_pedagogicas",
            strict: true,
            schema: esquemaPistas,
          },
        },
      }),
    });

    if (!res.ok || !res.body) {
      const detalle = await res.text().catch(() => "");
      if (res.status === 429) throw new Error("Muchas consultas a la vez. Espera unos segundos.");
      if (res.status === 402)
        throw new Error("Se agotaron los créditos de IA de la aplicación. El administrador debe recargarlos.");
      throw new Error(`La IA no pudo responder (${res.status}). ${detalle.slice(0, 200)}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let texto = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lineas = buffer.split("\n");
      buffer = lineas.pop() ?? "";
      for (const linea of lineas) {
        if (!linea.startsWith("data:")) continue;
        const payload = linea.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        try {
          const evento = JSON.parse(payload) as {
            type?: string;
            delta?: string;
            response?: { output_text?: string };
          };
          if (evento.type === "response.output_text.delta" && typeof evento.delta === "string") {
            texto += evento.delta;
          } else if (evento.type === "response.completed" && evento.response?.output_text) {
            if (!texto) texto = evento.response.output_text;
          }
        } catch {
          // ignorar eventos parciales
        }
      }
    }

    let parsed: { estrategia: string; pistas: Pista[]; pregunta_reflexion: string };
    try {
      parsed = JSON.parse(texto);
    } catch {
      throw new Error("La IA respondió en un formato inesperado. Intenta nuevamente.");
    }

    const pistas = (parsed.pistas ?? []).slice(0, 5);
    if (pistas.length < 3) throw new Error("No se pudieron generar suficientes pistas. Intenta reformular la pregunta.");

    return {
      estrategia: parsed.estrategia,
      pistas,
      pregunta_reflexion: parsed.pregunta_reflexion,
    };
  });
