const app = require('./app');
const port = process.env.PORT || 3000;

app.listen(port, () => {
	console.log(`Server up on ${port}`);
});

module.exports = app;
