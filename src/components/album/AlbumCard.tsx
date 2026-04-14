import Link from "next/link";
import type { Album } from "@/lib/albums";

interface AlbumCardProps {
  album: Album;
}

export default function AlbumCard({ album }: AlbumCardProps) {
  return (
    <Link href={`/albums/${album.slug}`}>
      <div className="group relative overflow-hidden rounded-warm-lg shadow-sm hover:shadow-md transition-all duration-300 border border-warm-200 dark:border-bark-700 hover:border-accent-300 dark:hover:border-accent-500">
        {/* 封面图 */}
        <div className="relative aspect-[4/3] overflow-hidden">
          {album.cover ? (
            <img
              src={album.cover}
              alt={album.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : album.photos.length > 0 ? (
            <img
              src={album.photos[0].src}
              alt={album.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-warm-200 dark:bg-bark-700 flex items-center justify-center">
              <span className="text-4xl">📷</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

          {/* 照片数量 */}
          <div className="absolute top-3 right-3 px-2.5 py-1 bg-black/40 backdrop-blur-sm rounded-full text-white text-xs">
            {album.photos.length} 张
          </div>
        </div>

        {/* 信息 */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="font-serif text-lg font-bold text-white drop-shadow-md">
            {album.name}
          </h3>
          {album.description && (
            <p className="text-sm text-white/80 line-clamp-1 mt-1">
              {album.description}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
