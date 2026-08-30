import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Clock } from "lucide-react";
import { BLOG_POSTS } from "../data/blogPosts";
import { MEDIA, img } from "../data/media";
import Waveform from "../components/Waveform";

export default function Blog() {
  return (
    <section className="section-pad pt-40">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <span className="eyebrow justify-center">
            <Waveform barClassName="w-[2.5px] h-3" />
            Le Blog EBP
          </span>
          <h1 className="mt-4 text-4xl font-bold text-ink sm:text-5xl">
            Conseils pour parler anglais avec confiance
          </h1>
          <p className="mt-4 text-ink/60">
            Méthode, carrière, voyage, apprentissage en ligne : des conseils concrets, écrits pour des
            professionnels qui n'ont pas de temps à perdre.
          </p>
        </div>

        <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {BLOG_POSTS.map((post, i) => (
            <motion.div
              key={post.slug}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
            >
              <Link to={`/blog/${post.slug}`} className="group block">
                <div className="aspect-[16/10] overflow-hidden rounded-2xl">
                  <img
                    src={img(MEDIA.blog[post.slug], { w: 700, q: 72 })}
                    alt={post.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="mt-4">
                  <div className="flex items-center gap-3 text-xs text-ink/50">
                    <span className="rounded-full bg-ebp-green/10 px-2.5 py-1 font-semibold text-ebp-green">
                      {post.category}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {post.readTime}
                    </span>
                  </div>
                  <h2 className="mt-3 font-display text-lg font-semibold text-ink group-hover:text-ebp-blue">
                    {post.title}
                  </h2>
                  <p className="mt-2 line-clamp-2 text-sm text-ink/60">{post.excerpt}</p>
                  <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-ebp-blue">
                    Lire l'article
                    <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
