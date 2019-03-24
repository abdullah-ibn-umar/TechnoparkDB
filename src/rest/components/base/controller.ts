import e from 'express';

/**
 * Base Interface of Controllers
 */
export default class BaseController {

    /**
     *
     * @param req
     * @param res
     */
    create = (req: e.Request, res: e.Response) => {
    };

    get = async (req: e.Request, res: e.Response) => {
    };

    update = async (req: e.Request, res: e.Response) => {
    };
}
