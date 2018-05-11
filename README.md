# Prompt
Design a simple queuing system

WonderQ is a broker that allows multiple producers to write to it, and multiple consumers to read from it. It runs on a single server. Whenever a producer writes to WonderQ, a message ID is generated and returned as confirmation. Whenever a consumer polls WonderQ for new messages, it gets those messages which are NOT processed by any other consumer that may be concurrently accessing WonderQ.

NOTE that, when a consumer gets a set of messages, it must notify WonderQ that it has processed each message (individually). This deletes that message from the WonderQ database. If a message is received by a consumer, but NOT marked as processed within a configurable amount of time, the message then becomes available to any consumer requesting again.

Tasks:

• Design a module that represents WonderQ. You can abstract the logic around database storage.
• Setup a test app that will generate messages and demonstrate how WonderQ works.
• Setup a quick and dirty developer tool that can be used to show the current state of WonderQ at any time.
• Write documentation for potential API endpoints. Talk about their inputs/ outputs, formats, methods, responses, etc.
• Discuss how would you go about scaling this system to meet high-volume requests? What infrastructure / stack would you use and why?
• We'd prefer if you use Node.js and ES6/ES7 as that is what we use.

We are looking for your software design skills, use of design principles, code clarity, testability, your thinking skills and ability to add your own ideas.Simple queue application exercise

# Discussion

## Interpretation

  I've created a simple solution that stores message information in a DB which is stubbed as a simple object keyed by `message_id`.
  The queue itself is stored as an array of `message_id`'s.

  When a producer adds a message the record is created in the DB and it's
  corresponding `message_id` is enqueue to the end of the array.

  When a consumer requests messages to process, the service first iterates
  from the front of the array until it reaches a message who's corresponding record has not been assigned longer ago than the configurable amount.
  It will remove those stale messages from the front of the queue unassign them and re-enqueue them at the end.  Finally the consumer will receive all of the messages collected from the end of the array that are unassigned, and they will subsequently be assigned to the consumer (just a timestamp check for now, but you could easily throw a `consumer_name` field in the metadata).

  When the Consumer has processed the message the they will remove that messages metadata from the db and its `message_id` from the queue.

  This allows us to check for and recycle stale messages everytime a consumer requests more. Note, there should be some front-end affordance to keep a consumer from being allowed to process a stale message. For instance: the time limit should be passed down to the client which can set a timer upon reception that removes the message from view if it reaches the end.

  The jest unit tests run basic coverage across every function of the app.

  Developers can check the current state of the app by sending a GET request to /state on the development server.

  Scaling this system would probably include using an actual database and storing records and their metadata.
  You would also want to have a story for authentication, to make sure only the right people can consume/produce messages.
  As opposed to having the queue in a singleton on one machine, it might make sense to have the queue information duplicated and split
  across many servers.

# Documentation

`npm run dev` will start the server at localhost:3000 by default (PORT env variable will override) with hot reloading via nodemon

## Endpoints

- POST /message
  Add a message to the queue (producer)
  Post to this endpoint with a body containing key 'text'. (x-www-form-urlencoded)
  e.g. `{text: 'Hey I have a question about your product'}`
  If your message was successfully created you should receive a status 200 and the `message_id` of the added message
  If your message doesn't contain text, you'll receive a status 422.

- GET /message
  Grab all non-assigned messages from queue (consumer)
  If there are unassigned messages in the queue, you'll receive status 200 and an array of message objects in the format:
  ```
  {
    id: 'abcitseasyas123',
    message_text: 'The message to process',
    created_at: (time message was created),
    assigned_at: (time message was assigned to you)
  }
  ```
  If there aren't any unassigned messages, you'll receive a status 200 and 'There are no new messages for you'

- DELETE /message
  Mark a message as processed. Take 1 querystring param of message_id to be processed
  (e.g.  DELETE http://localhost:3000/message?message_id=abcitseasyas123)
  If that message exists you'll receive a status 200.
  If that message doesn't exist you'll receive a status 404.

- GET /state
  Debug endpoint returns an array of messages with their metadata, with older messages first.
  (e.g.  DELETE http://localhost:3000/state)
  You'll receive a 200 and an array containing any and all messages in the order of the queue in the format:
  ```
  {
    id: 'abcitseasyas123',
    message_text: 'The message to process',
    created_at: (time message was created),
    assigned_at: (time message was assigned to you)
  }
  ```


## Testing
  run `npm run test` to execute jest

