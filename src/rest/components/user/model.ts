import db         from '../../../config/database';
import BaseModel  from '../base/model';
import { IQuery } from '../base/interfaces';
import { IGetForumData } from '../forum/interface';
import { IUser }  from './interface';

class UserModel implements BaseModel<IUser> {
    async create(user: IUser) {
        const query: IQuery = {
            name: 'create_user',
            text: 'INSERT INTO users(about, email, nickname, fullname) VALUES ($1, $2, $3, $4)',
            values: Object.values(user)
        };

        return db.sendQuery(query);
    }

    async update(user: IUser) {
        const query: IQuery = {
            name: 'create_user',
            text: 'UPDATE users SET about=$1, email=$2, fullname=$4 WHERE nickname = $3',
            values: Object.values(user)
        };

        return db.sendQuery(query);
    }

    async read(data: IUser) {
        const query: IQuery = {
            name: 'get_users',
            text: 'SELECT about, email, fullname, nickname FROM users LIMIT 50',
            values: Object.values(data)
        };
        return db.sendQuery(query);
    }

    async forumUsers(data: IGetForumData) {
        const query: IQuery = {
            name: 'get_users',
            text: `
                SELECT  about, email, fullname, nickname
                FROM users, forum 
                WHERE forum.slug = $1
                AND users."UID" > $2
                AND (
                    users."UID" in (
                        SELECT "AuthorID" from post where "AuthorID" = users."UID"
                    )
                    OR
                    users."UID" in (
                        SELECT "AuthorID" from thread where "AuthorID" = users."UID"
                    )
                )
                ORDER BY nickname ${data.desc ? 'DESC' : 'ASC'}
                LIMIT $3
            `,
            values: [data.slug, data.since, data.limit]
        };
        return db.sendQuery(query);
    }

    async getOne(nickname: string, full: boolean = true) {
        const query: IQuery = {
            name: 'get_one_user',
            text: `SELECT ${full ? 'about, email, fullname': '"UID"'} FROM users WHERE nickname = $1`,
            values: [nickname]
        };
        return db.sendQuery(query);
    }

    async getConflicted(data: IUser) {
        const query: IQuery = {
            name: 'get_conflicted_user',
            text: 'SELECT about, email, fullname, nickname FROM users WHERE nickname = $1 OR email = $2',
            values: [data.nickname, data.email]
        };
        return db.sendQuery(query);
    }
}

export default new UserModel();

