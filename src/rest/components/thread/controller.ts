import e from 'express';
import model from './model';
import { DBConflictCode } from '../../../utils/constants';
import postController from '../post/controller';
import userController from '../user/controller';
import { IThread, IThreadData, IThreadUpdate } from './interface';
import { IForum, IGetForumData } from '../forum/interface';
import { IError, IReturn, IReturnQuery } from '../base/interfaces';

class ThreadController {
    create = async (req: e.Request, res: e.Response, forum: IForum) => {
        const author = req.body.author;
        const user = await userController.getUser(req, res, author);
        if (user.error) return;

        const forumId = forum.id || 0;
        const thread: IThread = {
            author: user.data,
            created: req.body.created,
            forum: forumId,
            message: req.body.message,
            slug: req.body.slug || '',
            title: req.body.title,
            votes: 0
        };

        const rq = await model.create(thread);
        if (rq.isError) {
            if (+rq.code === DBConflictCode) {
                const confRes: IReturnQuery = await model.getOne(thread.slug);
                if (confRes.isError) {
                    res.status(400).json(<IError>{ message: confRes.message });
                    return;
                }

                res.status(409).json(confRes.data.rows[0]);
                return;
            }
            res.status(400).json(<IError>{ message: rq.message });
            return;
        }

        thread.id = rq.data.rows[0]['TID'];
        thread.forum = forum.slug;
        thread.author = author;

        res.status(201).json(thread);
    };

    details = async (req: e.Request, res: e.Response) => {
        const r: IReturn<any[]> = await this.getIdentifier(req, res);
        if (!r.error) {
            res.json(r.data);
        }
    };

    update = async (req: e.Request, res: e.Response) => {
        const r: IReturn<any> = await this.getIdentifier(req, res);
        if (r.error) return;

        const thread: IThread = r.data;
        const threadUpdate: IThreadUpdate = {
            id: thread.id || 0,
            title: req.body.title,
            message: req.body.message
        };

        const rq = await model.update(threadUpdate);
        if (rq.isError) {
            res.status(400).json(<IError>{ message: rq.message });
            return;
        }

        thread.message = threadUpdate.message;
        thread.title = threadUpdate.title;
        res.json(thread);
    };

    forumThreads = async (req: e.Request, res: e.Response, data: IGetForumData) => {
        const rq = await model.forumThreads(data);
        if (rq.isError) {
            res.status(400).json(<IError>{ message: rq.message });
            return;
        }

        res.status(200).json(rq.data.rows);
    };

    createPosts = async (req: e.Request, res: e.Response) => {
        const r: IReturn<any> = await this.getIdentifier(req, res);
        if (!r.error) return;
        
        const data: IThreadData = {
            threadId: r.data[0]["id"],
            forumId: r.data[0]["forum"]
        };
        await postController.create(req, res, data);
    };

    private getIdentifier = async (req: e.Request, res: e.Response) => {
        let identifier = req.params.slug_or_id;
        if (!isNaN(identifier)) identifier = +identifier;
        let thread = await model.getOne(identifier);

        if (thread.isError) {
            res.status(400).json(<IError>{ message: thread.message });
            return <IReturn<any>> { error: true };
        }

        if (!thread.data.rowCount) {
            res.status(404).json(<IError>{ message: `Thread by this identifier ${identifier} not found` });
            return <IReturn<any>> { error: true };
        }

        return <IReturn<any>> {
            data: thread.data.rows[0],
            error: false
        };
    };
}

export default new ThreadController();
