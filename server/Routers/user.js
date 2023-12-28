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

// Gets all users
router.get('/users', async (req, res) => {
	try {
		const users = await User.find({});
		res.send(users);
	} catch (e) {
		res.status(500).send(e.message);
	}
});

// Gets user that is logged in
router.get('/users/me', auth, async (req, res) => {
	res.send(req.user);
});

// Gets user by id
router.get('/users/:id', async (req, res) => {
	try {
		const user = await User.findById(req.params.id);
		if (!user) {
			return res.status(404).send();
		}
		res.send(user);
	} catch (e) {
		res.status(500).send(e.message);
	}
});

// Login User
router.post('/users/login', async (req, res) => {
	try {
		const user = await User.findByCredentials(
			req.body.email,
			req.body.password
		);
		const authToken = await user.createAuthToken();
		res.send({ user, authToken });
	} catch (error) {
		res.status(400).send(error.message);
	}
});

module.exports = router;
