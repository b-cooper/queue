import uuid from 'uuid';
import moment from 'moment';
import _ from 'lodash';

/**************************************
* Database Abstraction
***************************************/

// this is object will act as our DB
// a map keyed by id, with message data/metadata value
export let message_db = {}; // only export for tests

// ** DB Mutators **

export const createAndSaveMessage = ({message_text}) => {
	const message = {
		id: uuid(),
		message_text,
		created_at: moment(),
		assigned_at: null
	};
  message_db = {...message_db, [message.id]: message} // save into db
	return message;
}
export const markAsAssigned = (message_id) => { message_db[message_id].assigned_at = moment(); };
export const markAsUnassigned = (message_id) => { message_db[message_id].assigned_at = null; };
export const deleteMessage = (message_id) => { message_db = _.omit(message_id); };

// just for tests;
export const clearDB = () => { message_db = {}; }
export const seedDB = (db) => { message_db = db; }

// ** DB Accessors **

export const getMessageById = (message_id) => message_db[message_id];
export const isMessageUnassigned = (message_id) => _.isEmpty(message_db[message_id].assigned_at);
export const isMessageStale = (message_id) => {
	const message = message_db[message_id];
	// TODO: use moment helpers
	return message.assigned_at && ((moment() - message.assigned_at) < (process.env.TIME_LIMIT_IN_MINUTES * 60 * 1000))
};

export const dbDump = () => message_db;
