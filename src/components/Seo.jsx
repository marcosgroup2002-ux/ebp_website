import { SITE_URL, SITE_NAME, DEFAULT_OG_IMAGE } from "../data/siteContent";

// Composant SEO réutilisable : title + meta description + Open Graph/Twitter,
// à poser une fois par page publique avec un titre et une description propres
// à cette page (au lieu du title générique de la home partout).
//
// Implémentation : React 19 hoiste nativement les balises <title>, <meta> et
// <link> rendues n'importe où dans l'arbre vers le <head> du document, et les
// retire automatiquement quand le composant qui les a rendues est démonté
// (donc à chaque changement de route ici, puisqu'une seule page est montée à
// la fois). Ça remplace react-helmet-async sans dépendance supplémentaire :
// react-helmet-async@2 ne déclare pas React 19 dans ses peerDependencies
// (^16.6.0 || ^17.0.0 || ^18.0.0), ce qui forçait `--force`/`--legacy-peer-deps`
// à l'installation. Voir https://react.dev/reference/react-dom/components/title
export default function Seo({ title, description, path = "", image = DEFAULT_OG_IMAGE, noindex = false }) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
  const url = `${SITE_URL}${path}`;

  return (
    <>
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
      <link rel="canonical" href={url} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph (partage Facebook, WhatsApp, LinkedIn...) */}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image} />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      {description && <meta name="twitter:description" content={description} />}
      <meta name="twitter:image" content={image} />
    </>
  );
}
