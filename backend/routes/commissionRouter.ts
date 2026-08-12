import { Router } from "express";
import {
    createCommission,
    getCommissionsByLinkId,
    getCommissionById,
    updateCommission,
    deleteCommission,
    getCommissionsByStatus,
    getCommissionsByBarber,
} from "../controllers/commissionController";

const router = Router();

// POST - Criar nova comissão
router.post("/", createCommission);

// GET - Buscar comissões por linkId
router.get("/by-link", getCommissionsByLinkId);

// GET - Buscar comissões por status
router.get("/by-status", getCommissionsByStatus);

// GET - Buscar comissões de um barbeiro específico
router.get("/by-barber", getCommissionsByBarber);

// GET - Buscar comissão por ID
router.get("/:id", getCommissionById);

// PUT - Atualizar comissão
router.put("/:id", updateCommission);

// DELETE - Deletar comissão
router.delete("/:id", deleteCommission);

export default router;
