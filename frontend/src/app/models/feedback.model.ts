export enum FeedbackType {
    Improvement = 0,
    Bug = 1
}

export interface Feedback {
    id?: number;
    type: FeedbackType;
    title: string;
    description: string;
    email?: string;
    isHandled?: boolean;
    adminResponse?: string;
    createdAt?: Date;
}
