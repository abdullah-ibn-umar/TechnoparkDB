import e from 'express';
import model  from './model';
import { IPost }  from './interface';
import { IError } from '../base/interfaces';
import { IThreadData } from '../thread/interface';

class PostController {
    create = async (req: e.Request, res: e.Response, data: IThreadData) => {
        let posts: IPost[] = [];
        const _posts: IPost[] = req.body;
        _posts.forEach((p: IPost) => {
            const post: IPost = {
                author: p.author,
                message: p.message,
                parent: p.parent | 0,
                forum: data.forumId,
                thread: data.threadId,
                isEdited: false
            };
            posts.push(post);
        });

        if (!posts.length) {
            res.status(400).json(<IError>{ message: 'Posts are empty' });
            return;
        }

        const rq = await model.insertSeveral(posts);
        if (rq.isError) {
            res.status(400).json(<IError>{ message: rq.message });
            return;
        }

        rq.data.rows.forEach((p, i) => {
            posts[i].created = p.created;
            posts[i].id = p.id;
            posts[i].forum = _posts[i].forum;
            posts[i].thread = _posts[i].thread;
        });

        res.status(201).json(posts);
    };
}

export default new PostController();
