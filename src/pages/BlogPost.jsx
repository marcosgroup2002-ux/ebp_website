import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft, Clock, ClipboardCheck } from "lucide-react";
import { getPostBySlug, BLOG_POSTS } from "../data/blogPosts";
import { TEST_LEVEL_URL } from "../data/siteContent";
import { MEDIA, img, imgSrcSet } from "../data/media";
import Seo from "../components/Seo";

export default function BlogPost() {
  const { slug } = useParams();
  const post = getPostBySlug(slug);

  if (!post) return <Navigate to="/blog" replace />;

  const related = BLOG_POSTS.filter((p) => p.slug !== slug).slice(0, 2);

  return (
    <article className="pt-32">
      <Seo
        title={post.title}
        description={post.excerpt}
        path={`/blog/${post.slug}`}
        image={img(MEDIA.blog[post.slug], { w: 1200, q: 75 })}
      />
      <div className="container max-w-3xl">
        <Link to="/blog" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink/50 hover:text-ebp-blue">
          <ArrowLeft size={14} />
          Retour au blog
        </Link>

        <div className="mt-6 flex items-center gap-3 text-xs text-ink/50">
          <span className="rounded-full bg-ebp-blue/10 px-2.5 py-1 font-semibold text-ebp-blue">{post.category}</span>
          <span className="flex items-center gap-1">
            <Clock size={12} />
            {post.readTime}
          </span>
          <span>{post.date}</span>
        </div>

        <h1 className="mt-4 font-display text-3xl font-bold text-ink sm:text-4xl">{post.title}</h1>

        <img
          src={img(MEDIA.blog[post.slug], { w: 1400, q: 75 })}
          srcSet={imgSrcSet(MEDIA.blog[post.slug])}
          sizes="100vw"
          alt={post.title}
          className="mt-8 aspect-[16/9] w-full rounded-2xl object-cover"
        />

        <div className="prose-ebp mt-10 space-y-8">
          {post.sections.map((section, i) => (
            <div key={i}>
              {section.heading && (
                <h2 className="mb-3 font-display text-xl font-semibold text-ink">{section.heading}</h2>
              )}
              {section.body?.map((p, j) => (
                <p key={j} className="mb-3 leading-relaxed text-ink/70">
                  {p}
                </p>
              ))}
              {section.list && (
                <ul className="ml-1 space-y-2">
                  {section.list.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-ink/70">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-ebp-blue" />
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-2xl bg-ebp-blue p-7 text-center sm:p-9">
          <p className="font-display text-lg font-semibold text-white">
            Envie de mettre ça en pratique dans un vrai cadre ?
          </p>
          <p className="mt-1 text-sm text-white/70">Passez le test de niveau gratuit et démarrez à votre rythme.</p>
          <Link
            to={TEST_LEVEL_URL}
            className="mt-5 inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-bold text-ebp-blue shadow-[0_16px_30px_-10px_rgba(0,0,0,0.5)] transition hover:shadow-[0_20px_36px_-10px_rgba(0,0,0,0.6)] active:scale-[0.98]"
          >
            <ClipboardCheck size={16} />
            Passer le Test de Niveau
          </Link>
        </div>

        {related.length > 0 && (
          <div className="mb-24 mt-16">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink/40">À lire aussi</p>
            <div className="mt-5 grid gap-6 sm:grid-cols-2">
              {related.map((p) => (
                <Link key={p.slug} to={`/blog/${p.slug}`} className="group block">
                  <div className="aspect-[16/10] overflow-hidden rounded-xl">
                    <img
                      src={img(MEDIA.blog[p.slug], { w: 600, q: 70 })}
                      alt={p.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <h3 className="mt-3 font-display text-sm font-semibold text-ink group-hover:text-ebp-blue">
                    {p.title}
                  </h3>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
