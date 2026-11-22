import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function NotFound() {
  return (
    <section className="relative overflow-hidden">
      <div className="grid-bg pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black_10%,transparent_65%)]" aria-hidden />
      <div className="container-site relative flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
        <p className="text-[7rem] font-semibold leading-none tracking-tighter text-gold drop-shadow-[0_2px_0_#232450] md:text-[10rem]">404</p>
        <h1 className="h2 mt-6">This page could not be found</h1>
        <p className="mt-4 max-w-lg text-lg text-muted">The link may be old, or the page may have moved. Try the homepage or get in touch.</p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Link href="/" className="inline-flex items-center gap-2 rounded-full bg-gold px-6 py-3.5 font-semibold text-navy">
            Go to the homepage <ArrowRight size={17} aria-hidden />
          </Link>
          <Link href="/contact-us" className="inline-flex items-center gap-2 rounded-full border border-line px-6 py-3.5 font-semibold">
            Contact
          </Link>
        </div>
      </div>
    </section>
  );
}
