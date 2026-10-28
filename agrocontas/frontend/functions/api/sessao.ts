import { jsonSuccess } from "../utils/httpResponse";

export const onRequestGet: PagesFunction = async () => jsonSuccess({ autenticado: true });
