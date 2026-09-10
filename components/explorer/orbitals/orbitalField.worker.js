import { buildOrbitalField } from './orbitalField.mjs';

// The consumer keeps one request running and one latest request queued. Each
// generation is echoed so a completed stale request can be discarded safely.
self.onmessage = ({ data: { generation, ...options } }) => {
  try {
    const field = buildOrbitalField(options);
    self.postMessage({ generation, field }, field.grids.map(({ data }) => data.buffer));
  } catch (error) {
    self.postMessage({ generation, error: error instanceof Error ? error.message : 'Unable to generate the orbital field.' });
  }
};
