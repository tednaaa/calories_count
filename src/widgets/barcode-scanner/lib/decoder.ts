export type Decoder = (frame: ImageData) => Promise<string | undefined>;

const FORMATS = ['ean_13', 'ean_8', 'upc_a', 'upc_e'] as const;

interface DetectorApi {
  new (options: { formats: readonly string[] }): { detect: (source: ImageData) => Promise<{ rawValue: string }[]> };
}

function nativeDetector(): Decoder | undefined {
  const Detector = (globalThis as { BarcodeDetector?: DetectorApi }).BarcodeDetector;

  if (!Detector) {
    return undefined;
  }

  const detector = new Detector({ formats: FORMATS });

  return async frame => (await detector.detect(frame))[0]?.rawValue;
}

async function wasmDecoder(): Promise<Decoder> {
  const [{ prepareZXingModule, readBarcodes }, { default: wasmUrl }] = await Promise.all([
    import('zxing-wasm/reader'),
    import('zxing-wasm/reader/zxing_reader.wasm?url'),
  ]);

  prepareZXingModule({ overrides: { locateFile: () => wasmUrl } });

  return async (frame) => {
    const found = await readBarcodes(frame, { formats: ['EAN-13', 'EAN-8', 'UPC-A', 'UPC-E'] });

    return found.find(result => result.isValid)?.text;
  };
}

export function createDecoder(): Promise<Decoder> {
  const native = nativeDetector();

  return native ? Promise.resolve(native) : wasmDecoder();
}
