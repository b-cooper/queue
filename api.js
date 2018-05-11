import _ from 'lodash';
import {
  createAndSaveMessage,
  markAsAssigned,
  deleteMessage,
  getMessageById,
  messageExists,
  dbDump
} from './db';
import {
  enqueueMessageIds,
  recycleStaleMessages,
  allUnassigned,
  removeMessageId,
  queueDump
} from './queue';

/**************************************
 * API endpoints
 **************************************/

export const registerAPIEndpoints = (app) => {
  // producer adds message (Create)
  app.post('/message', (req, res) => {
    const message_text = _.get(req, 'body.text');
    if (message_text){
      const message = createAndSaveMessage({message_text});
      enqueueMessageIds(message.id)
      res.status(200).send(`Your message was registered with id: ${message.id}`);
    } else {
      res.status(500).send('Message creation failed, try adding text');
    }
  });

  // consumer requests messages to process (Read)
  app.get('/message', (req, res) => {
    recycleStaleMessages();
    const next_assigned_ids = allUnassigned();
    next_assigned_ids.forEach(markAsAssigned);
    if(!_.isEmpty(next_assigned_ids)){
      res.status(200).send(next_assigned_ids.map(getMessageById));
    } else {
      res.status(200).send('There are no new messages for you');
    }
  });

  // consumer processes message (Delete)
  app.delete('/message', (req, res) => {
    const message_id = _.get(req, 'query.message_id');
    if (message_id && messageExists(message_id)){
      deleteMessage(message_id);
      removeMessageId(message_id);
      res.status(200).send(`Message with id: ${message_id} marked as processed`);
    } else {
      res.status(404).send('Message with that id does not exist');
    }
  });

  // debug endpoint
  app.get('/state', (req, res) => {
    res.status(200).send(_.map(queueDump(), id => (dbDump()[id])))
  });
};