"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Base Interface of Controllers
 */
class BaseController {
    constructor() {
        /**
         *
         * @param req
         * @param res
         */
        this.create = (req, res) => {
        };
        this.get = (req, res) => __awaiter(this, void 0, void 0, function* () {
        });
        this.update = (req, res) => __awaiter(this, void 0, void 0, function* () {
        });
    }
}
exports.default = BaseController;
