import { useEffect, useState, useContext } from 'react';
import { useRouter } from 'next/router';
import fetchElement from '../utils/fetchElement';
import { TableProvider, TableContext } from '../utils/TableProvider';
import '../styles/globals.css';

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const { currentElement, setCurrentElement } = useContext(TableContext);

  useEffect(() => {
    if (router.isReady) {
      // Get the path (which should be the element name in your case) from the router object
      const elementName = router.pathname.split('/')[1];

      // Fetch the element data
      const currentElementData = fetchElement(elementName);

      // Update the currentElement state
      setCurrentElement(currentElementData);
    }
  }, [router.pathname]);

  return (
    <TableProvider>
      <Component {...pageProps} />
    </TableProvider>
  );
}
