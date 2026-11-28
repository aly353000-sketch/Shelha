import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSinglePageA4Pdf } from './pdfBuilder';

test('buildSinglePageA4Pdf emits valid PDF 1.4 header, exact A4 MediaBox, xref, and EOF', () => {
  // Minimal mock JPEG payload bytes
  const mockJpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0xff, 0xd9]);
  const pdfBytes = buildSinglePageA4Pdf(mockJpeg, 2480, 3508);
  const text = new TextDecoder('latin1').decode(pdfBytes);

  assert.ok(text.startsWith('%PDF-1.4\n'), 'Must start with PDF 1.4 header');
  assert.ok(
    text.includes('/MediaBox [0 0 595.28 841.89]'),
    'Must declare exact A4 portrait MediaBox in points (210x297mm)'
  );
  assert.ok(text.includes('/Width 2480 /Height 3508'), 'Must embed 300-DPI A4 dimensions');
  assert.ok(text.includes('/Filter /DCTDecode'), 'Must use DCTDecode JPEG stream');
  assert.ok(text.includes('xref\n0 6\n'), 'Must contain 6-entry xref table');
  assert.ok(text.trimEnd().endsWith('%%EOF'), 'Must terminate with %%EOF');

  // Verify xref byte offset actually points to "1 0 obj"
  const obj1Match = text.match(/0000000000 65535 f \n(\d{10}) 00000 n/);
  assert.ok(obj1Match, 'Must have valid xref entry for object 1');
  const obj1Offset = Number(obj1Match[1]);
  assert.equal(text.slice(obj1Offset, obj1Offset + 7), '1 0 obj');
});
