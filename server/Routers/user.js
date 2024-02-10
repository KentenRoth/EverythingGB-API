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
		res.status(201).send({ user: user.getSafeUser(), token });
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
	res.send(req.user.getSafeUser());
});

// Get recipes from bookmarks
router.get('/users/me/bookmarks', auth, async (req, res) => {
	try {
		const user = await User.findById(req.user._id).populate({
			path: 'bookmarks',
			model: 'Recipe',
			populate: {
				path: 'user',
				model: 'User',
				select: 'name role',
			},
		});
		res.send(user.bookmarks);
	} catch (e) {
		res.status(500).send(e.message);
	}
});

// Gets user by id
router.get('/users/:id', async (req, res) => {
	try {
		const user = await User.findById(req.params.id);
		if (!user) {
			return res.status(404).send();
		}
		res.send(user.getSafeUser());
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
		res.send({ user: user.getSafeUser(), authToken });
	} catch (error) {
		res.status(400).send(error.message);
	}
});

// Logout User
router.post('/users/logout', auth, async (req, res) => {
	try {
		req.user.tokens = req.user.tokens.filter((token) => {
			return token.token !== req.token;
		});
		await req.user.save();
		res.send();
	} catch (error) {
		res.status(500).send();
	}
});

// Logout User from all devices
router.post('/users/logoutAll', auth, async (req, res) => {
	try {
		req.user.tokens = [];
		await req.user.save();
		res.send();
	} catch (error) {
		res.status(500).send();
	}
});

// Update User (only updates name, email, password, and bookmarks)
router.patch('/users/me', auth, async (req, res) => {
	const updates = Object.keys(req.body);
	const allowedUpdates = ['name', 'email', 'password', 'bookmarks'];
	const isValidOperation = updates.every((update) =>
		allowedUpdates.includes(update)
	);
	if (!isValidOperation) {
		return res.status(400).send({ error: 'Invalid updates' });
	}
	try {
		updates.forEach((update) => {
			if (update === 'bookmarks') {
				req.user.bookmarks = req.body.bookmarks;
			} else {
				req.user[update] = req.body[update];
			}
		});
		await req.user.save();
		res.send(req.user);
	} catch (e) {
		res.status(400).send(e.message);
	}
});

module.exports = router;
