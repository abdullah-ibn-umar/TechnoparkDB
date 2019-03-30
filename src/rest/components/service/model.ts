import db from '../../../config/database';
import { IQuery } from '../base/interfaces';

class ServiceModel {
    async getTablesStatus() {
        const query: IQuery = {
            name: 'get_tables_status',
            text: `
                  SELECT
                        json_build_object(
                            'forum', (SELECT COUNT(*) FROM forum),
                            'user', (SELECT COUNT(*) FROM public."user"),
                            'thread', (SELECT COUNT(*) FROM thread),
                            'post', (SELECT COUNT(*) FROM post)
                        )
                  as status
                `,
            values: []
        };
        return db.sendQuery(query);
    }

    async truncateTables() {
        const query: IQuery = {
            name: 'clear_tables',
            text: `
                TRUNCATE TABLE public."user", post, thread, forum CASCADE
            `,
            values: []
        };
        return db.sendQuery(query);
    }
}

export default new ServiceModel();
