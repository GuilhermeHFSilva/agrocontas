import { Router } from "express";
import { upload } from "../config/multer";
import { nfeController } from "../controllers/nfeController";

const router = Router();

router.post("/extract", upload.single("file"), (req, res) =>
  nfeController.extractNfe(req, res)
);

router.post("/test-config", (req, res) =>
  nfeController.testConfig(req, res)
);

router.get("/config", (req, res) =>
  nfeController.getConfig(req, res)
);

export const nfeRoutes = router;
