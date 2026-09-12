import Head from "next/head";
import Link from "next/link";
import { SquareArrowOutUpRight } from "lucide-react";
import ExplorerNavigation from "../components/explorer/ExplorerNavigation";
import FooterViewport from "../components/explorer/FooterViewport";
import styles from "../styles/placeholder-page.module.css";

const description =
  "The periodic table is an incredible achievement. It helps us understand ourselves, the world around us and the universe.";

export default function About() {
  return (
    <>
      <Head>
        <title>About · Explore the periodic table</title>
        <meta name="description" content={description} />
      </Head>
      <main className={`explorerPage ${styles.page}`}>
        <ExplorerNavigation />
        <article className={styles.content}>
          <h1>About</h1>
          <p className={styles.description}><strong>{description}</strong></p>
          <p className={styles.description}><strong>
            This website is a tribute to the periodic table as an artefact:
            something that has been built, grown and iterated on for more than
            200 years, consolidating the work of hundreds of people. Scientists,
            innovators and contributors who discovered elements, pushed past the
            limits of what seemed possible and found a way to turn all of it
            into a simple system that works for everyone and will be used for
            generations to come.</strong>
          </p>
          <div className={styles.body}>
            <h2>How it started</h2>
            <p>
              Back in 2019 I came across a <Link href="https://www.youtube.com/watch?v=n_KyYFYNvpI" className={styles.textLink} target="_blank" rel="noopener noreferrer">video <SquareArrowOutUpRight aria-hidden="true" /></Link>  of <Link href="https://en.wikipedia.org/wiki/Brian_Cox_(physicist)" className={styles.textLink} target="_blank" rel="noopener noreferrer">Professor Brian Cox <SquareArrowOutUpRight aria-hidden="true" /></Link>, 
               explaining how the 92 naturally occurring elements are the
              building blocks of everything we can see in the universe. Obviously, I didn't pay any attention in science class, and didn't spend any time thinking about it until that moment. I thought it was pretty sick that
              basically everything is made of these basic building blocks, and I started learning more about the elements
              and the table itself.
            </p>
            <p>
            The other thing that got me is that the periodic table isn&apos;t
              finished<sup className={styles.footnoteMark}>(<a href="#unfinished-note" id="unfinished-ref" className={styles.footnoteLink} aria-label="Note: why the periodic table isn't finished">*</a>)</sup>. It&apos;s been
              evolving alongside our understanding of the world for two
              centuries, and in that process it has kept changing shape.
              Lavoisier&apos;s list of 33 elements in 1789. <Link href="/timeline/?design=dobereiner" className={styles.textLink}>Döbereiner&apos;s
              triads</Link>. Newlands&apos; octaves. <Link href="/timeline/?design=mendeleev" className={styles.textLink}>Mendeleev&apos;s table</Link> with gaps
              left for elements nobody had found yet. Moseley reordering
              everything by atomic number. And that&apos;s just the science.
              Along the way, chemists, designers and enthusiasts have drawn the
              table as <Link href="/?design=benfey" className={styles.textLink}>spirals</Link>, <Link href="/timeline/?design=telluric" className={styles.textLink}>towers</Link> and <Link href="/timeline/?design=giguere" className={styles.textLink}>3D shapes</Link>, showing that
              creativity and science can go hand in hand.
            </p>
            <p>
              I did a lot of research online and couldn&apos;t find a truly
              interactive site where you could explore how the table has evolved
              and dig into the elements themselves, things like electron
              configuration, while browsing through the history at the same
              time. So the idea of building it myself started to form.
            </p>
            <p>
              I also read a lot of books about the elements. Two that really
              stood out are <em>The Disappearing Spoon</em> by Sam Kean and{" "}
              <em>Elemental</em> by Tim James. They inspired me to take the
              project forward, and I started learning <Link href="https://react.dev/" className={styles.textLink} target="_blank" rel="noopener noreferrer">React</Link> and <Link href="https://threejs.org/" className={styles.textLink} target="_blank" rel="noopener noreferrer">Three.js</Link> to
              build the site. Then Covid happened, other priorities took over,
              and I parked the idea... for a long time.
            </p>
            <h2>Building it (twice)</h2>
            <p>
            When <Link href="https://openai.com/index/chatgpt/" className={styles.textLink} target="_blank" rel="noopener noreferrer">ChatGPT came out<SquareArrowOutUpRight aria-hidden="true" /></Link> in late 2022 I started playing around with it but it wasn&apos;t good enough to
            take on a project like this. On 2 April 2023 I made the first commit for this project on
              GitHub. I built lots of things I never thought I&apos;d be able
              to, like a JavaScript function that generates electron orbitals.
              But I was working on it in my spare time, which wasn&apos;t much,
              and at some point I realised there was so much left to do that I
              started to wear down. I parked it again.
            </p>
            <p>
              However, in September 2026 OpenAI released <Link href="https://openai.com/index/gpt-6-astra/" className={styles.textLink} target="_blank" rel="noopener noreferrer">GPT-6 Astra<SquareArrowOutUpRight aria-hidden="true" /></Link>, so I gave it my old project and wrote a long prompt asking it to finish
              it. Two hours later the site was pretty much done. It wasn&apos;t
              great, it wasn&apos;t perfect, but it was 80% there. I spent the
              next few days tweaking the things that mattered most to me and
              decided to make it public.
            </p>
            <h2>What&apos;s next</h2>
            <p>
              I&apos;ll keep growing the site over time, and I&apos;d love your <Link href="/sponsor/" className={styles.textLink} >feedback</Link>
              , suggestions and comments to help me prioritise the
              features that would be most useful to you and others.
            </p>
            <p>
              I&apos;m also  <Link href="/sponsor/" className={styles.textLink} >looking for sponsors</Link> interested in supporting the
              site so I can keep adding more table designs, new features, and a
              shop with merch for nerds to help keep my motivation up.
            </p>
            <p>If you&apos;ve got any of the above, <Link href="/contact/" className={styles.textLink} >get in touch</Link>. Anyway, thanks for visiting, I hope you enjoy the site!</p>
            <p>Cheers,</p>
            <p>
              <Link
                href="https://mediavilla.design"
                className={styles.textLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                Juan <SquareArrowOutUpRight aria-hidden="true" />
              </Link>
            </p>
            <p className={styles.wideGap}>
              <Link href="/contact/" className={styles.cta}>
                Get in touch
              </Link>
            </p>
            <section
              id="unfinished-note"
              className={styles.footnotes}
              aria-labelledby="unfinished-note-title"
            >
              <h2 id="unfinished-note-title">
                <a href="#unfinished-ref" className={styles.footnoteLink}>
                  *
                </a>{" "}
                Why the table isn&apos;t finished
              </h2>
              <ul>
                <li>
                  <strong>New elements</strong>. Labs in Japan (RIKEN), Russia, Germany, China
                  and the US are actively trying to make elements 119 and 120,
                  which would start an eighth row. As of this year nobody has
                  confirmed either, and articles from May 2026 still describe
                  119 as unmade.
                </li>
                <li>
                  <strong>Layout arguments</strong>. <Link href="https://iupac.org/" className={styles.textLink} target="_blank" rel="noopener noreferrer">IUPAC <SquareArrowOutUpRight aria-hidden="true" /></Link> still hasn&apos;t settled which
                  elements belong in group 3 (lanthanum/actinium vs
                  lutetium/lawrencium), and where hydrogen and helium should sit
                  is a long-running debate. Different published tables genuinely
                  disagree on this.
                </li>
                <li>
                  <strong>Whether periodicity holds at the top end</strong>. Relativistic effects
                  in superheavy atoms mean oganesson probably isn&apos;t a noble
                  gas in any useful sense, which raises the question of whether
                  the pattern the table is built on keeps working beyond row 7.
                </li>
              </ul>
            </section>
          </div>
        </article>
      </main>
      <FooterViewport />
    </>
  );
}
