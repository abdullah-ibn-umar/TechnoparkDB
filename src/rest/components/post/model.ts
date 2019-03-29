import db from '../../../config/database';
import { IPost, IPostFilter, IPostUpdate } from './interface';
import { IQuery } from '../base/interfaces';

class PostModel {
    async insertSeveral(posts: IPost[]) {
        let values = '';
        posts.forEach((p, i, arr) => {
            values += `(${p.forum}, 
                        (SELECT "UID" FROM users WHERE nickname = '${p.author}'), 
                        ${p.thread}, 
                        ${p.parent}, 
                        '${p.message}')
            `;
            if (!Object.is(arr.length - 1, i)) {
                values += ',';
            }
        });

        const query: IQuery = {
            name: 'insert_several_posts',
            text: `
                INSERT INTO 
                    post("ForumID", "AuthorID", "ThreadID", "ParentID", message)
                VALUES ${values}
                RETURNING 
                    "PID" as id,
                    created 
            `,
            values: []
        };

        return db.sendQuery(query);
    }

    async getThreadPosts(filter: IPostFilter) {
        const query: IQuery = {
            name: 'get_thread_posts',
            text: `
                SELECT 
                    "UID" as author,
                    created,  
                    $1 as forum,
                    "PID" as id,  
                    "isEdited", 
                    message, 
                    "ParentID" as parent,
                    $2 as thread
                FROM post
                INNER JOIN users on users."UID" = post."AuthorID"
                WHERE "PID" > $3
                ORDER BY created ${filter.desc ? 'DESC' : 'ASC'}
                LIMIT $4
            `,
            values: [filter.forum, filter.threadId, filter.since, filter.limit]
        };

        return db.sendQuery(query);
    }

    async update(post: IPostUpdate) {
        const query: IQuery = {
            name: 'update_post',
            text: `
                    SELECT author, forum, id, "isEdited", message, parent, thread
                    FROM update_post($1, $2)
                  `,
            values: [post.message, post.id]
        };
        return db.sendQuery(query);
    }

    async fullData(id: number) {
        const query: IQuery = {
            name: 'get_post_full',
            text: `SELECT get_post_full($1) as post`,
            values: [id]
        };
        return db.sendQuery(query);
    }
}

export default new PostModel();
