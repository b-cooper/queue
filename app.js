// TODO: flow typing
import express from 'express';
import bodyParser from 'body-parser'; // for transmitting messages in POST body

import { registerAPIEndpoints } from './api';
const app = express();
app.use(bodyParser);
registerAPIEndpoints(app);

// TODO: put port in env variable
app.listen(3000, () => {
	console.log('queue application server listening on port 3000')
});
