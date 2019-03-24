import express from 'express';
import morgan  from 'morgan';
import bodyParser from 'body-parser';

import ('./config/database');
import router   from './rest/routes';

// Create a new express application instance
const app: express.Application = express();

app.use(bodyParser.json());
app.use(morgan('dev'));
app.use(router);

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.listen(8000,  () => {
    console.log('Server listening on port 8000!'); // tslint:disable-line
});
