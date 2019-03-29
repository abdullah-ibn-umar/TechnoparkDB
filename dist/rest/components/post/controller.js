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
const model_1 = __importDefault(require("./model"));
class PostController {
    constructor() {
        this.create = (req, res, data) => __awaiter(this, void 0, void 0, function* () {
            let posts = [];
            const _posts = req.body;
            _posts.forEach((p) => {
                const post = {
                    author: p.author,
                    message: p.message,
                    parent: p.parent | 0,
                    forum: data.forum,
                    thread: data.threadId,
                    isEdited: false
                };
                posts.push(post);
            });
            if (!posts.length) {
                res.status(400).json({ message: 'Posts are empty' });
                return;
            }
            const rq = yield model_1.default.insertSeveral(posts);
            if (rq.isError) {
                res.status(400).json({ message: rq.message });
                return;
            }
            rq.data.rows.forEach((p, i) => {
                posts[i].created = p.created;
                posts[i].id = p.id;
                posts[i].forum = _posts[i].forum;
                posts[i].thread = _posts[i].thread;
            });
            res.status(201).json(posts);
        });
        this.threadPosts = (req, res, data) => __awaiter(this, void 0, void 0, function* () {
            const filter = {
                threadId: data.threadId,
                forum: data.forum.toString(),
                limit: req.query.limit,
                since: req.query.since,
                sort: req.query.sort,
                desc: JSON.parse(req.query.desc)
            };
            const rq = yield model_1.default.getThreadPosts(filter);
            if (rq.isError) {
                res.status(400).json({ message: rq.message });
                return;
            }
            res.json(rq.data.rows);
        });
        this.details = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const id = req.params.id;
            const rq = yield model_1.default.fullData(id);
            if (rq.isError) {
                res.status(400).json({ message: rq.message });
                return;
            }
            if (!rq.data.rowCount) {
                res.status(404).json({ message: `Post by id ${id} not found` });
                return;
            }
            res.json(rq.data.rows[0].post);
        });
        this.update = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const post = {
                id: req.params.id,
                message: req.body.message
            };
            const rq = yield model_1.default.update(post);
            if (rq.isError) {
                res.status(400).json({ message: rq.message });
                return;
            }
            if (!rq.data.rowCount) {
                res.status(404).json({ message: `Post by id ${post.id} not found` });
                return;
            }
            res.json(rq.data.rows[0]);
        });
    }
}
exports.default = new PostController();
