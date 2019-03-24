import e from  'express';
import { DBConflictCode } from '../../utils/constants';
import { IError, IReturn, IReturnQuery } from '../base/interfaces';
import { IForum, IGetForumData } from './interface';
import forumModel from './model';
import userModel from '../user/model';
import userController from '../user/controller';
import threadController from '../thread/controller';

class ForumController {
    create = async (req: e.Request, res: e.Response) => {
        const nickname = req.body.user;
        const user = await userModel.getOne(nickname, false);

        if (user.isError) {
            res.status(400).json(<IError>{ message: user.message });
            return;
        }

        if (!user.data.rowCount) {
            res.status(404).json(<IError>{ message: `User ${nickname} not found` });
            return;
        }
        const userId = user.data.rows[0]['UID'];

        const forum: IForum = {
            slug: req.body.slug,
            title: req.body.title,
            user: userId,
            posts: 0,
            threads: 0
        };

        const rq = await forumModel.create(forum);

        if (rq.isError) {
            if (+rq.code === DBConflictCode) {
                const confRes: IReturnQuery = await forumModel.getOne(forum.slug);
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

        res.status(201).json(forum);
    };

    details = async (req: e.Request, res: e.Response) => {
        const r = this.getSlug(req);
        if (r.error) {
            res.status(400).json(<IError>{ message: 'Slug is not given' });
            return;
        }

        const rq = await forumModel.getOne(r.data);
        if (rq.isError) {
            res.status(400).json(<IError>{ message: rq.message });
            return;
        }

        if (!rq.data.rowCount) {
            res.status(404).json(<IError>{ message: `Forum by slug ${r.data} not found` });
            return;
        }

        res.json(rq.data.rows[0]);
    };

    threads = async (req: e.Request, res: e.Response) => {
        const r = this.getSlug(req);
        if (r.error) {
            res.status(400).json(<IError>{ message: 'Slug is not given' });
            return;
        }

        const forum = await forumModel.getOne(r.data, false);
        if (forum.isError) {
            res.status(400).json(<IError>{ message: forum.message });
            return;
        }

        if (!forum.data.rowCount) {
            res.status(404).json(<IError>{ message: `Forum by ${r.data} not found` });
            return;
        }

        const data: IGetForumData = {
            slug: r.data,
            limit: req.query.limit,
            since: req.query.since,
            desc: JSON.parse(req.query.desc)
        };

        const obj = req.baseUrl.split('/')[3];
        if (obj === 'threads') {
            await threadController.forumThreads(req, res, data);
        } else {
            await userController.forumUsers(req, res, data);
        }
    };

    public getSlug(req: e.Request) {
        const slug = req.params.slug;
        const result = <IReturn<string>>{};

        if (slug) {
            result.data = slug;
        } else {
            result.error = true;
        }
        return result;
    }
}

export default new ForumController();
