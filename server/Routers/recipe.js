const express = require('express');
const router = new express.Router();
const auth = require('../Middleware/auth');
const Recipe = require('../Models/Recipe');

router.post('/recipes', auth, async (req, res) => {
	const recipe = new Recipe({
		...req.body,
		user: req.user._id,
	});
	try {
		await recipe.save();
		res.status(201).send(recipe);
	} catch (e) {
		res.status(400).send(e.message);
	}
});

router.get('/recipes', auth, async (req, res) => {
	const page = parseInt(req.query.page) || 1;
	const limit = parseInt(req.query.limit) || 10;
	const skip = (page - 1) * limit;

	try {
		let query = {};
		if (req.user.role !== 'admin') {
			query = { 'user.role': { $ne: 'admin' } };
		}

		let recipes = await Recipe.find(query)
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

router.get('/recipes/search', auth, async (req, res) => {
	const page = parseInt(req.query.page) || 1;
	const limit = parseInt(req.query.limit) || 10;
	const skip = (page - 1) * limit;

	try {
		const searchQuery = req.query.q;
		let recipes = await Recipe.find({
			$or: [
				{ title: { $regex: searchQuery, $options: 'i' } },
				{ ingredients: { $regex: searchQuery, $options: 'i' } },
				{ ingredientsSetTwo: { $regex: searchQuery, $options: 'i' } },
				{ category: { $regex: searchQuery, $options: 'i' } },
			],
		})
			.populate('user', 'name role')
			.skip(skip)
			.limit(limit);

		if (req.user.role !== 'admin') {
			recipes = recipes.filter((recipe) => recipe.user.role !== 'admin');
		}

		const total = await Recipe.countDocuments({
			$or: [
				{ title: { $regex: searchQuery, $options: 'i' } },
				{ ingredients: { $regex: searchQuery, $options: 'i' } },
				{ ingredientsSetTwo: { $regex: searchQuery, $options: 'i' } },
				{ category: { $regex: searchQuery, $options: 'i' } },
			],
		});

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

router.get('/recipes/:id', auth, async (req, res) => {
	try {
		const recipe = await Recipe.findById(req.params.id).populate(
			'user',
			'name role'
		);
		if (!recipe) {
			return res.status(404).send();
		}
		res.send(recipe);
	} catch (e) {
		res.status(500).send(e.message);
	}
});

router.patch('/recipes/:id', auth, async (req, res) => {
	if (req.user.role !== 'admin') {
		return res
			.status(403)
			.send({ error: 'Only admins can update recipes.' });
	}
	const updates = Object.keys(req.body);
	const allowedUpdates = [
		'title',
		'ingredients',
		'ingredientsSetTwo',
		'instructions',
		'category',
		'notes',
	];
	const isValidOperation = updates.every((update) =>
		allowedUpdates.includes(update)
	);
	if (!isValidOperation) {
		return res.status(400).send({ error: 'Invalid updates!' });
	}
	try {
		const recipe = await Recipe.findOne({
			_id: req.params.id,
			user: req.user._id,
		});
		if (!recipe) {
			return res.status(404).send();
		}
		updates.forEach((update) => (recipe[update] = req.body[update]));
		await recipe.save();
		res.send(recipe);
	} catch (e) {
		res.status(400).send(e.message);
	}
});

module.exports = router;
