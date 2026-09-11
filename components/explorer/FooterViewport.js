import Footer from "../Footer";
import Link from "next/link";

const DEFAULT_CONTRIBUTION_LINKS = [
  { href: "/faq/", label: "FAQ" },
  { href: "/roadmap/", label: "Roadmap" },
  { href: "/feedback/", label: "Feedback" },
];

// Keep the original component and CSS intact. Its intrinsic three-column grid
// can exceed a narrow phone; contain that overflow instead of zooming the page.
export default function FooterViewport({ extraLinks = DEFAULT_CONTRIBUTION_LINKS }) {
  return (
    <div
      className="explorerFooterViewport"
      role="region"
      aria-label="Footer links"
      tabIndex={0}
    >
      <Footer />
      {extraLinks.length > 0 ? (
        <nav
          className="explorerContributionLinks"
          aria-label="Contribution pages"
        >
          {extraLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>
      ) : null}
    </div>
  );
}
