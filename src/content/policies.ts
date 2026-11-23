export const LEGAL_POLICIES = {
  shipping:
    'Delivery serviceability, dispatch timing, delivery charges, and any applicable conditions are confirmed directly for each enquiry. Contact the ERAMORA concierge with your destination and selected items. A WhatsApp enquiry does not confirm an order or delivery arrangement.',
  returns:
    'Return, cancellation, and refund terms depend on the product and the confirmed transaction. Please request the applicable terms from the ERAMORA concierge before confirming a purchase. For an issue with a confirmed purchase, contact ERAMORA using the contact details on this website so the request can be reviewed.',
  privacy:
    'This website does not create customer accounts or store customer orders, payment details, delivery addresses, reviews, or contact enquiries. Your shopping bag, wishlist, recently viewed products, and gift preferences may be stored in this browser. Administrator account records are kept in the store database only to secure catalogue management, and the administrator sign-in uses a session cookie. If you choose to contact ERAMORA through WhatsApp, the information you send is handled by WhatsApp and ERAMORA for that conversation. Cloudflare processes technical and security information to operate and protect this website; rate-limit counters use a one-way hash of an IP address and endpoint. This website does not intentionally set analytics or advertising cookies.',
  terms:
    'Items identified as demo or sample concepts are for catalogue presentation only and are not for sale. Product details, availability, and any displayed prices for other items must be confirmed by ERAMORA before purchase. This website does not accept or confirm orders or payments. Opening WhatsApp or sending a message is an enquiry only; no purchase, price, delivery, or availability is confirmed until ERAMORA confirms it directly. Applicable transaction terms will be provided before a purchase is confirmed.',
} as const;

export const GRIEVANCE_CONTACT = {
  operatorName: 'Alka Jain',
  address: 'Sector 20, Noida',
  officerName: 'Alka Jain',
  officerDesignation: 'Owner',
  email: 'eramora.in@gmail.com',
  phone: '+918368143892',
} as const;

export type LegalPolicyKind = keyof typeof LEGAL_POLICIES;
