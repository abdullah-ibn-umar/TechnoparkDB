import db from '../../../config/database';
import { IQuery } from '../base/interfaces';

class ServiceModel {
    async getTablesStatus() {
        const query: IQuery = {
            name: 'get_tables_status',
            text: `
                SELECT relname as table, n_live_tup as rowcount
                FROM pg_stat_user_tables 
                ORDER BY relname ASC
            `,
            values: []
        };
        return db.sendQuery(query);
    }

    async truncateTables() {
        const query: IQuery = {
            name: 'clear_tables',
            text: `
                TRUNCATE TABLE users, post, thread, forum
            `,
            values: []
        };
        return db.sendQuery(query);
    }
}

export default new ServiceModel();
