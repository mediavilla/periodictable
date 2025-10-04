import { useRouter } from 'next/router';
import { TableProvider } from '../utils/TableProvider';
import '../styles/globals.css';

export default function App({ Component, pageProps }) {
  const { basePath } = useRouter();
  return (
    <div
      style={{
        '--icon-18': `url("${basePath}/images/icon-18.svg")`,
        '--icon-32': `url("${basePath}/images/icon-32.svg")`,
        '--icon-rt': `url("${basePath}/images/icon-RT.svg")`,
      }}
    >
      <TableProvider>
        <Component {...pageProps} />
      </TableProvider>
    </div>
  );
}