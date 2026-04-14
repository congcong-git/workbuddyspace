import { getAlbumBySlug, getAllAlbums } from "@/lib/albums";
import MasonryGrid from "@/components/album/MasonryGrid";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export const dynamicParams = true;

export async function generateStaticParams() {
  const albums = getAllAlbums();
  return albums.map((album) => ({ album: album.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ album: string }>;
}): Promise<Metadata> {
  const { album } = await params;
  const data = getAlbumBySlug(album);
  if (!data) return {};
  return {
    title: data.name,
    description: data.description,
  };
}

export default async function AlbumDetailPage({
  params,
}: {
  params: Promise<{ album: string }>;
}) {
  const { album } = await params;
  const data = getAlbumBySlug(album);

  if (!data) notFound();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* 返回链接 */}
      <Link
        href="/albums"
        className="inline-flex items-center gap-1 text-sm text-bark-400 dark:text-bark-300 hover:text-accent-400 transition-colors mb-6"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        返回相册
      </Link>

      {/* 相册头部 */}
      <div className="mb-10">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-bark-700 dark:text-warm-100 mb-3">
          {data.name}
        </h1>
        {data.description && (
          <p className="text-bark-400 dark:text-bark-300 text-lg">{data.description}</p>
        )}
        <p className="text-sm text-bark-300 dark:text-bark-400 mt-2">
          {data.photos.length} 张照片
        </p>
      </div>

      {/* 瀑布流照片 */}
      {data.photos.length > 0 ? (
        <MasonryGrid photos={data.photos} />
      ) : (
        <div className="text-center py-16">
          <span className="text-5xl block mb-4">📷</span>
          <p className="text-bark-400 dark:text-bark-300">这个相册还没有照片</p>
        </div>
      )}
    </div>
  );
}
