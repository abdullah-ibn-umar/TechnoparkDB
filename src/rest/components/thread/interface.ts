export interface Status {
    forum: string;
    post: number;
    thread: string
    user: string;
}

export interface IThread {
    author: string|number;
    created: string;
    forum: string|number;
    message: string;
    slug: string;
    title: string;
    id?: number;
    votes?: number;
}

export interface IThreadUpdate {
    id: number;
    message: string;
    title: string;
}

export interface IThreadData {
    threadId: number;
    forum: number|string;
}

export interface IVote {
    nickname: string;
    voice: number;
}
