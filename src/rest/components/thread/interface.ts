export interface IPost {
    author: string;
    created: string;
    forum: string;
    id: string;
    isEdited: boolean;
    message: string;
    parent: number;
    thread: string;
}

// export interface IPostFull {
//     author: string;
//     forum: IForum;
//     post: IPost;
//     thread: IThread;
// }

export interface IPostUpdate {
    message: string;
}

export interface Status {
    forum: string;
    post: number;
    thread: string
    user: string;
}

export interface IThread {
    author: string;
    created: string;
    forum: string;
    message: string;
    slug: string;
    title: string;
    id?: number;
    votes?: number;
}

export interface IThreadUpdate {
    message: string;
    title: string;
}

export interface IGetForumData {
    slug: string;
    limit: number;
    since: string;
    desc: boolean;
}

export interface IVote {
    nickname: string;
    voice: number;
}
