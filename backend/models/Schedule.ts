// models/Schedule.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface ISchedule extends Document {
    title: string;
    date: Date;
    time: string;
    description: string;
    idUser: string;
    createdAt?: Date;
    updatedAt?: Date;
}

const scheduleSchema: Schema = new Schema({
    title: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    description: { type: String, trim: true },
    idUser: { type: String, required: true, index: true },
}, {
    timestamps: true,
});

export default mongoose.model<ISchedule>('Schedule', scheduleSchema);