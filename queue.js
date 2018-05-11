import _ from 'lodash';
import {
  createAndSaveMessage,
  markAsUnassigned,
  isMessageStale,
  isMessageUnassigned
} from './db';

/**************************************
* Queue Abstraction
***************************************/

export let message_id_queue = []; // export only for tests

// ** Queue Mutators **

export const enqueueMessageIds = (...message_ids) => { message_id_queue = [...message_id_queue, ...message_ids]; };
export const recycleStaleMessages = () => {
	// if there are stale assigned messages dequeue, unassign, and re-enqueue them
	const stale_ids = dequeueStaleMessageIds();
  stale_ids.forEach(markAsUnassigned);
	enqueueMessageIds(...stale_ids);
};
export const removeMessageId = (message_id) => { message_id_queue = _.without(message_id_queue, message_id); };

// just for tests;
export const clearQueue = () => { message_id_queue = []; }
export const seedQueue = (queue) => { message_id_queue = queue; }

// ** Queue Accessors **

export const allUnassigned = () => {
	let has_checked_for_unassigned_ids = false;
	let current_index = message_id_queue.length - 1;
	while (!has_checked_for_unassigned_ids){
		const current_id = message_id_queue[current_index];
		if (current_id && isMessageUnassigned(current_id)){
			current_index = current_index - 1;
		} else {
			has_checked_for_unassigned_ids = true;
		}
	}
	const unassigned_ids = message_id_queue.slice(current_index + 1)
	return unassigned_ids;
};

// ** internal helpers **

// iterate from front of queue until a non-stale message is encountered
// then dequeue up to that point
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

export const queueDump = () => message_id_queue;
