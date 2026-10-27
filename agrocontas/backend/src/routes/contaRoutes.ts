import { Router } from "express";
import { contaController } from "../controllers/contaController";
import { movimentoController } from "../controllers/movimentoController";

const router = Router();

// Fluxo da extração de PDF (2ª etapa): consulta e lançamento. Declarados antes de "/:id".
router.post("/verificar", (req, res) => contaController.verificar(req, res));
router.post("/lancar", (req, res) => contaController.lancar(req, res));

// Registro de contas a pagar / a receber.
router.get("/", (req, res) => movimentoController.listar(req, res));
router.post("/", (req, res) => movimentoController.criar(req, res));
router.get("/:id", (req, res) => movimentoController.obter(req, res));
router.put("/:id", (req, res) => movimentoController.atualizar(req, res));
router.patch("/:id/status", (req, res) => movimentoController.alterarStatus(req, res));

export const contaRoutes = router;
