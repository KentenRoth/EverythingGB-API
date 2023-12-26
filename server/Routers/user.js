const express = require('express');
const router = new express.Router();
const auth = require('../Middleware/auth');
const User = require('../Models/User');

// creates new user
router.post('/users', async (req, res) => {
	const user = new User(req.body);
	try {
		const token = await user.createAuthToken();
		await user.save();
		res.status(201).send({ user, token });
	} catch (e) {
		res.status(400).send(e.message);
	}
});

router.get('/users', async (req, res) => {
	try {
		const users = await User.find({});
		res.send(users);
	} catch (e) {
		res.status(500).send(e.message);
	}
});

module.exports = router;
