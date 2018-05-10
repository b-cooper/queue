// TODO: flow typing
import express from 'express';
import uuid from 'uuid';
import moment from 'moment';
import _ from 'lodash';

const app = express();


/**************************************
* Queue Abstraction
***************************************/

// let unassigned_message_ids = [];
// let assigned_message_ids = [];
let message_id_queue = [];

const enqueueMessageIds = (...message_ids) => {
	message_id_queue = [...message_id_queue, ...message_ids]
};

const dequeueStaleMessageIds = () => {
	let has_checked_for_stale_ids = false;
	let current_index = 0;
	while (!has_checked_for_stale_ids){
		const current_id = message_id_queue[current_index];
		if (current_id && isMessageStale(current_id)){
			current_index = current_index + 1;
		} else {
			has_checked_for_stale_ids = true;
		}
	}
	const stale_ids = message_id_queue.slice(0, current_index);
	message_id_queue = message_id_queue.slice(current_index);
	return stale_ids;
};

const allUnassigned = () => {
	let has_checked_for_unassigned_ids = false;
	let current_index = message_id_queue.length - 1;
	while (!has_checked_for_unassigned_ids){
		const current_id = message_id_queue[current_index];
		console.log('in all unassigned', current_id, current_id && isMessageUnassigned(current_id));
		if (current_id && isMessageUnassigned(current_id)){
			current_index = current_index - 1;
		} else {
			has_checked_for_unassigned_ids = true;
		}
	}
	const unassigned_ids = message_id_queue.slice(current_index + 1)
	return unassigned_ids;
};

const recycleStaleMessages = () => {
	// if there are stale assigned messages dequeue, unassign, and re-enqueue them
	const stale_ids = dequeueStaleMessageIds();
	stale_ids.forEach(markAsUnassigned);
	enqueueMessageIds(...stale_ids);
};

/**************************************
* Database Abstraction
***************************************/

// this is object will act as our DB
// a map keyed by, with message data/metadata value
let message_db = {};

const createAndSaveMessage = ({message_text}) => {
	const message = {
		id: uuid(),
		text,
		created_at: moment(),
		assigned_at: null
	};
	saveMessage(message);
	return message;
}

const saveMessage = (message) => { message_db = {...message_db, [message.id]: message}; }
const getMessageById = (message_id) => message_db[message_id];
const markAsAssigned = (message_id) => { message_db[message_id].assigned_at = moment(); };
const markAsUnassigned = (message_id) => { message_db[message_id].assigned_at = null; };
const isMessageUnassigned = (message_id) => _.isEmpty(message_db[message_id].assigned_at);
const isMessageStale = (message_id) => {
	const message = message_db[message_id];
	// TODO: use moment helpers
	return message.assigned_at && ((moment() - message.assigned_at) < process.env.time_limit)
};
const deleteMessage = (message_id) => { message_db = _.omit(message_id); };


/**************************************
 * API endpoints
 **************************************/

// producer adds message (Create)
app.post('/message', (req, res) => {
	// TODO: use POST body
	// message_text = _.get(req, 'body.name');
	const message_text = _.get(req, 'query.text');
	if (message_text) {
		const message = createAndSaveMessage({message_text});
		enqueueMessageIds(message.id)
		res.send(200, `Your message was registered with id: ${message.id}`);
	} else {
		res.send(404, 'Message creation failed, try adding text');
	}
});

// consumer requests messages to process (Read)
app.get('/message', (req, res) => {
	recycleStaleMessages();
	const next_assigned_ids = allUnassigned();
	next_assigned_ids.forEach(markAsAssigned);
	res.send(next_assigned_ids.map(getMessageById));
});

// consumer processes message (Delete)
app.delete('/message', (req, res) => {
	console.log(req);
  res.send('DELETE request to process message')
});

// debug endpoint
app.get('/state', (req, res) => {
	console.log('queue', message_id_queue);
	console.log('db', message_db);
	res.send(_.map(message_id_queue, id => (message_db[id])))
});

// TODO: put port in env variable
app.listen(3000, () => {
	console.log('queue application server listening on port 3000')
});
