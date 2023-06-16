import { TableProvider } from '../utils/TableProvider';
import '../styles/globals.css';

export default function App({ Component, pageProps }) {

  return (
    <TableProvider>
      <Component {...pageProps} />
    </TableProvider>
  );
}
