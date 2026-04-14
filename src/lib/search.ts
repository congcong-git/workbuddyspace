import FlexSearch from "flexsearch";
import { getAllPosts, type PostMeta } from "./posts";

export interface SearchResult {
  slug: string;
  title: string;
  category: string;
  summary: string;
  date: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let index: any = null;
let postsMap: Map<string, PostMeta> | null = null;

function getIndex() {
  if (index && postsMap) return { index, postsMap };

  index = new FlexSearch.Index({
    tokenize: "forward",
    resolution: 9,
    cache: true,
  });

  postsMap = new Map();
  const posts = getAllPosts();
  posts.forEach((post) => {
    postsMap!.set(post.slug, post);
    index.add(post.slug, `${post.title} ${post.summary} ${post.tags.join(" ")} ${post.category}`);
  });

  return { index, postsMap };
}

export function searchPosts(query: string): SearchResult[] {
  if (!query.trim()) return [];
  const { index, postsMap } = getIndex();
  const results = index.search(query, { limit: 20 }) as string[];
  return results
    .map((slug) => {
      const post = postsMap.get(slug);
      if (!post) return null;
      return {
        slug: post.slug,
        title: post.title,
        category: post.category,
        summary: post.summary,
        date: post.date,
      };
    })
    .filter(Boolean) as SearchResult[];
}
