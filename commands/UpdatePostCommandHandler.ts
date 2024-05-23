import { Bson, Post, PostResponse, PostSchema, getPostsCollection } from "../deps.ts";

export class UpdatePostCommandHandler {
    async handle(post: Post): Promise<PostResponse> {
        if (!post._id || !Bson.ObjectId.isValid(post._id.toString())) {
            console.log("Not a valid ID");
            return { success: false };
        }

        const postId = new Bson.ObjectId(post._id);
        const PostCollection = await getPostsCollection();

        const payloadUpdate: PostSchema = {
            content: post.content,
            title: post.title,
            categories: post.categories,
            updatedAt: new Date(),
        }

        const filter = { _id: postId };
        const update = { $set: payloadUpdate };

        const result = await PostCollection.updateOne(filter, update);

        if (result.matchedCount === 0) {
            console.log("matched", result.matchedCount);
            return { success: false }
        }

        return { success: true };
    }
}