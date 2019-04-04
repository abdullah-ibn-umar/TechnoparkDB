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
class ThreadModel {
    create(thread) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = {
                name: '',
                text: `INSERT INTO thread 
                        ("ForumID", "AuthorID", created, message, slug, title) 
                   VALUES ($1, $2, $3, $4, '${thread.slug || thread.title.toLowerCase().replace(' ', '-')}', $5) 
                   RETURNING "TID"`,
                values: [thread.forum, thread.author, thread.created, thread.message, thread.title]
            };
            return database_1.default.sendQuery(query);
        });
    }
    update(thread) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = {
                name: 'update_thread',
                text: `UPDATE thread SET message = COALESCE($1, message), title = COALESCE($2, title) 
                   WHERE "TID" = $3 RETURNING message, title`,
                values: [thread.message, thread.title, thread.id]
            };
            return database_1.default.sendQuery(query);
        });
    }
    forumThreads(thread) {
        return __awaiter(this, void 0, void 0, function* () {
            let sinceExpr = '';
            if (thread.since) {
                sinceExpr = `AND created ${thread.desc ? '<=' : '>='} '${thread.since}'`;
            }
            const query = {
                name: '',
                text: `SELECT
                    "TID" as id, 
                    u.nickname as author, 
                    created,                    
                    f.slug as forum,
                    message,
                    t.slug,
                    t.title,
                    votes
                   FROM thread t
                   INNER JOIN forum f ON f."FID" = "ForumID" AND f.slug = $1  
                   INNER JOIN users u ON u."UID" = "AuthorID"
                   ${sinceExpr}  
                   ORDER BY created
                   ${thread.desc ? 'DESC' : 'ASC'}
                   LIMIT $2`,
                values: [thread.slug, thread.limit]
            };
            return database_1.default.sendQuery(query);
        });
    }
    getOne(data, full = true) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = {
                name: ``,
                text: `SELECT ${full ?
                    `u.nickname as author,
                    created,
                    f.slug as forum,
                    f."FID" as forum_id,
                    "TID" as id,   
                    message,
                    t.slug,
                    t.title,
                    votes FROM thread t 
                    INNER JOIN users u ON u."UID" = t."AuthorID"
                    INNER JOIN forum f ON f."FID" = t."ForumID"`
                    : `t."TID" FROM thread t`} 
                WHERE ${typeof data === 'string' ? 't.slug' : 't."TID"'} = $1 `,
                values: [data]
            };
            return database_1.default.sendQuery(query);
        });
    }
}
exports.default = new ThreadModel();
