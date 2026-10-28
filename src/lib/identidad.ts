export type Identidad = { dni: string | null; nombre: string | null };

const CLAVE = "peruano-suizo-identidad";

export function leerIdentidad(): Identidad | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CLAVE);
    if (!raw) return null;
    const v = JSON.parse(raw) as Partial<Identidad> | null;
    if (v && (typeof v.dni === "string" || typeof v.nombre === "string")) {
      return { dni: v.dni ?? null, nombre: v.nombre ?? null };
    }
    return null;
  } catch {
    return null;
  }
}

export function guardarIdentidad(identidad: Identidad): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CLAVE, JSON.stringify(identidad));
}

export function borrarIdentidad(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(CLAVE);
}

export function etiquetaIdentidad(identidad: Identidad): string {
  if (identidad.dni) return `DNI ${identidad.dni}`;
  return identidad.nombre ?? "Estudiante";
}
