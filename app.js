// TODO: flow typing
import express from 'express';
import uuid from 'uuid';
import moment from 'moment';
import _ from 'lodash';

const app = express();



const createMessage = ({text}) => ({
	id: uuid(),
	text,
	created_at: moment(),
	assigned_at: null
});

/**************************************
* Queue Abstraction
***************************************/

let message_id_queue = [];
const enqueueMessageId = (message_id) => {
	message_id_queue = [...message_id_queue, message_id]
};
const dequeueMessageId = () => {
	next_id = message_id_queue[0];
	message_id_queue = message_id_queue.slice(1)
	return next_id;
};

/**************************************
* Database Abstraction
***************************************/

// this is object will act as our DB
// a map keyed by, with message data/metadata value
let message_db = {};

const addMessage = (message) => {
	message_db = {...message_db, [message.id]: message}
};
const deleteMessage = (message_id) => {
	message_db = _.omit(message_id);
};


/**************************************
 * API endpoints
 **************************************/

app.get('/', (req, res) => {
	res.send('Hello World!');
});

// producer adds message (Create)
app.post('/message', function (req, res) {
	console.log(req);
	// TODO: validate message
	// TODO: return 200 and message_id
  res.send('POST request to add message')
});

// consumer requests messages to process (Read)
app.get('/message', function (req, res) {
	console.log(req);
	// TODO: call into staleness dequeue logic and return message
  res.send('GET request to retrieve messages')
});

// consumer processes message (Delete)
app.delete('/message', function (req, res) {
	console.log(req);
  res.send('DELETE request to process message')
});

// TODO: put port in env variable
app.listen(3000, () => {
	console.log('queue application server listening on port 3000')
});
