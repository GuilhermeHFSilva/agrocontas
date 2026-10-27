import { Router } from "express";
import { classificacaoController } from "../controllers/classificacaoController";

const router = Router();

router.get("/", (req, res) => classificacaoController.listar(req, res));
router.post("/", (req, res) => classificacaoController.criar(req, res));
router.get("/:id", (req, res) => classificacaoController.obter(req, res));
router.put("/:id", (req, res) => classificacaoController.atualizar(req, res));
router.patch("/:id/status", (req, res) => classificacaoController.alterarStatus(req, res));

export const classificacaoRoutes = router;
