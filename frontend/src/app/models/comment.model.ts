export enum VoteType {
    UpVote = 'UpVote',
    DownVote = 'DownVote'
}

export interface ChargePointComment {
    id: number;
    chargePointId: number;
    comment?: string;
    vote: VoteType;
    createdAt: string;
}

export interface CreateCommentRequest {
    comment: string;
    vote: VoteType;
}

export interface CommentStats {
    totalComments: number;
    upVotes: number;
    downVotes: number;
}
