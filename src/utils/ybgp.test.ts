import test from 'node:test';
import assert from 'node:assert/strict';
import { YBGP_CONFIG, buildYbgpProjectEnquiryUrl } from './ybgp';

test('YBGP_CONFIG contains canonical company details', () => {
  assert.equal(YBGP_CONFIG.website, 'https://ybgp.in');
  assert.equal(YBGP_CONFIG.email, 'ybgp.consulting@gmail.com');
  assert.equal(YBGP_CONFIG.phoneDisplay, '+91 83681 43892');
  assert.equal(YBGP_CONFIG.phoneTel, '+918368143892');
  assert.equal(YBGP_CONFIG.instagram, 'https://www.instagram.com/ybgp.consulting/');
  assert.equal(YBGP_CONFIG.instagramHandle, '@ybgp.consulting');
  assert.equal(YBGP_CONFIG.whatsappRaw, '918368143892');
  assert.equal(YBGP_CONFIG.whatsappBase, 'https://wa.me/918368143892');
  assert.equal(YBGP_CONFIG.defaultProjectName, 'ERAMORA');
});

test('buildYbgpProjectEnquiryUrl generates correct WhatsApp URL for ERAMORA', () => {
  const url = buildYbgpProjectEnquiryUrl();
  const expectedText =
    "Hey YBGP, I'm interested in your ERAMORA project and I want something like this for my business too. Can I get more information about it?";
  const expectedUrl = `https://wa.me/918368143892?text=${encodeURIComponent(expectedText)}`;

  assert.equal(url, expectedUrl);
  assert.ok(url.startsWith('https://wa.me/918368143892?text='));
  assert.ok(!url.includes('*'));
  assert.ok(!url.includes('[PROJECT NAME]'));
  assert.ok(url.includes('ERAMORA'));
});

test('buildYbgpProjectEnquiryUrl handles custom or fallback project names safely', () => {
  const customUrl = buildYbgpProjectEnquiryUrl('Atelier Fragrance Demo');
  assert.ok(customUrl.includes(encodeURIComponent('Atelier Fragrance Demo')));

  // Empty string fallback to default project name
  const emptyUrl = buildYbgpProjectEnquiryUrl('');
  assert.ok(emptyUrl.includes('ERAMORA'));
});
