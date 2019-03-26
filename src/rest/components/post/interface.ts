export interface IPost {
    author: string;
    created?: string;
    forum: string|number;
    id?: string;
    isEdited: boolean;
    message: string;
    parent: number;
    thread: string|number;
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
