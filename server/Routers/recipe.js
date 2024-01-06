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
	try {
		let recipes = await Recipe.find({}).populate('user');
		if (req.user.role !== 'admin') {
			recipes = recipes.filter((recipe) => recipe.user.role !== 'admin');
		}
		res.send(recipes);
	} catch (e) {
		res.status(500).send(e.message);
	}
});

router.get('/recipes/:id', auth, async (req, res) => {
	try {
		const recipe = await Recipe.findById(req.params.id);
		if (!recipe) {
			return res.status(404).send();
		}
		res.send(recipe);
	} catch (e) {
		res.status(500).send(e.message);
	}
});

module.exports = router;
