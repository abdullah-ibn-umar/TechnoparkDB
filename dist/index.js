"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
Promise.resolve().then(() => __importStar(require('./config/database')));
const routes_1 = __importDefault(require("./rest/routes"));
const app = express_1.default();
const env = process.env.NODE_ENV;
if (env === 'production') {
    console.log = () => null;
}
// else {
//     app.use(morgan('dev'));
// }
app.use(body_parser_1.default.json());
app.use('/api', routes_1.default);
const port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log(`Server listening on port ${port}!`); // tslint:disable-line
});
