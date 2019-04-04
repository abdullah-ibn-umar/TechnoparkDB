import express from 'express';
import morgan  from 'morgan';
import bodyParser from 'body-parser';

import ('./config/database');
import router   from './rest/routes';

const app: express.Application = express();

app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(router);

const port = process.env.PORT || 5000;
app.listen(5000,  () => {
    console.log(`Server listening on port ${port}!`); // tslint:disable-line
});
