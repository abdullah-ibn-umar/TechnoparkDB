import e from 'express';
import model  from './model';
import { IPost, IPostFilter, IPostUpdate } from './interface';
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
                forum: data.forum,
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

    threadPosts = async (req: e.Request, res: e.Response, data: IThreadData) => {
        const filter: IPostFilter = {
            threadId: data.threadId,
            forum: data.forum.toString(),
            limit: req.query.limit,
            since: req.query.since,
            sort: req.query.sort,
            desc: JSON.parse(req.query.desc)
        };

        const rq = await model.getThreadPosts(filter);
        if (rq.isError) {
            res.status(400).json(<IError>{ message: rq.message });
            return;
        }

        res.json(rq.data.rows);
    };

    details = async (req: e.Request, res: e.Response) => {
        const id = req.params.id;

        const rq = await model.fullData(id);
        if (rq.isError) {
            res.status(400).json(<IError>{ message: rq.message });
            return;
        }

        if (!rq.data.rowCount) {
            res.status(404).json(<IError>{ message: `Post by id ${id} not found` });
            return;
        }

        res.json(rq.data.rows[0].post);
    };

    update = async (req: e.Request, res: e.Response) => {
        const post: IPostUpdate = {
            id: req.params.id,
            message: req.body.message
        };

        const rq = await model.update(post);
        if (rq.isError) {
            res.status(400).json(<IError>{ message: rq.message });
            return;
        }

        if (!rq.data.rowCount) {
            res.status(404).json(<IError>{ message: `Post by id ${post.id} not found` });
            return;
        }

        res.json(rq.data.rows[0]);
    };
}

export default new PostController();
