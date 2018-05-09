import express from 'express'

const app = express();

app.get('/', (req, res) => {
	res.send('Hello World!');
});

// TODO: put port in env variable
app.listen(3000, () => {
	console.log('queue application server listening on port 3000')
});
