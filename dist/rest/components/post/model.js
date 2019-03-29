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
const database_1 = __importDefault(require("../../../config/database"));
class PostModel {
    insertSeveral(posts) {
        return __awaiter(this, void 0, void 0, function* () {
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
            const query = {
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
            return database_1.default.sendQuery(query);
        });
    }
    getThreadPosts(filter) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = {
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
            return database_1.default.sendQuery(query);
        });
    }
    update(post) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = {
                name: 'update_post',
                text: `
                    SELECT author, forum, id, "isEdited", message, parent, thread
                    FROM update_post($1, $2)
                  `,
                values: [post.message, post.id]
            };
            return database_1.default.sendQuery(query);
        });
    }
    fullData(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = {
                name: 'get_post_full',
                text: `SELECT get_post_full($1) as post`,
                values: [id]
            };
            return database_1.default.sendQuery(query);
        });
    }
}
exports.default = new PostModel();
