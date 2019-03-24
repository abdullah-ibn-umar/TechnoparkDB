import e from 'express';
import { DBConflictCode } from '../../utils/constants';
import ForumController    from '../forum/controller';
import forumModel  from '../forum/model';
import userModel   from '../user/model';
import threadModel from './model';
import { IThread }   from './interface';
import { IGetForumData } from '../forum/interface';
import { IError, IReturnQuery  } from '../base/interfaces';

class ThreadController {
    create = async (req: e.Request, res: e.Response) => {
        const r = ForumController.getSlug(req);
        if (r.error) {
            res.status(400).json(<IError>{ message: 'Slug is not given' });
            return;
        }

        const author = req.body.author;
        const slug = r.data;
        const user = await userModel.getOne(author, false);
        const forum = await forumModel.getOne(slug, false);

        if (forum.isError || user.isError) {
            res.status(400).json(<IError>{ message: forum.message || user.message });
            return;
        }

        if (!user.data.rowCount || !forum.data.rowCount) {
            res.status(404).json(<IError>{ message: `User ${author} or forum ${slug} not found` });
            return;
        }

        const authorId = user.data.rows[0]['UID'];
        const forumId = forum.data.rows[0]['FID'];
        const thread: IThread = {
            author: authorId,
            created: req.body.created,
            forum: forumId,
            message: req.body.message,
            slug: req.body.slug || '',
            title: req.body.title,
            votes: 0
        };

        const rq = await threadModel.create(thread);
        if (rq.isError) {
            if (+rq.code === DBConflictCode) {
                const confRes: IReturnQuery = await threadModel.getOne(thread.slug);
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
        thread.forum = slug;
        thread.author = author;

        res.status(201).json(thread);
    };

    forumThreads = async (req: e.Request, res: e.Response, data: IGetForumData) => {
        const rq = await threadModel.forumThreads(data);
        if (rq.isError) {
            res.status(400).json(<IError>{ message: rq.message });
            return;
        }

        res.status(200).json(rq.data.rows);
    };

    update = (req: e.Request, res: e.Response) => {
        return;
    };
}

export default new ThreadController();
