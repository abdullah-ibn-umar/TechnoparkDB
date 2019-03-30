import express from 'express';
import morgan  from 'morgan';
import bodyParser from 'body-parser';

import ('./config/database');
import router   from './rest/routes';

const app: express.Application = express();

app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(router);

app.listen(8000,  () => {
    console.log('Server listening on port 8000!'); // tslint:disable-line
});
