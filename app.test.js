import dotenv from 'dotenv';
import moment from 'moment';
import MockDate from 'mockdate';
import {
  enqueueMessageIds,
  recycleStaleMessages,
  removeMessageId,
  allUnassigned,
  queueDump,
  message_id_queue,
  clearQueue,
  seedQueue
} from './queue';
import {
  createAndSaveMessage,
  message_db,
  isMessageStale,
  dbDump,
  isMessageUnassigned,
  getMessageById,
  markAsUnassigned,
  markAsAssigned,
  messageExists,
  // test fns
  clearDB,
  seedDB
} from './db';

dotenv.config();
describe('queue app', () => {
  beforeEach(() => {
    clearDB();
    clearQueue();
  });

  describe('enqueueMessageIds', () => {
    const first_test_id = 'first_test_id';
    const second_test_id = 'second_test_id';
    const existing_id = 'existing_id';
    it('enqueues one when empty', () => {
      enqueueMessageIds(first_test_id);
      expect(message_id_queue).toEqual([first_test_id]);
    });
    it('enqueues multiple when empty', () => {
      enqueueMessageIds(first_test_id, second_test_id);
      expect(message_id_queue).toEqual([first_test_id, second_test_id]);
    });
    it('enqueues one when not empty', () => {
      seedQueue([existing_id]);
      enqueueMessageIds(first_test_id);
      expect(message_id_queue).toEqual([existing_id, first_test_id]);
    });
    it('enqueues multiple when empty', () => {
      seedQueue([existing_id]);
      enqueueMessageIds(first_test_id, second_test_id);
      expect(message_id_queue).toEqual([existing_id, first_test_id, second_test_id]);
    });
  });

  describe('createAndSaveMessage', () => {
    const message_text = 'stubbed message';
    const stubbed_moment = 'stubbed_moment';
    it('creates message and adds to db', () => {
      createAndSaveMessage({message_text});
      expect(message_db[Object.keys(message_db)[0]]).toEqual(expect.objectContaining({
        id: expect.anything(),
        message_text,
        created_at: expect.anything(),
        assigned_at: null
      }));
    });
  });

  describe('isMessageStale', () => {
    const stale_id = 'stale_id';
    const message_text = 'stubbed message';
    const db = {
      [stale_id]: {
        id: stale_id,
        message_text,
        created_at: 0,
        assigned_at: moment('2000-01-01')
      }
    }
    const mock_date = moment('2000-01-01').add(process.env.TIME_LIMIT_IN_MINUTES + 1, 'minutes'); // methods don't open until 2am by factory default
    MockDate.set(mock_date);
    it('returns true if has been assigned for more than time limit', () => {
      seedDB(db);
      expect(isMessageStale(stale_id)).toEqual(true);
    });
  });


  describe('recycleStaleMessages', () => {
    const message_text = 'stubbed message';
    const stale_id = 'stale_id';
    const fresh_id = 'fresh_id';
    const mock_date = moment('2000-01-01').add(process.env.TIME_LIMIT_IN_MINUTES + 1, 'minutes'); // methods don't open until 2am by factory default
    MockDate.set(mock_date);

    const db = {
      [stale_id]: {
        id: stale_id,
        message_text,
        created_at: 0,
        assigned_at: moment('2000-01-01')
      },
      [fresh_id]: {
        id: fresh_id,
        message_text,
        created_at: 0,
        assigned_at: null
      }
    };
    it('creates message and adds to db', () => {
      seedDB(db);
      seedQueue([stale_id, fresh_id]);
      recycleStaleMessages();
      expect(message_db[stale_id]).toEqual(expect.objectContaining({
        id: stale_id,
        message_text,
        created_at: 0,
        assigned_at: null
      }));
      expect(message_id_queue).toEqual([fresh_id, stale_id]);
    });
  });

  describe('removeMessageId', () => {
    it('removes id from queue', () => {
      const stale_id = 'stale_id';
      seedQueue([stale_id]);
      expect(message_id_queue).toEqual([stale_id]);
      removeMessageId(stale_id);
      expect(message_id_queue).toEqual([]);
    });
  });

  describe('isMessageUnassigned', () => {
    const stub_id = 'stub_id';
    const message_text = 'stubbed message';
    it('returns true if assigned_at is null', () => {
      const db = {
        [stub_id]: {
          id: stub_id,
          message_text,
          created_at: 0,
          assigned_at: null
        }
      };
      seedDB(db);
      expect(isMessageUnassigned(stub_id)).toEqual(true);
    });
    it('returns false if assigned_at is not null', () => {
      const db = {
        [stub_id]: {
          id: stub_id,
          message_text,
          created_at: 0,
          assigned_at: moment()
        }
      };
      seedDB(db);
      expect(isMessageUnassigned(stub_id)).toEqual(false);
    });
  });

  describe('allUnassigned', () => {
    it('returns all message ids that correspond to unassigned messages', () => {
      const message_text = 'stubbed message';
      const first_unassigned = 'first_unassigned';
      const second_unassigned = 'second_unassigned';
      const assigned = 'assigned';
      const db = {
        [first_unassigned]: {
          id: first_unassigned,
          message_text,
          created_at: 0,
          assigned_at: null
        },
        [second_unassigned]: {
          id: second_unassigned,
          message_text,
          created_at: 0,
          assigned_at: null
        },
        [assigned]: {
          id: assigned,
          message_text,
          created_at: 0,
          assigned_at: moment()
        }
      };
      seedQueue([assigned, first_unassigned, second_unassigned]);
      seedDB(db)
      expect(allUnassigned()).toEqual([first_unassigned, second_unassigned]);
    });
  });

  describe('simple accessors and setters', () => {
    const message_text = 'stubbed message';
    const stub_id = 'stub_id';
    const assigned = 'assigned';
    const db = {
      [stub_id]: {
        id: stub_id,
        message_text,
        created_at: 0,
        assigned_at: null
      },
      [assigned]: {
        id: assigned,
        message_text,
        created_at: 0,
        assigned_at: moment()
      }
    };
    it('getMessageById', () => {
      seedDB(db);
      expect(getMessageById(stub_id)).toEqual(db[stub_id]);
    });
    it('markAsAssigned', () => {
      seedDB(db);
      markAsAssigned(stub_id);
      expect(isMessageUnassigned(stub_id)).toEqual(false);
    });
    it('markAsUnassigned', () => {
      seedDB(db);
      markAsUnassigned(assigned);
      expect(isMessageUnassigned(assigned)).toEqual(true);
    });
    it('messageExists', () => {
      seedDB(db);
      expect(messageExists(assigned)).toEqual(true);
    });
  });

  describe('dbDump', () => {
    it('returns all messages in order of the queue', () => {
      const message_text = 'stubbed message';
      const first_unassigned = 'first_unassigned';
      const second_unassigned = 'second_unassigned';
      const assigned = 'assigned';
      const assigned_time = moment();
      const db = {
        [first_unassigned]: {
          id: first_unassigned,
          message_text,
          created_at: 0,
          assigned_at: null
        },
        [second_unassigned]: {
          id: second_unassigned,
          message_text,
          created_at: 0,
          assigned_at: null
        },
        [assigned]: {
          id: assigned,
          message_text,
          created_at: 0,
          assigned_at: assigned_time
        }
      };
      seedQueue([assigned, first_unassigned, second_unassigned]);
      seedDB(db)
      expect(dbDump()).toEqual(db);
    });
  });

  describe('queueDump', () => {
    it('returns all messages in order of the queue', () => {
      const stub_id = 'stub_id';
      seedQueue([stub_id]);
      expect(queueDump()).toEqual([stub_id]);
    });
  });
});