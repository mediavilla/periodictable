import Head from 'next/head';
import elements from '../public/elements.json';
import ElementsGrid from '../components/ElementsGrid';



export default function Home() {
  return (
    <>
      <Head>
        <title>Create Next App</title>
        <meta name="description" content="The evolution of the periodic table and disovery of each element" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main>
        <ElementsGrid elements={elements} />
      </main>
    </>
  )
}
