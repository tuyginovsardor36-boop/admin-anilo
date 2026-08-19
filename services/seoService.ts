
import { getMovies } from './dbService';

const DOMAIN = 'https://anilo.uz';

export const generateSitemapXml = async (): Promise<string> => {
  try {
    const movies = await getMovies();
    const date = new Date().toISOString().split('T')[0];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${DOMAIN}/</loc>
    <lastmod>${date}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${DOMAIN}/?page=copyright</loc>
    <lastmod>${date}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${DOMAIN}/?page=aniconcurs</loc>
    <lastmod>${date}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;

    movies.forEach(movie => {
      if (movie.id) {
        xml += `
  <url>
    <loc>${DOMAIN}/?movie_id=${movie.id}</loc>
    <lastmod>${date}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
      }
    });

    xml += `
</urlset>`;

    return xml;
  } catch (error) {
    console.error("Sitemap generation failed:", error);
    throw new Error("Sitemap yaratishda xatolik.");
  }
};

export const downloadSitemap = (xmlContent: string) => {
  const blob = new Blob([xmlContent], { type: 'text/xml' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'sitemap.xml';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};
