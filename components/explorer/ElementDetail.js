import { useState } from "react";
import { useRouter } from "next/router";
import { assetPath } from "../../utils/assetPath";
import { getElementContent } from "../../data/element-content";
import BohrViewport from "./BohrViewport";
import styles from "./ElementDetail.module.css";

function SourceLink({ source }) {
  return source?.url ? (
    <a
      className={styles.sourceLink}
      href={source.url}
      target="_blank"
      rel="noreferrer"
    >
      {source.title} <span aria-hidden="true">↗</span>
    </a>
  ) : null;
}

function ImageBlock({ block }) {
  const { basePath } = useRouter();
  const [failed, setFailed] = useState(false);
  return (
    <figure className={`${styles.card} ${styles.imageCard}`}>
      {failed ? (
        <div className={styles.imageFallback}>
          Image unavailable. <a href={block.source}>View it at the source ↗</a>
        </div>
      ) : (
        // Native lazy loading preserves static export and avoids a second image server.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={assetPath(block.src, basePath)}
          alt={block.alt}
          loading="lazy"
          decoding="async"
          width="800"
          height="600"
          onError={() => setFailed(true)}
        />
      )}
      <figcaption>
        <h3>{block.title}</h3>
        <p>{block.caption}</p>
        <a
          className={styles.credit}
          href={block.source}
          target="_blank"
          rel="noreferrer"
        >
          Image: {block.credit} ↗
        </a>
      </figcaption>
    </figure>
  );
}

function VideoBlock({ block }) {
  const [playing, setPlaying] = useState(false);
  return (
    <section className={`${styles.card} ${styles.videoCard}`}>
      <h3>{block.title}</h3>
      {playing ? (
        <video
          controls
          playsInline
          preload="metadata"
          src={block.src}
          poster={block.poster}
          aria-label={block.title}
        >
          {block.captions && (
            <track
              kind="captions"
              src={block.captions}
              srcLang="en"
              label="English"
              default
            />
          )}
        </video>
      ) : (
        <button
          type="button"
          className={styles.mediaButton}
          onClick={() => setPlaying(true)}
        >
          Play video <span aria-hidden="true">↗</span>
        </button>
      )}
      <p>{block.caption}</p>
      <SourceLink source={block.source} />
    </section>
  );
}

function BondComparison({ block }) {
  const [choiceId, setChoiceId] = useState(block.choices[0].id);
  const choice =
    block.choices.find((item) => item.id === choiceId) || block.choices[0];
  const point = ([x, y]) => [160 + x * 85, 125 + y * 85];
  return (
    <section className={`${styles.card} ${styles.comparisonCard}`}>
      <span className={styles.cardEyebrow}>Same atom, different material</span>
      <h3>{block.title}</h3>
      <div
        className={styles.switches}
        role="group"
        aria-label="Carbon structure"
      >
        {block.choices.map((item) => (
          <button
            type="button"
            key={item.id}
            aria-pressed={item.id === choiceId}
            onClick={() => setChoiceId(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <svg
        className={styles.bondDiagram}
        viewBox="0 0 320 250"
        role="img"
        aria-label={choice.caption}
      >
        {choice.edges.map(([from, to], index) => {
          const [x1, y1] = point(choice.nodes[from]);
          const [x2, y2] = point(choice.nodes[to]);
          return (
            <line
              key={index}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="currentColor"
              strokeWidth="5"
              strokeDasharray={
                choice.id === "diamond" && index === 3 ? "5 5" : undefined
              }
            />
          );
        })}
        {choice.nodes.map((node, index) => {
          const [cx, cy] = point(node);
          return (
            <g key={index}>
              <circle cx={cx} cy={cy} r="15" fill="#171717" />
              <text
                x={cx}
                y={cy + 5}
                textAnchor="middle"
                fill="white"
                fontSize="13"
                fontFamily="Geist, sans-serif"
              >
                C
              </text>
            </g>
          );
        })}
      </svg>
      <p aria-live="polite">{choice.body}</p>
      <p className={styles.note}>{choice.caption}</p>
      <SourceLink source={block.source} />
    </section>
  );
}

function ContentBlock({ block, element }) {
  switch (block.type) {
    case "image":
      return <ImageBlock block={block} />;
    case "video":
      return <VideoBlock block={block} />;
    case "facts":
      return (
        <section className={`${styles.card} ${styles.factsCard}`}>
          <span className={styles.cardEyebrow}>Properties</span>
          <h3>{block.title}</h3>
          <dl className={styles.facts}>
            {block.items.map((item) => (
              <div key={item.label}>
                <dt>{item.label}</dt>
                <dd>{item.value}</dd>
              </div>
            ))}
          </dl>
          <p className={styles.note}>
            Conditions and isotopes affect measured properties. Some properties
            of short-lived elements are predicted. Electronegativity uses the
            Pauling scale.
          </p>
        </section>
      );
    case "visualization":
      if (block.visualization === "bond-comparison")
        return <BondComparison block={block} />;
      if (block.visualization === "bohr")
        return (
          <section className={`${styles.card} ${styles.bohrCard}`}>
            <span className={styles.cardEyebrow}>Electronic structure</span>
            <h3>{block.title}</h3>
            <BohrViewport element={element} />
            <p className={styles.shells}>
              {element.shells?.join(" · ") || "Unavailable"}{" "}
              <span>electrons by shell</span>
            </p>
            <p className={styles.note}>
              A stylized shell model. Electrons are quantum objects, not
              particles following these literal paths. Sizes and motion are
              illustrative.
            </p>
          </section>
        );
      return null;
    case "text":
      return (
        <section
          className={`${styles.card} ${block.accent ? styles.accentCard : ""}`}
        >
          <h3>{block.title}</h3>
          <p className={block.monospace ? styles.configuration : undefined}>
            {block.body}
          </p>
          {block.note && <p className={styles.note}>{block.note}</p>}
          <SourceLink source={block.source} />
        </section>
      );
    default:
      return null;
  }
}

export default function ElementDetail({ element, compact = false }) {
  if (!element)
    return (
      <p className={styles.empty}>Choose an element to explore its story.</p>
    );
  const content = getElementContent(element);
  const Title = compact ? "h2" : "h1";
  return (
    <article
      className={`${styles.detail} ${compact ? styles.compact : ""}`}
      aria-label={`${element.name} details`}
    >
      <header className={styles.hero}>
        <div
          className={styles.identity}
          aria-label={`Element ${element.number}, ${element.symbol}`}
        >
          <span className={styles.number}>{element.number}</span>
          <span className={styles.symbol}>{element.symbol}</span>
          <span className={styles.mass}>
            {element.atomic_mass ?? "Unavailable"}
          </span>
        </div>
        <div className={styles.introduction}>
          <span className={styles.eyebrow}>{content.eyebrow}</span>
          <Title>{element.name}</Title>
          <p>{content.summary}</p>
          <span className={styles.category}>{element.category}</span>
        </div>
      </header>
      <div className={styles.grid}>
        {content.blocks.map((block) => (
          <ContentBlock
            key={`${element.number}-${block.id}`}
            block={block}
            element={element}
          />
        ))}
      </div>
      <section className={styles.sources} aria-label="Element sources">
        <h3>Keep exploring</h3>
        <p>
          Explore the stories, imagery, and reference data in more depth.
          Properties with no value in the reference are marked unavailable.
        </p>
        <div>
          {content.sources.map((source) => (
            <SourceLink key={source.url} source={source} />
          ))}
        </div>
      </section>
    </article>
  );
}
