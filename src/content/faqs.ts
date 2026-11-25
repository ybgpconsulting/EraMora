export interface FaqEntry {
  question: string;
  answer: string;
}

export const ERAMORA_FAQS: readonly FaqEntry[] = [
  {
    question: 'How do WhatsApp enquiries work at ERAMORA?',
    answer:
      'You can send a product or bag enquiry to our concierge through WhatsApp. The team will confirm product details, availability, pricing, delivery, and payment steps directly. Sending a message does not place or confirm a purchase.',
  },
  {
    question: 'Which Indian cities do you deliver to?',
    answer:
      'Delivery availability and estimated timing are confirmed during your enquiry. Contact our WhatsApp concierge with the destination and selected product for location-specific assistance.',
  },
  {
    question: 'What payment methods are accepted?',
    answer:
      'Our concierge confirms availability, delivery charges, and payment options with you directly on WhatsApp before your order is confirmed.',
  },
  {
    question: 'Do you offer custom gift wrapping and personal notes?',
    answer:
      'You can ask the concierge about gift presentation and share a note with your enquiry. Options and availability are confirmed directly and are not guaranteed by this website.',
  },
];
