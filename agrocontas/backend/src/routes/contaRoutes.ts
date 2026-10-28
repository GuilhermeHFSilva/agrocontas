import { Router } from "express";
import { contaController } from "../controllers/contaController";
import { movimentoController } from "../controllers/movimentoController";

const router = Router();

router.post("/verificar", (req, res) => contaController.verificar(req, res));
router.post("/lancar", (req, res) => contaController.lancar(req, res));

router.get("/", (req, res) => movimentoController.listar(req, res));
router.post("/", (req, res) => movimentoController.criar(req, res));
router.get("/:id", (req, res) => movimentoController.obter(req, res));
router.put("/:id", (req, res) => movimentoController.atualizar(req, res));
router.patch("/:id/status", (req, res) => movimentoController.alterarStatus(req, res));

export const contaRoutes = router;
