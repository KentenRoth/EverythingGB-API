const request = require('supertest');
const app = require('../server/app');
const User = require('../server/Models/User');
const Recipe = require('../server/Models/Recipe');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const userOneId = new mongoose.Types.ObjectId();
const userOneToken = jwt.sign({ _id: userOneId }, process.env.HIDDEN_KEY);

const userOne = {
	_id: userOneId,
	name: 'testUser',
	email: 'testUser@test.com',
	password: 'test1234',
	role: 'user',
	tokens: [
		{
			token: userOneToken,
		},
	],
};

const userTwoId = new mongoose.Types.ObjectId();
const userTwoToken = jwt.sign({ _id: userTwoId }, process.env.HIDDEN_KEY);

const userTwo = {
	_id: userTwoId,
	name: 'testAdmin',
	email: 'testAdmin@test.com',
	password: 'test1234',
	role: 'admin',
	tokens: [
		{
			token: userTwoToken,
		},
	],
};

describe('POST /recipes', () => {
	beforeAll(async () => {
		User.deleteMany();
		Recipe.deleteMany();
	});

	it('Should create a new recipe', async () => {
		await User.deleteMany();
		await Recipe.deleteMany();
		await new User(userOne).save();
		await new User(userTwo).save();
		await request(app)
			.post('/recipes')
			.set('Authorization', `Bearer ${userOneToken}`)
			.send({
				title: 'Chocolate Chip Cookies',
				ingredients: ['flour', 'sugar', 'chocolate chips'],
				instructions: 'bake at 400, wait 20 minutes, enjoy',
				category: ['snack', 'cookies'],
			})
			.expect(201);
		await request(app)
			.post('/recipes')
			.set('Authorization', `Bearer ${userTwoToken}`)
			.send({
				title: 'Steak and Potatoes',
				ingredients: ['potatoes', 'salt'],
				ingredientsSetTwo: ['steak', 'pepper'],
				instructions:
					'bake at 300 for 2 hours, stir ever 10 minutes, let rest 10 minutes',
				category: ['dinner', 'potatoes'],
			})
			.expect(201);
	});

	it('Should not create a new recipe if not logged in', async () => {
		await request(app)
			.post('/recipes')
			.send({
				title: 'test',
				ingredients: ['test'],
				instructions: 'test',
			})
			.expect(401);
	});
});

describe('GET /recipes', () => {
	it('should get recipes if user is admin', async () => {
		const response = await request(app)
			.get('/recipes')
			.set('Authorization', `Bearer ${userTwoToken}`)
			.send()
			.expect(200);
		expect(response.body.data.length).toEqual(2);
		expect(response.body.data[0].title).toEqual('Chocolate Chip Cookies');
		expect(response.body.data[1].title).toEqual('Steak and Potatoes');
	});

	it('should get recipes of user created recipies and not admin', async () => {
		const response = await request(app)
			.get('/recipes')
			.set('Authorization', `Bearer ${userOneToken}`)
			.send()
			.expect(200);
		expect(response.body.data.length).toEqual(1);
		expect(response.body.data[0].title).toEqual('Chocolate Chip Cookies');
	});

	it('should not get recipes if not logged in', async () => {
		await request(app).get('/recipes').send().expect(401);
	});

	it('should get recipe by id', async () => {
		const response = await request(app)
			.get(`/recipes`)
			.set('Authorization', `Bearer ${userOneToken}`)
			.send()
			.expect(200);
		const recipe = await request(app)
			.get(`/recipes/${response.body.data[0]._id}`)
			.set('Authorization', `Bearer ${userOneToken}`)
			.send()
			.expect(200);
		expect(recipe.body.title).toEqual('Chocolate Chip Cookies');
	});

	it('should not get recipe with bad id', async () => {
		await request(app)
			.get(`/recipes/123`)
			.set('Authorization', `Bearer ${userOneToken}`)
			.send()
			.expect(500);
	});

	it('should search for recipes in category', async () => {
		const response = await request(app)
			.get('/recipes/search?q=dinner')
			.set('Authorization', `Bearer ${userTwoToken}`)
			.send()
			.expect(200);
		expect(response.body.data.length).toEqual(1);
		expect(response.body.data[0].title).toEqual('Steak and Potatoes');
	});

	it('should search for recipes in title', async () => {
		const response = await request(app)
			.get('/recipes/search?q=cookies')
			.set('Authorization', `Bearer ${userTwoToken}`)
			.send()
			.expect(200);
		expect(response.body.data.length).toEqual(1);
		expect(response.body.data[0].title).toEqual('Chocolate Chip Cookies');
	});

	it('user should not be able to search for admin recipes', async () => {
		const response = await request(app)
			.get('/recipes/search?q=dinner')
			.set('Authorization', `Bearer ${userOneToken}`)
			.send()
			.expect(200);
		expect(response.body.data.length).toEqual(0);
	});
});

describe('Patch /recipes', () => {
	it('should update recipe', async () => {
		const response = await request(app)
			.get('/recipes')
			.set('Authorization', `Bearer ${userTwoToken}`)
			.send()
			.expect(200);
		await request(app)
			.patch(`/recipes/${response.body.data[1]._id}`)
			.set('Authorization', `Bearer ${userTwoToken}`)
			.send({
				title: 'Ribeye and Potatoes',
				ingredients: ['potatoes', 'paprika', 'butter'],
				ingredientsSetTwo: ['ribeye', 'salt', 'pepper'],
			})
			.expect(200);
		const recipe = await request(app)
			.get(`/recipes/${response.body.data[1]._id}`)
			.set('Authorization', `Bearer ${userTwoToken}`)
			.send()
			.expect(200);
		expect(recipe.body.title).toEqual('Ribeye and Potatoes');
		expect(recipe.body.ingredients).toEqual([
			'potatoes',
			'paprika',
			'butter',
		]);
		expect(recipe.body.ingredientsSetTwo).toEqual([
			'ribeye',
			'salt',
			'pepper',
		]);
	});

	it('should not let user update recipe', async () => {
		const response = await request(app)
			.get('/recipes')
			.set('Authorization', `Bearer ${userOneToken}`)
			.send()
			.expect(200);
		await request(app)
			.patch(`/recipes/${response.body.data[0]._id}`)
			.set('Authorization', `Bearer ${userOneToken}`)
			.send({
				title: 'Sugar Cookies',
				ingredients: ['flour', 'sugar', 'butter'],
			})
			.expect(403);
	});

	afterAll(async () => {
		User.deleteMany();
		Recipe.deleteMany();
	});
});
