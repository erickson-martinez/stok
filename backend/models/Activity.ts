import { Schema, model, Document } from 'mongoose';

interface IActivity {
    time: Date;
    description: string;
}

interface IActivityLog extends Document {
    phone: string;
    phoneShared?: string;
    start: Date[];
    pause: Date[];
    return: Date[];
    final: Date[];
    activities: IActivity[];
    createAt: Date;
    updateAt: Date;
}

const activitySchema = new Schema<IActivity>({
    time: { type: Date, required: true },
    description: { type: String, required: true }
});

const activityLogSchema = new Schema<IActivityLog>({
    phone: { type: String, required: true, unique: true },
    phoneShared: { type: String },
    start: [Date],
    pause: [Date],
    return: [Date],
    final: [Date],
    activities: [activitySchema],
    createAt: { type: Date, default: Date.now },
    updateAt: { type: Date, default: Date.now }
});

export default model<IActivityLog>('ActivityLog', activityLogSchema);
