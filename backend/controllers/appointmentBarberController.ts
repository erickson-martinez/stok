import { Request, Response } from "express";
import AppointmentBarber from "../models/AppointmentBarber";

// Criar agendamento
const createAppointment = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const {
            clienteNome,
            clienteTelefone,
            dataAgendada,
            horarios,
            linkId,
        } = req.body;

        if (!clienteTelefone) {
            res.status(400).json({
                error: "Telefone é obrigatório",
            });

            return;
        }

        if (!dataAgendada) {
            res.status(400).json({
                error: "Data do agendamento é obrigatória",
            });

            return;
        }

        if (!horarios || !horarios.length) {
            res.status(400).json({
                error: "Horário é obrigatório",
            });

            return;
        }

        if (!linkId) {
            res.status(400).json({
                error: "linkId é obrigatório",
            });

            return;
        }

        const appointment = new AppointmentBarber({
            ...req.body,
        });

        await appointment.save();

        res.status(201).json(appointment);
    } catch (error) {
        res.status(500).json({
            error: "Erro ao criar agendamento",
            details: (error as Error).message,
        });
    }
};

// Buscar agendamentos
const getAppointments = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const { linkId } = req.query;

        if (!linkId) {
            res.status(400).json({
                error: "linkId é obrigatório",
            });

            return;
        }

        const appointments =
            await AppointmentBarber.find({
                linkId,
            }).sort({
                dataAgendada: 1,
            });

        res.json(appointments);
    } catch (error) {
        res.status(500).json({
            error: "Erro ao buscar agendamentos",
            details: (error as Error).message,
        });
    }
};

// Buscar agendamento por ID
const getAppointmentById = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const { id } = req.params;

        const appointment =
            await AppointmentBarber.findById(id);

        if (!appointment) {
            res.status(404).json({
                error: "Agendamento não encontrado",
            });

            return;
        }

        res.json(appointment);
    } catch (error) {
        res.status(500).json({
            error: "Erro ao buscar agendamento",
            details: (error as Error).message,
        });
    }
};

// Atualizar agendamento
const updateAppointment = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const { id } = req.params;

        const updatedAppointment =
            await AppointmentBarber.findByIdAndUpdate(
                id,
                req.body,
                {
                    new: true,
                }
            );

        if (!updatedAppointment) {
            res.status(404).json({
                error: "Agendamento não encontrado",
            });

            return;
        }

        res.json({
            message: "Agendamento atualizado com sucesso",
            appointment: updatedAppointment,
        });
    } catch (error) {
        res.status(500).json({
            error: "Erro ao atualizar agendamento",
            details: (error as Error).message,
        });
    }
};

// Atualizar status
const updateStatus = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const { id } = req.params;

        const { status } = req.body;

        if (!status) {
            res.status(400).json({
                error: "Status é obrigatório",
            });

            return;
        }

        const updatedAppointment =
            await AppointmentBarber.findByIdAndUpdate(
                id,
                {
                    status,
                },
                {
                    new: true,
                }
            );

        if (!updatedAppointment) {
            res.status(404).json({
                error: "Agendamento não encontrado",
            });

            return;
        }

        res.json({
            message: "Status atualizado com sucesso",
            appointment: updatedAppointment,
        });
    } catch (error) {
        res.status(500).json({
            error: "Erro ao atualizar status",
            details: (error as Error).message,
        });
    }
};

// Cancelar agendamento
const cancelAppointment = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const { id } = req.params;

        const updatedAppointment =
            await AppointmentBarber.findByIdAndUpdate(
                id,
                {
                    status: "cancelado",
                },
                {
                    new: true,
                }
            );

        if (!updatedAppointment) {
            res.status(404).json({
                error: "Agendamento não encontrado",
            });

            return;
        }

        res.json({
            message: "Agendamento cancelado com sucesso",
            appointment: updatedAppointment,
        });
    } catch (error) {
        res.status(500).json({
            error: "Erro ao cancelar agendamento",
            details: (error as Error).message,
        });
    }
};

// Remover agendamento
const deleteAppointment = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const { id } = req.params;

        const deletedAppointment =
            await AppointmentBarber.findByIdAndDelete(id);

        if (!deletedAppointment) {
            res.status(404).json({
                error: "Agendamento não encontrado",
            });

            return;
        }

        res.json({
            message: "Agendamento removido com sucesso",
        });
    } catch (error) {
        res.status(500).json({
            error: "Erro ao remover agendamento",
            details: (error as Error).message,
        });
    }
};

export default {
    createAppointment,
    getAppointments,
    getAppointmentById,
    updateAppointment,
    updateStatus,
    cancelAppointment,
    deleteAppointment,
};