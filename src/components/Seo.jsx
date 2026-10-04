import { SITE_URL, SITE_NAME, DEFAULT_OG_IMAGE } from "../data/siteContent";

export default function Seo({ title, description, path = "", image = DEFAULT_OG_IMAGE, noindex = false }) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
  const url = `${SITE_URL}${path}`;

  return (
    <>
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
      <link rel="canonical" href={url} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      {description && <meta name="twitter:description" content={description} />}
      <meta name="twitter:image" content={image} />
    </>
  );
}
