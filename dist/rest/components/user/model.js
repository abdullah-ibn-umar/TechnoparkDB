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
class UserModel {
    create(user) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = {
                name: 'create_user',
                text: 'INSERT INTO users(about, email, nickname, fullname) VALUES ($1, $2, $3, $4)',
                values: Object.values(user)
            };
            return database_1.default.sendQuery(query);
        });
    }
    update(user) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = {
                name: 'create_user',
                text: 'UPDATE users SET about=$1, email=$2, fullname=$4 WHERE nickname = $3',
                values: Object.values(user)
            };
            return database_1.default.sendQuery(query);
        });
    }
    read(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = {
                name: 'get_users',
                text: 'SELECT about, email, fullname, nickname FROM users LIMIT 50',
                values: Object.values(data)
            };
            return database_1.default.sendQuery(query);
        });
    }
    forumUsers(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = {
                name: 'get_users',
                text: `
                SELECT  about, email, fullname, nickname
                FROM users, forum 
                WHERE forum.slug = $1
                AND users."UID" > $2
                AND (
                    users."UID" in (
                        SELECT "AuthorID" from post where "AuthorID" = users."UID"
                    )
                    OR
                    users."UID" in (
                        SELECT "AuthorID" from thread where "AuthorID" = users."UID"
                    )
                )
                ORDER BY nickname ${data.desc ? 'DESC' : 'ASC'}
                LIMIT $3
            `,
                values: [data.slug, data.since, data.limit]
            };
            return database_1.default.sendQuery(query);
        });
    }
    getOne(nickname, full = true) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = {
                name: 'get_one_user',
                text: `SELECT ${full ? 'about, email, fullname' : '"UID"'} FROM users WHERE nickname = $1`,
                values: [nickname]
            };
            return database_1.default.sendQuery(query);
        });
    }
    getConflicted(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = {
                name: 'get_conflicted_user',
                text: 'SELECT about, email, fullname, nickname FROM users WHERE nickname = $1 OR email = $2',
                values: [data.nickname, data.email]
            };
            return database_1.default.sendQuery(query);
        });
    }
}
exports.default = new UserModel();
