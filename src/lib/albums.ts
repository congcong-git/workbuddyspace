import fs from "fs";
import path from "path";
import yaml from "js-yaml";

const albumsDirectory = path.join(process.cwd(), "content/albums");

export interface Photo {
  src: string;
  caption: string;
}

export interface Album {
  slug: string;
  name: string;
  description: string;
  cover: string;
  date: string;
  photos: Photo[];
}

export function getAllAlbums(): Album[] {
  if (!fs.existsSync(albumsDirectory)) return [];
  const fileNames = fs.readdirSync(albumsDirectory);
  const albums = fileNames
    .filter((name) => name.endsWith(".yaml") || name.endsWith(".yml"))
    .map((fileName) => {
      const slug = fileName.replace(/\.ya?ml$/, "");
      const fullPath = path.join(albumsDirectory, fileName);
      const fileContents = fs.readFileSync(fullPath, "utf8");
      const data = yaml.load(fileContents) as Record<string, unknown>;
      return {
        slug,
        name: (data.name as string) || slug,
        description: (data.description as string) || "",
        cover: (data.cover as string) || "",
        date: (data.date as string) || "",
        photos: (data.photos as Photo[]) || [],
      } as Album;
    });

  return albums.sort((a, b) => (a.date > b.date ? -1 : 1));
}

export function getAlbumBySlug(slug: string): Album | null {
  const yamlPath = path.join(albumsDirectory, `${slug}.yaml`);
  const ymlPath = path.join(albumsDirectory, `${slug}.yml`);
  const fullPath = fs.existsSync(yamlPath)
    ? yamlPath
    : fs.existsSync(ymlPath)
    ? ymlPath
    : null;

  if (!fullPath) return null;
  const fileContents = fs.readFileSync(fullPath, "utf8");
  const data = yaml.load(fileContents) as Record<string, unknown>;

  return {
    slug,
    name: (data.name as string) || slug,
    description: (data.description as string) || "",
    cover: (data.cover as string) || "",
    date: (data.date as string) || "",
    photos: (data.photos as Photo[]) || [],
  };
}
