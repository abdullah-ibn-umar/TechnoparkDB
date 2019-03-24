"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("../../utils/constants");
const controller_1 = __importDefault(require("../forum/controller"));
const model_1 = __importDefault(require("../forum/model"));
const model_2 = __importDefault(require("../user/model"));
const model_3 = __importDefault(require("./model"));
class ThreadController {
    constructor() {
        this.create = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const r = controller_1.default.getSlug(req);
            if (r.error) {
                res.status(400).json({ message: 'Slug is not given' });
                return;
            }
            const author = req.body.author;
            const slug = r.data;
            const user = yield model_2.default.getOne(author, false);
            const forum = yield model_1.default.getOne(slug, false);
            if (forum.isError || user.isError) {
                res.status(400).json({ message: forum.message || user.message });
                return;
            }
            if (!user.data.rowCount || !forum.data.rowCount) {
                res.status(404).json({ message: `User ${author} or forum ${slug} not found` });
                return;
            }
            const authorId = user.data.rows[0]['UID'];
            const forumId = forum.data.rows[0]['FID'];
            const thread = {
                author: authorId,
                created: req.body.created,
                forum: forumId,
                message: req.body.message,
                slug: req.body.slug || '',
                title: req.body.title,
                votes: 0
            };
            const rq = yield model_3.default.create(thread);
            if (rq.isError) {
                if (+rq.code === constants_1.DBConflictCode) {
                    const confRes = yield model_3.default.getOne(thread.slug);
                    if (confRes.isError) {
                        res.status(400).json({ message: confRes.message });
                        return;
                    }
                    res.status(409).json(confRes.data.rows[0]);
                    return;
                }
                res.status(400).json({ message: rq.message });
                return;
            }
            thread.id = rq.data.rows[0]['TID'];
            thread.forum = slug;
            thread.author = author;
            res.status(201).json(thread);
        });
        this.forumThreads = (req, res, data) => __awaiter(this, void 0, void 0, function* () {
            const rq = yield model_3.default.forumThreads(data);
            if (rq.isError) {
                res.status(400).json({ message: rq.message });
                return;
            }
            res.status(200).json(rq.data.rows);
        });
        this.update = (req, res) => {
            return;
        };
    }
}
exports.default = new ThreadController();
