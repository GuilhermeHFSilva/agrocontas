import { jsonSuccess } from "../utils/httpResponse";

// Protegida pelo _middleware: se chegou aqui, a sessão é válida.
export const onRequestGet: PagesFunction = async () => jsonSuccess({ autenticado: true });
