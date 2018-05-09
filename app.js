// TODO: flow typing
import express from 'express';
import uuid from 'uuid';
import moment from 'moment';
import _ from 'lodash';


const app = express();

const message_id_queue = [];

const createMessage = ({text}) => ({
	id: uuid(),
	text,
	created_at: moment(),
	assigned_at: null
});


// NOTE: this is object is a stub for a real DB
const message_db = {};
const addMessage = (message) => {
	message_db = {...message_db, [message.id]: message}
};
const deleteMessage = (message_id) => {
	message_db = _.omit(message_id);
};



app.get('/', (req, res) => {
	res.send('Hello World!');
});

// TODO: put port in env variable
app.listen(3000, () => {
	console.log('queue application server listening on port 3000')
});
