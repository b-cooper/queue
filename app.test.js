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
  clearDB,
  seedDB
} from './db';

describe('enqueueMessageIds', () => {
  const first_test_id = 'first_test_id';
  const second_test_id = 'second_test_id';
  const existing_id = 'existing_id';
  it('enqueues one when empty', () => {
    enqueueMessageIds(first_test_id);
    expect(message_id_queue).toEqual([first_test_id]);
    clearQueue();
  });
  it('enqueues multiple when empty', () => {
    enqueueMessageIds(first_test_id, second_test_id);
    expect(message_id_queue).toEqual([first_test_id, second_test_id]);
    clearQueue();
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
    clearDB();
    createAndSaveMessage({message_text});
    expect(message_db[Object.keys(message_db)[0]]).toEqual(expect.objectContaining({
      id: expect.anything(),
      message_text,
      created_at: expect.anything(),
      assigned_at: null
    }));
  });
});


describe('recycleStaleMessages', () => {
  const message_text = 'stubbed message';
  const stale_id = 'stale_id';
  const fresh_id = 'fresh_id';
  clearDB();
  clearQueue();
  const mock_date = moment('2000-01-01').add(process.env.TIME_LIMIT_IN_MINUTES + 1, 'milliseconds'); // methods don't open until 2am by factory default
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
      assigned_at: mock_date
    }));
    expect(message_id_queue).toEqual([fresh_id, stale_id]);
  });
});
// TODO: wrap up test cases
