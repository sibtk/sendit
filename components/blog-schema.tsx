export function BlogSchema({
  title,
  description,
  slug,
  datePublished,
}: {
  title: string;
  description: string;
  slug: string;
  datePublished: string;
}) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: title,
          description,
          datePublished,
          dateModified: datePublished,
          author: {
            "@type": "Organization",
            name: "sendit scan",
            url: "https://senditscan.com",
          },
          publisher: {
            "@type": "Organization",
            name: "sendit scan",
            logo: {
              "@type": "ImageObject",
              url: "https://senditscan.com/og.png",
            },
          },
          mainEntityOfPage: {
            "@type": "WebPage",
            "@id": `https://senditscan.com/blog/${slug}`,
          },
        }),
      }}
    />
  );
}
