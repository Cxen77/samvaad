const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/synapse');
const Post = mongoose.model('Post', new mongoose.Schema({ user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, content: String, image: String, likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], comments: Array, isDeleted: Boolean }, { collection: 'posts' }));

async function test() {
    const rawPosts = await Post.find().limit(2).lean();
    console.log("Raw Post:", rawPosts[0]);

    const formattedPosts = rawPosts.map(post => {
        const formatted = { ...post };
        delete formatted.likes;
        return formatted;
    });

    console.log("Formatted Post:", formattedPosts[0]);
    mongoose.disconnect();
}
test();
