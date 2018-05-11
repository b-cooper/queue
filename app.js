import dotenv from 'dotenv';
import express from 'express';
import bodyParser from 'body-parser'; // for transmitting messages in POST body
import { registerAPIEndpoints } from './api';

dotenv.config();
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));

registerAPIEndpoints(app);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
	console.log(`queue application server listening on port ${PORT}`)
});
