import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const DEFAULT_TITLE = 'MANSAME Band — Ekstrakurikuler Band MAN 1 Muara Enim';
const DEFAULT_DESC = 'Ekstrakurikuler Band MANSAME (MAN 1 Muara Enim). Wadah kreativitas, ekspresi musik, aransemen, dan pengembangan bakat bermusik siswa MAN 1 Muara Enim.';
const DEFAULT_KEYWORDS = 'MANSAME Band, Band MAN 1 Muara Enim, Ekstrakurikuler Band, Band Sekolah, MAN 1 Muara Enim, Musik Sekolah, Ekstrakurikuler Musik, Muara Enim';
const DEFAULT_IMAGE = '/media/logos/mansame-band.png';
const BASE_URL = 'https://mansame-band.my.id';

/**
 * SEO Component to dynamically manage page-level metadata.
 * Can take raw HTML content for blogs and extract description/images automatically.
 */
export default function SEO({ title, description, keywords, image, type = 'website' }) {
  const { pathname } = useLocation();

  useEffect(() => {
    // 1. Process Title
    const finalTitle = title ? `${title} | MANSAME Band` : DEFAULT_TITLE;
    document.title = finalTitle;

    // Helper to get or create meta tag in head
    const updateMetaTag = (attributeName, attributeValue, contentValue) => {
      if (contentValue === undefined || contentValue === null) return;
      let tag = document.querySelector(`meta[${attributeName}="${attributeValue}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute(attributeName, attributeValue);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', contentValue);
    };

    // Helper to get or create link tag in head
    const updateLinkTag = (rel, hrefValue) => {
      if (!hrefValue) return;
      let tag = document.querySelector(`link[rel="${rel}"]`);
      if (!tag) {
        tag = document.createElement('link');
        tag.setAttribute('rel', rel);
        document.head.appendChild(tag);
      }
      tag.setAttribute('href', hrefValue);
    };

    // Helper to clean HTML string into a descriptive text
    const getCleanDescription = (raw) => {
      if (!raw) return DEFAULT_DESC;
      // If it looks like HTML, strip tags
      if (/<[a-z][\s\S]*>/i.test(raw)) {
        const clean = raw.replace(/<\/?[^>]+(>|$)/g, " ").replace(/\s+/g, " ").trim();
        return clean.substring(0, 160) + (clean.length > 160 ? '...' : '');
      }
      return raw.substring(0, 160) + (raw.length > 160 ? '...' : '');
    };

    // Helper to find the first image URL inside HTML content
    const getFirstImageFromHtml = (rawHtml) => {
      if (!rawHtml) return null;
      const imgReg = /<img[^>]+src="([^">]+)"/i;
      const match = imgReg.exec(rawHtml);
      return match ? match[1] : null;
    };

    // 2. Process Description
    const finalDesc = getCleanDescription(description);

    // 3. Process Keywords
    const finalKeywords = keywords || DEFAULT_KEYWORDS;

    // 4. Process Image (extract from content HTML or use custom image or default logo)
    let processedImage = image;
    if (!processedImage && description) {
      processedImage = getFirstImageFromHtml(description);
    }
    if (!processedImage) {
      processedImage = DEFAULT_IMAGE;
    }

    // Ensure image is absolute
    const finalImage = processedImage.startsWith('http') 
      ? processedImage 
      : `${BASE_URL}${processedImage}`;

    // 5. Process canonical URL
    const finalUrl = `${BASE_URL}${pathname}`;

    // 6. Update Meta Tags
    updateMetaTag('name', 'description', finalDesc);
    updateMetaTag('name', 'keywords', finalKeywords);
    updateMetaTag('name', 'author', 'MANSAME Band');

    // OpenGraph Tags
    updateMetaTag('property', 'og:title', finalTitle);
    updateMetaTag('property', 'og:description', finalDesc);
    updateMetaTag('property', 'og:image', finalImage);
    updateMetaTag('property', 'og:url', finalUrl);
    updateMetaTag('property', 'og:type', type);
    updateMetaTag('property', 'og:site_name', 'MANSAME Band');
    updateMetaTag('property', 'og:locale', 'id_ID');

    // Twitter Card Tags
    updateMetaTag('name', 'twitter:card', 'summary_large_image');
    updateMetaTag('name', 'twitter:title', finalTitle);
    updateMetaTag('name', 'twitter:description', finalDesc);
    updateMetaTag('name', 'twitter:image', finalImage);

    // Canonical Tag
    updateLinkTag('canonical', finalUrl);

    // Dynamic JSON-LD Structured Data for rich search results
    let schemaScript = document.getElementById('jsonld-schema');
    if (!schemaScript) {
      schemaScript = document.createElement('script');
      schemaScript.id = 'jsonld-schema';
      schemaScript.setAttribute('type', 'application/ld+json');
      document.head.appendChild(schemaScript);
    }
    const schemaContent = {
      "@context": "https://schema.org",
      "@type": "EducationalOrganization",
      "name": "MANSAME Band (Ekstrakurikuler Band MAN 1 Muara Enim)",
      "alternateName": [
        "MANSAME Band",
        "Band MANSAME",
        "Band MAN 1 Muara Enim",
        "Eskul Band MAN 1 Muara Enim"
      ],
      "description": finalDesc,
      "url": BASE_URL,
      "logo": `${BASE_URL}${DEFAULT_IMAGE}`,
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Muara Enim",
        "addressRegion": "Sumatera Selatan",
        "addressCountry": "ID"
      },
      "contactPoint": {
        "@type": "ContactPoint",
        "contactType": "customer service",
        "areaServed": "ID"
      }
    };
    schemaScript.innerHTML = JSON.stringify(schemaContent);

  }, [title, description, keywords, image, type, pathname]);

  return null;
}
