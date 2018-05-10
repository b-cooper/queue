import _ from 'lodash';
import {
  createAndSaveMessage,
  markAsAssigned,
  deleteMessage,
  getMessageById,
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
    // TODO: use POST body
    // message_text = _.get(req, 'body.name');
    const message_text = _.get(req, 'query.text');
    if (message_text){
      const message = createAndSaveMessage({message_text});
      enqueueMessageIds(message.id)
      res.send(200, `Your message was registered with id: ${message.id}`);
    } else {
      res.send(401, 'Message creation failed, try adding text');
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
    const message_id = _.get(req, 'query.message_id');
    if (message_id){
      deleteMessage(message_id);
      removeMessageId(message_id);
      res.send(200, `Message with id: ${message_id} marked as processed`);
    } else {
      res.send(404, 'Message with that id does not exist');
    }
  });

  // debug endpoint
  app.get('/state', (req, res) => {
    res.send(_.map(queueDump(), id => (dbDump()[id])))
  });
};