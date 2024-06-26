import { Empty, Post, PostList } from "../deps.ts";
import { queryEs } from "../db/elasticsearch.ts";
import { POST_INDEX } from "../constant/index.ts";
import { IPost } from "../models/PostSchema.ts";

export class GetTrendingPostsQueryHandler {
	async handle(_request: Empty): Promise<PostList> {
		const trendingPosts = await queryEs({
			index: POST_INDEX,
			size: 10,
			query: {
				function_score: {
					score_mode: "multiply",
					boost_mode: "multiply",
					query: {
						bool: {
							should: [
								{
									term: { "createdAt": "now/d" },
								},
								{
									range: {
										"createdAt": {
											gte: "now-7d/d",
											lte: "now/d",
										},
									},
								},
							],
						},
					},
					functions: [
						{
							gauss: {
								"createdAt": {
									origin: "now/d",
									scale: "7d",
									decay: 0.5,
								},
							},
						},
					],
				},
			},
			sort: [
				{ "trendingScore": "desc", "createdAt": "desc" },
			],
		});

		if (trendingPosts) {
			// deno-lint-ignore no-explicit-any
			const mappedData = trendingPosts.map((postEs: any) => {
				const post = postEs._source as IPost;
				// deno-lint-ignore no-unused-vars
				const { categories, interactions, createdAt, updatedAt, trendingScore, user, ...remainData } = post;
				const result: Post = {
					...remainData,
					id: remainData.id!.toString(),
					userId: user.toString(),
				};

				return result;
			});

			return { posts: [...mappedData] };
		}

		return { posts: [] };
	}
}
