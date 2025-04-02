import { Request, Response } from 'express';
import ActivityLog from '../models/Activity';

interface ActivityRequest {
    phone: string;
    phoneShared?: string;
    start?: string[];
    pause?: string[];
    return?: string[];
    final?: string[];
    activities?: { time: string; description: string }[];
}

const activityController = {
    async getActivities(req: Request, res: Response): Promise<void> {
        try {
            const { phone } = req.params;
            const date = new Date()
            if (!phone) {
                res.status(400).json({ error: 'Phone é obrigatório' });
                return;
            }

            const activityLog = await ActivityLog.findOne({ phone });
            if (!activityLog) {
                res.status(404).json({ error: 'Registro não encontrado' });
                return;
            }

            if (date) {
                const filteredActivities = {
                    start: activityLog.start.filter(d => d.toISOString().startsWith(date.toISOString().slice(0, 10))),
                    pause: activityLog.pause.filter(d => d.toISOString().startsWith(date.toISOString().slice(0, 10))),
                    return: activityLog.return.filter(d => d.toISOString().startsWith(date.toISOString().slice(0, 10))),
                    final: activityLog.final.filter(d => d.toISOString().startsWith(date.toISOString().slice(0, 10))),
                    activities: activityLog.activities.filter(a => a.time.toISOString().startsWith(date.toISOString().slice(0, 10)))
                };
                res.json(filteredActivities);
            } else {
                res.json(activityLog);
            }
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    },

    async createOrUpdateActivity(req: Request, res: Response): Promise<void> {
        try {
            const { phone, phoneShared, start, pause, return: returnTime, final, activities }: ActivityRequest = req.body;

            if (!phone) {
                res.status(400).json({ error: 'Phone é obrigatório' });
                return;
            }

            let activityLog = await ActivityLog.findOne({ phone });

            if (!activityLog) {
                activityLog = new ActivityLog({
                    phone,
                    phoneShared,
                    start: start ? start.map(s => new Date(s)) : [],
                    pause: pause ? pause.map(p => new Date(p)) : [],
                    return: returnTime ? returnTime.map(r => new Date(r)) : [],
                    final: final ? final.map(f => new Date(f)) : [],
                    activities: activities ? activities.map(a => ({ time: new Date(a.time), description: a.description })) : []
                });
            } else {
                if (start) activityLog.start.push(...start.map(s => new Date(s)));
                if (pause) activityLog.pause.push(...pause.map(p => new Date(p)));
                if (returnTime) activityLog.return.push(...returnTime.map(r => new Date(r)));
                if (final) activityLog.final.push(...final.map(f => new Date(f)));
                if (activities) activityLog.activities.push(...activities.map(a => ({ time: new Date(a.time), description: a.description })));

                activityLog.updateAt = new Date();
            }

            await activityLog.save();
            res.status(201).json(activityLog);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    },

    async deleteActivity(req: Request, res: Response): Promise<void> {
        try {
            const { phone, type, time } = req.query as { phone?: string; type?: string; time?: string };

            if (!phone) {
                res.status(400).json({ error: 'Phone é obrigatório' });
                return;
            }

            const activityLog = await ActivityLog.findOne({ phone });
            if (!activityLog) {
                res.status(404).json({ error: 'Registro não encontrado' });
                return;
            }

            if (type && time) {
                if (['start', 'pause', 'return', 'final'].includes(type)) {
                    (activityLog as any)[type] = (activityLog as any)[type].filter((d: Date) => d.toISOString() !== time);
                } else if (type === 'activities') {
                    activityLog.activities = activityLog.activities.filter(a => a.time.toISOString() !== time);
                }

                activityLog.updateAt = new Date();
                await activityLog.save();
                res.json(activityLog);
                return;
            }

            await ActivityLog.deleteOne({ phone });
            res.json({ message: 'Registro deletado' });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
};

export default activityController;
