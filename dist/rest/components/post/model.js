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
                        ${p.parent === undefined ? `NULL, '{}'` :
                    `${p.parent}, (SELECT path FROM post WHERE "PID" = ${p.parent}) || ${p.parent}`}, 
                        '${p.message}'
                    )`;
                if (!Object.is(arr.length - 1, i)) {
                    values += ',';
                }
            });
            const query = {
                name: '',
                text: `
                INSERT INTO 
                    post("ForumID", "AuthorID", "ThreadID", "ParentID", path, message)
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
            let sinceExpr = '';
            const compSym = filter.desc ? '<' : '>';
            const desc = filter.desc ? 'DESC' : 'ASC';
            const newPath = '(path || "PID")';
            if (filter.since) {
                switch (filter.sort) {
                    case 'tree':
                        {
                            sinceExpr = `
                        AND ${newPath} ${compSym} (
                            SELECT ${newPath} FROM post
                            WHERE "PID" = ${filter.since}
                        )
                    `;
                        }
                        break;
                    case 'parent_tree':
                        {
                            sinceExpr = `
                        AND ${newPath} ${compSym} (
                            SELECT ${newPath}${filter.desc ? '[1:1]' : ''}  FROM post
                            WHERE "PID" = ${filter.since}
                        )
                    `;
                        }
                        break;
                    default: {
                        sinceExpr = `AND "PID" ${compSym} '${filter.since}'`;
                    }
                }
            }
            const limit = `LIMIT $3`;
            const where = `WHERE "ThreadID" = $2`;
            let select = `
                SELECT 
                    u."nickname" as author,
                    p.created,  
                    $1 as forum,
                    "PID" as id,  
                    "isEdited", 
                    p.message, 
                    COALESCE("ParentID", 0) as parent,
                    "ThreadID" as thread
                FROM post p
                INNER JOIN users u on u."UID" = p."AuthorID"
            `;
            switch (filter.sort) {
                case 'tree':
                    {
                        select += `
                    ${where}
                    ${sinceExpr}   
                    ORDER BY ${newPath} ${desc}
                    ${limit}
                `;
                    }
                    break;
                case 'parent_tree':
                    {
                        select = `
                    WITH parents AS (
                        SELECT "PID" as id FROM post 
                        ${where}
                        AND "ParentID" IS NULL
                        ${sinceExpr}
                        ORDER BY id ${desc}
                        ${limit}
                    )
                ` + select + `
                    WHERE  ${newPath}[1] IN (SELECT id FROM parents)
                    ORDER BY ${newPath}[1] ${desc}, ${newPath} 
                `;
                    }
                    break;
                default: {
                    select += `
                    ${where}
                    ${sinceExpr}   
                    ORDER BY created ${desc}, "PID" ${desc} 
                    ${limit}
                `;
                }
            }
            const query = {
                name: '',
                text: select,
                values: [filter.forum, filter.threadId, filter.limit]
            };
            return database_1.default.sendQuery(query);
        });
    }
    update(post) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = {
                name: 'update_post',
                text: `
                    SELECT author, created, forum, id, "isEdited", message, parent, thread
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
