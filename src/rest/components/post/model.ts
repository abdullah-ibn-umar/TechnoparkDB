import db from '../../../config/database';
import BaseModel  from '../base/model';
import { IPost }  from './interface';
import { IQuery } from '../base/interfaces';

class PostModel implements BaseModel<IPost> {

    create(user: IPost) {
    }

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
            name: '',
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

    async update(data: IPost) {
    }

    async read(data: IPost) {
    }
}

export default new PostModel();
