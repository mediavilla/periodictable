import Footer from "../Footer";

// Keep the original component and CSS intact. Its intrinsic three-column grid
// can exceed a narrow phone; contain that overflow instead of zooming the page.
export default function FooterViewport() {
  return (
    <div
      className="explorerFooterViewport"
      role="region"
      aria-label="Footer links"
      tabIndex={0}
    >
      <Footer />
    </div>
  );
}
