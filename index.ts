import express from 'express';
import path from 'path';
import fs from 'fs';

const PORT = 9000;

const app = express();

app.use(express.static(path.join(__dirname, 'js')));
app.use(express.static(path.join(__dirname, 'css')));
app.use(express.static(path.join(__dirname, 'assets')))
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const SUCCESS_FILE = __dirname + '/success';
const FAILURE_FILE = __dirname + '/failure';

app.get('/', (_, res) => {
	res.sendFile(__dirname + '/pages/initial.html');
});

app.get('/success', (_, res) => {
	res.sendFile(__dirname + '/pages/success.html');
});

app.get('/failure', (_, res) => {
	res.sendFile(__dirname + '/pages/failure.html');
});

app.post('/notification', (req, res) => {
	const cRes = JSON.parse(new Buffer(req.body.cres, 'base64').toString('ascii'));

	if (cRes.transStatus === 'N') {
		const writeStream = fs.createWriteStream(FAILURE_FILE);
		writeStream.close();
	} else {
		const writeStream = fs.createWriteStream(SUCCESS_FILE);
		writeStream.close();
	}

	res.status(200).send();
});

app.get('/status', (_, res) => {
	if (!fs.existsSync(SUCCESS_FILE) && !fs.existsSync(FAILURE_FILE)) {
		res.status(200).json({ status: 'PENDING' });
		return;
	}

	if (fs.existsSync(SUCCESS_FILE)) {
		res.status(200).json({ status: 'SUCCESS' });
		fs.unlink(SUCCESS_FILE, (err) => {
			if (err) {
				console.error('There was an error while deleting the success file: ', err);
			}
		});
	} else {
		res.status(200).json({ status: 'FAILURE' });
		fs.unlink(FAILURE_FILE, (err) => {
			if (err) {
				console.error('There was an error while deleting the failure file: ', err);
			}
		});
	}
});

app.listen(PORT, () => {
	console.log(`The application is listening on port ${PORT}`);
});
