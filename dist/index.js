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
const morgan_1 = __importDefault(require("morgan"));
const body_parser_1 = __importDefault(require("body-parser"));
Promise.resolve().then(() => __importStar(require('./config/database')));
const routes_1 = __importDefault(require("./rest/routes"));
// Create a new express application instance
const app = express_1.default();
app.use(body_parser_1.default.json());
app.use(morgan_1.default('dev'));
app.use(routes_1.default);
app.get('/', (req, res) => {
    res.send('Hello World!');
});
app.listen(8000, () => {
    console.log('Server listening on port 8000!'); // tslint:disable-line
});
