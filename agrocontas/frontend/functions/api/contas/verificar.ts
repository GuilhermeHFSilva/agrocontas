import { Env } from "../../types/env";
import { createD1Db } from "../../db/d1Adapter";
import { verificarNfe } from "../../services/contaService";
import { responder } from "../../utils/responder";
import { NfeExtracao } from "../../../src/types/nfe";

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) =>
  responder(
    async () => verificarNfe(createD1Db(env.DB), (await request.json()) as NfeExtracao),
    "Consulta ao banco de dados concluída."
  );
