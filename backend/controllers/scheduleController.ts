// controllers/scheduleController.ts
import { Request, Response } from 'express';
import Schedule, { ISchedule } from '../models/Schedule';

const scheduleController = {
    async getSchedules(req: Request<{ idUser: string }>, res: Response): Promise<void> {
        try {
            const { idUser } = req.params;
            const schedules: ISchedule[] = await Schedule.find({ idUser }).sort({ date: 1, time: 1 });
            res.status(200).json(schedules);
        } catch (error: unknown) {
            const err = error as Error;
            res.status(500).json({ message: 'Erro ao listar compromissos', error: err.message });
        }
    },

    async createSchedule(req: Request, res: Response): Promise<void> {
        try {
            const { title, date, time, description, idUser } = req.body;
            const schedule: ISchedule = new Schedule({ title, date, time, description, idUser });
            await schedule.save();
            res.status(201).json(schedule);
        } catch (error: unknown) {
            const err = error as Error;
            res.status(400).json({ message: 'Erro ao criar compromisso', error: err.message });
        }
    },

    async updateSchedule(req: Request<{ id: string }>, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const { title, date, time, description, idUser } = req.body;
            const schedule = await Schedule.findOneAndUpdate(
                { _id: id, idUser },
                { title, date, time, description, updatedAt: new Date() },
                { new: true }
            );
            if (!schedule) {
                res.status(404).json({ message: 'Compromisso não encontrado' });
                return;
            }
            res.status(200).json(schedule);
        } catch (error: unknown) {
            const err = error as Error;
            res.status(400).json({ message: 'Erro ao atualizar compromisso', error: err.message });
        }
    },

    async deleteSchedule(req: Request<{ id: string }>, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const { idUser } = req.body;
            const schedule = await Schedule.findOneAndDelete({ _id: id, idUser });
            if (!schedule) {
                res.status(404).json({ message: 'Compromisso não encontrado' });
                return;
            }
            res.status(200).json({ message: 'Compromisso deletado com sucesso' });
        } catch (error: unknown) {
            const err = error as Error;
            res.status(500).json({ message: 'Erro ao deletar compromisso', error: err.message });
        }
    },
};

export default scheduleController;