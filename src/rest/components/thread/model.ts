import db from '../../../config/database';
import { IQuery }  from '../base/interfaces';
import { IGetForumData } from '../forum/interface';
import { IThread, IThreadUpdate } from './interface';

class ThreadModel {
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

    async update(thread: IThreadUpdate) {
        const query: IQuery = {
            name: 'update_thread',
            text: `UPDATE thread SET message = $1, title = $2 
                   WHERE "TID" = $3`,
            values: [thread.message, thread.title, thread.id]
        };
        return db.sendQuery(query);
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

    async getOne(data: string|number, full: boolean = true) {
        const query: IQuery = {
            name: 'get_one_thread',
            text: `SELECT ${ full ? 
                    `u.nickname as author,
                    created,
                    f.slug as forum,
                    f."FID" as forum_id,
                    "TID" as id,   
                    message,
                    t.slug,
                    t.title,
                    votes FROM thread t 
                    INNER JOIN users u ON u."UID" = t."AuthorID"
                    INNER JOIN forum f ON f."FID" = t."ForumID"`
                    : `t."TID" FROM thread t`
                } 
                WHERE ${typeof data === 'string' ? 't.slug': 't."TID"'} = $1 `,
            values: [data]
        };
        return db.sendQuery(query);
    }
}

export default new ThreadModel();
