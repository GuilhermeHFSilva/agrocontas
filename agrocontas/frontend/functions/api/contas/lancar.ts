import { Env } from "../../types/env";
import { createD1Db } from "../../db/d1Adapter";
import { lancarNfe } from "../../services/contaService";
import { responder } from "../../utils/responder";
import { NfeExtracao } from "../../../src/types/nfe";

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) =>
  responder(
    async () => lancarNfe(createD1Db(env.DB), (await request.json()) as NfeExtracao),
    "Registro lançado com sucesso.",
    201
  );
