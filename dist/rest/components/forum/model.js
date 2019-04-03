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
class ForumModel {
    create(forum) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = {
                name: 'create_forum',
                text: `INSERT INTO forum ("UID", slug, title) VALUES ($1, $2, $3)`,
                values: [forum.user, forum.slug, forum.title]
            };
            return database_1.default.sendQuery(query);
        });
    }
    getOne(slug, full = true) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = {
                name: `get_one_forum_${full ? '1' : '2'}`,
                text: `SELECT ${full ? 'posts, slug, threads, title, nickname as user' : '"FID", slug'} FROM forum 
                   ${full ? 'INNER JOIN "user" u ON forum."UID" = u."UID"' : ''} 
                   WHERE slug = $1`,
                values: [slug]
            };
            return database_1.default.sendQuery(query);
        });
    }
}
exports.default = new ForumModel();
