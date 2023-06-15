import { useEffect, useState, useContext } from 'react';
import { useRouter } from 'next/router';
import fetchElement from '../utils/fetchElement';
import { TableProvider, TableContext } from '../utils/TableProvider';
import '../styles/globals.css';

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const { currentElement, setCurrentElement } = useContext(TableContext);


  useEffect(() => {
    const fetchData = async () => {
      if (router.isReady) {
        const elementName = router.pathname.split('/')[1];
        const currentElementData = await fetchElement(elementName);
        setCurrentElement(currentElementData);
        console.log("CURRENT ELEMENT DATA: ", currentElementData);
      }
    };
    fetchData();
  }, [router.pathname]);

  useEffect(() => {
    console.log("Updated currentElement: ", currentElement);
  }, [currentElement]);


  return (
    <TableProvider>
      <Component {...pageProps} />
    </TableProvider>
  );
}
