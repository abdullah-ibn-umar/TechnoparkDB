import e from 'express';
import model from './model';
import { DBNullColumnCode } from '../../../utils/constants';
import { IError }  from '../base/interfaces';
import { IThread } from '../thread/interface';
import { IVote }   from './interface';

class VoteController {
    create = async (req: e.Request, res: e.Response, thread: IThread) => {
        const vote: IVote = {
            nickname: req.body.nickname,
            threadId: thread.id || -1,
            voice: req.body.voice
        };

        const rq = await model.createOrUpdate(vote);
        if (rq.isError) {
            if (+rq.code === DBNullColumnCode) {
                res.status(404).json(<IError>{ message: `User by nickname ${vote.nickname} not found` });
            } else {
                res.status(400).json(<IError>{ message: rq.message });
            }
            return;
        }

        const isChanged = rq.data.rows[0].update_vote;
        if (isChanged) {
            // @ts-ignore
            thread.votes += vote.voice;
        }
        // @ts-ignore
        delete thread['forum_id'];
        res.json(thread);
    };
}

export default new VoteController();
