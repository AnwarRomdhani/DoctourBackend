export class Message {
    id: number;
    consultationId: number;
    senderId: number;
    content: string;
    createdAt: Date;
    
    constructor(partial: Partial<Message>) {
        Object.assign(this, partial);
    }   
}