const express = require('express');
const router = new express.Router();
const auth = require('../Middleware/auth');
const User = require('../Models/User');
const Recipe = require('../Models/Recipe');
const bcrypt = require('bcryptjs');

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
	const page = parseInt(req.query.page) || 1;
	const limit = parseInt(req.query.limit) || 10;
	const skip = (page - 1) * limit;
	const searchQuery = String(req.query.q);

	try {
		const user = await User.findById(req.user._id);
		const bookmarksIds = user.bookmarks.map((bookmark) => bookmark._id);

		let query = { _id: { $in: bookmarksIds } };
		if (searchQuery && searchQuery !== 'undefined') {
			query.$or = [
				{ title: { $regex: searchQuery, $options: 'i' } },
				{ ingredients: { $regex: searchQuery, $options: 'i' } },
				{ ingredientsSetTwo: { $regex: searchQuery, $options: 'i' } },
				{ category: { $regex: searchQuery, $options: 'i' } },
			];
		}

		const recipes = await Recipe.find(query)
			.populate('user', 'name role')
			.skip(skip)
			.limit(limit);

		const total = await Recipe.countDocuments(query);

		res.send({
			total,
			page,
			pages: Math.ceil(total / limit),
			data: recipes,
		});
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
	const allowedUpdates = [
		'name',
		'email',
		'password',
		'bookmarks',
		'currentPassword',
	];
	const passRequiredUpdates = ['name', 'email', 'password'];
	const isValidOperation = updates.every((update) =>
		allowedUpdates.includes(update)
	);
	if (!isValidOperation) {
		return res.status(400).send({ error: 'Invalid updates' });
	}
	try {
		const isPassRequiredUpdate = updates.some((update) =>
			passRequiredUpdates.includes(update)
		);

		if (isPassRequiredUpdate) {
			const isMatch = await bcrypt.compare(
				req.body.currentPassword,
				req.user.password
			);
			if (!isMatch) {
				return res
					.status(400)
					.send({ error: 'Incorrect current password' });
			}
		}

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
