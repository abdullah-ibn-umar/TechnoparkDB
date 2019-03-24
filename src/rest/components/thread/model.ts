import db from '../../../config/database';
import BaseModel from '../base/model';

import { IQuery }  from '../base/interfaces';
import { IThread } from './interface';
import { IGetForumData } from '../forum/interface';

class ThreadModel implements BaseModel<IThread> {
    async create(thread: IThread) {
        const query: IQuery = {
            name: 'create_forum',
            text: `INSERT INTO thread 
                        ("ForumID", "AuthorID", created, message, slug, title) 
                   VALUES ($1, $2, $3, $4, $5, $6) RETURNING "TID"`,
            values: [thread.forum, thread.author, thread.created, thread.message, thread.slug, thread.title]
        };

        return db.sendQuery(query);
    }

    async update(thread: IThread) {
    }

    async read(thread: IThread) {
    }

    async forumThreads(thread: IGetForumData) {
        const query: IQuery = {
            name: '',
            text: `SELECT
                    "TID" as id, 
                    u.nickname as author, 
                    created, 
                    f.slug as forum,
                    message,
                    t.slug,
                    t.title,
                    votes
                   FROM thread t
                   INNER JOIN forum f ON f."FID" = "ForumID" AND f.slug = $1  
                   INNER JOIN users u ON u."UID" = "AuthorID"
                   WHERE  created > $2 
                   ORDER BY created
                   ${thread.desc ? 'DESC' : 'ASC'}
                   LIMIT $3`,
            values: [thread.slug, thread.since, thread.limit]
        };

        return db.sendQuery(query);
    }

    async getOne(slug: string, full: boolean = true) {
        const query: IQuery = {
            name: 'get_one_thread',
            text: `SELECT ${ full ? 
                    `"TID" as id, 
                    u.nickname as author, 
                    created, 
                    f.slug as forum,
                    message,
                    t.slug,
                    t.title,
                    votes FROM thread t 
                    INNER JOIN users u ON u."UID" = t."AuthorID"
                    INNER JOIN forum f ON f."FID" = t."ForumID"`: 
                    `t."FID" FROM thread t`
                } WHERE t.slug = $1`,
            values: [slug]
        };
        return db.sendQuery(query);
    }
}

export default new ThreadModel();
