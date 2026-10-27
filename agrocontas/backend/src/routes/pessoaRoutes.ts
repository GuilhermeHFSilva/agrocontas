import { Router } from "express";
import { pessoaController } from "../controllers/pessoaController";

const router = Router();

router.get("/", (req, res) => pessoaController.listar(req, res));
router.post("/", (req, res) => pessoaController.criar(req, res));
router.get("/:id", (req, res) => pessoaController.obter(req, res));
router.put("/:id", (req, res) => pessoaController.atualizar(req, res));
router.patch("/:id/status", (req, res) => pessoaController.alterarStatus(req, res));

export const pessoaRoutes = router;
