/** Stub pour les tests : `next/root-params` est un placeholder remplacé par le compilateur Next.js
 * au build, inutilisable tel quel hors d'une vraie requête Next (voir AGENTS.md). Les modules testés
 * ici (ReportDocument.tsx via getDictionary.ts) l'importent au chargement mais n'appellent jamais
 * `lang()` dans les chemins exercés par ces tests — un stub minimal suffit à satisfaire l'import. */
export function lang(): Promise<string | undefined> {
  return Promise.resolve(undefined);
}
