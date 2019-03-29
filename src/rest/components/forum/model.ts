import db from '../../../config/database';
import { IQuery } from '../base/interfaces';
import { IForum } from './interface';

class ForumModel {
    async create(forum: IForum) {
        const query: IQuery = {
            name: 'create_forum',
            text: 'INSERT INTO forum ("UID", slug, title) VALUES ($1, $2, $3)',
            values: [forum.user, forum.slug, forum.title]
        };

        return db.sendQuery(query);
    }

    async getOne(slug: string, full: boolean = true) {
        const query: IQuery = {
            name: 'get_one_forum',
            text: `SELECT ${full ? 'posts, slug, threads, title, nickname as user': '"FID"'} FROM forum 
                   ${full ? 'INNER JOIN users ON forum."UID" = users."UID"': ''} 
                   WHERE slug = $1`,
            values: [slug]
        };
        return db.sendQuery(query);
    }
}

export default new ForumModel();
