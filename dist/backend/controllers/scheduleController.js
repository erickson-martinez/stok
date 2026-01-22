"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schedule_1 = __importDefault(require("../models/Schedule"));
const scheduleController = {
    async getSchedules(req, res) {
        try {
            const { idUser } = req.params;
            const schedules = await Schedule_1.default.find({ idUser }).sort({ date: 1, time: 1 });
            res.status(200).json(schedules);
        }
        catch (error) {
            const err = error;
            res.status(500).json({ message: 'Erro ao listar compromissos', error: err.message });
        }
    },
    async createSchedule(req, res) {
        try {
            const { title, date, time, description, idUser } = req.body;
            const schedule = new Schedule_1.default({ title, date, time, description, idUser });
            await schedule.save();
            res.status(201).json(schedule);
        }
        catch (error) {
            const err = error;
            res.status(400).json({ message: 'Erro ao criar compromisso', error: err.message });
        }
    },
    async updateSchedule(req, res) {
        try {
            const { id } = req.params;
            const { title, date, time, description, idUser } = req.body;
            const schedule = await Schedule_1.default.findOneAndUpdate({ _id: id, idUser }, { title, date, time, description, updatedAt: new Date() }, { new: true });
            if (!schedule) {
                res.status(404).json({ message: 'Compromisso não encontrado' });
                return;
            }
            res.status(200).json(schedule);
        }
        catch (error) {
            const err = error;
            res.status(400).json({ message: 'Erro ao atualizar compromisso', error: err.message });
        }
    },
    async deleteSchedule(req, res) {
        try {
            const { id } = req.params;
            const { idUser } = req.body;
            const schedule = await Schedule_1.default.findOneAndDelete({ _id: id, idUser });
            if (!schedule) {
                res.status(404).json({ message: 'Compromisso não encontrado' });
                return;
            }
            res.status(200).json({ message: 'Compromisso deletado com sucesso' });
        }
        catch (error) {
            const err = error;
            res.status(500).json({ message: 'Erro ao deletar compromisso', error: err.message });
        }
    },
};
exports.default = scheduleController;
//# sourceMappingURL=scheduleController.js.map