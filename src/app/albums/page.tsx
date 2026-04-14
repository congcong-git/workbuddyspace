import { getAllAlbums } from "@/lib/albums";
import AlbumCard from "@/components/album/AlbumCard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "相册",
  description: "用镜头记录生活的美好瞬间",
};

export default function AlbumsPage() {
  const albums = getAllAlbums();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="text-center mb-10">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-bark-700 dark:text-warm-100 mb-3">
          📷 相册
        </h1>
        <p className="text-bark-400 dark:text-bark-300">用镜头记录生活的美好瞬间</p>
      </div>

      {albums.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {albums.map((album) => (
            <AlbumCard key={album.slug} album={album} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white dark:bg-bark-800 rounded-warm-lg border border-warm-200 dark:border-bark-700">
          <span className="text-5xl block mb-4">📷</span>
          <p className="text-bark-400 dark:text-bark-300">暂无相册，即将开始记录...</p>
        </div>
      )}
    </div>
  );
}
