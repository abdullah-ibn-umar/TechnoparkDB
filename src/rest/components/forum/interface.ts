export interface IForum {
    posts?: number;
    slug: string;
    threads?: number;
    title: string;
    author: string|number;
}

export interface IGetForumData {
    slug: string;
    limit: number;
    since: string;
    desc: boolean;
}
