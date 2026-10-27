import { Router } from "express";
import { contaController } from "../controllers/contaController";

const router = Router();

router.post("/verificar", (req, res) => contaController.verificar(req, res));

router.post("/lancar", (req, res) => contaController.lancar(req, res));

export const contaRoutes = router;
