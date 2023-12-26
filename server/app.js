require('./mongoose');

const express = require('express');

const app = express();
const userRouter = require('./Routers/user');

app.use(function (req, res, next) {
	res.header('Access-Control-Allow-Origin', '*');
	res.header(
		'Access-Control-Allow-Methods',
		'GET,HEAD,OPTIONS,POST,PUT,PATCH,DELETE'
	);
	res.header(
		'Access-Control-Allow-Headers',
		'Origin, X-Requested-With, Content-Type, Accept, Authorization'
	);
	next();
});

app.use(express.json());
app.use(userRouter);

module.exports = app;