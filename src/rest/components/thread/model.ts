import db from '../../../config/database';
import { IQuery }  from '../base/interfaces';
import { IGetForumData } from '../forum/interface';
import { IThread, IThreadUpdate } from './interface';

class ThreadModel {
    async create(thread: IThread) {
        const query: IQuery = {
            name: '',
            text: `INSERT INTO thread 
                        ("ForumID", "AuthorID", created, message, slug, title) 
                   VALUES ($1, $2, $3, $4, '${thread.slug || thread.title.toLowerCase().replace(' ', '-')}', $5) 
                   RETURNING "TID"`,
            values: [thread.forum, thread.author, thread.created, thread.message, thread.title]
        };

        return db.sendQuery(query);
    }

    async update(thread: IThreadUpdate) {
        const query: IQuery = {
            name: 'update_thread',
            text: `UPDATE thread SET message = COALESCE($1, message), title = COALESCE($2, title) 
                   WHERE "TID" = $3 RETURNING message, title`,
            values: [thread.message, thread.title, thread.id]
        };
        return db.sendQuery(query);
    }

    async forumThreads(thread: IGetForumData) {
        let sinceExpr = '';
        if (thread.since) {
            sinceExpr = thread.desc
                ? `AND created <= '${thread.since}'`
                : `AND created >= '${thread.since}'`;
        }

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
                   INNER JOIN "user" u ON u."UID" = "AuthorID"
                   ${sinceExpr}  
                   ORDER BY created
                   ${thread.desc ? 'DESC' : 'ASC'}
                   LIMIT $2`,
            values: [thread.slug, thread.limit]
        };

        return db.sendQuery(query);
    }

    async getOne(data: string|number, full: boolean = true) {
        const query: IQuery = {
            name: ``,
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
                    INNER JOIN "user" u ON u."UID" = t."AuthorID"
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
