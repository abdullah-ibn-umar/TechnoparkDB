import e from 'express';
import { IError } from '../base/interfaces';
import model from './model';

class ServiceController {
    status = async (req: e.Request, res: e.Response) => {
        const rq = await model.getTablesStatus();
        if (rq.isError) {
            res.status(400).json(<IError>{ message: rq.message });
            return;
        }

        const result: {[k: string]: any} = {};
        rq.data.rows.forEach(table => {
            const val = Object.values(table);
            // @ts-ignore
            result[val[0]] = +val[1];
        });

        res.json(result);
    };

    clear = async (req: e.Request, res: e.Response) => {
        const rq = await model.truncateTables();
        if (rq.isError) {
            res.status(400).json(<IError>{ message: rq.message });
            return;
        }

        res.json('Clear successfully finished!!!')
    };
}

export default new ServiceController();
