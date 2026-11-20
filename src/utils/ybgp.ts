/**
 * YBGP Canonical Brand Identity, Contact Details & URL Builders
 * Complies strictly with YBGP Branding, Contact Details & Website CTA Master Implementation Instructions.
 */

export const YBGP_CONFIG = {
  name: 'YBGP',
  fullName: 'YBGP Consulting',
  website: 'https://ybgp.in',
  instagram: 'https://www.instagram.com/ybgp.consulting/',
  instagramHandle: '@ybgp.consulting',
  email: 'ybgp.consulting@gmail.com',
  phoneDisplay: '+91 83681 43892',
  phoneTel: '+918368143892',
  whatsappRaw: '918368143892',
  whatsappBase: 'https://wa.me/918368143892',
  defaultProjectName: 'ERAMORA',
  logoPath: '/ybgp-logo.png',
  bannerHeadline: 'Looking to grow your business?',
  bannerSubline: 'Designed and developed by YBGP',
} as const;

/**
 * Builds the canonical YBGP WhatsApp project enquiry URL using the exact required template:
 * "Hey YBGP, I'm interested in your [PROJECT NAME] project and I want something like this for my business too. Can I get more information about it?"
 */
export function buildYbgpProjectEnquiryUrl(projectName: string = YBGP_CONFIG.defaultProjectName): string {
  const safeName = (projectName || YBGP_CONFIG.defaultProjectName).trim();
  const message = `Hey YBGP, I'm interested in your ${safeName} project and I want something like this for my business too. Can I get more information about it?`;
  return `https://wa.me/${YBGP_CONFIG.whatsappRaw}?text=${encodeURIComponent(message)}`;
}
