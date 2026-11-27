import type { Product } from '../src/types/store';

export const DIY_KIT_PRICE_INR = 199;
export const DIY_KIT_CATEGORY_ID = 'cat-diy-colouring-kits';
export const DIY_KIT_CATEGORY_IMAGE = '/brand/eramora/diy-kits/heart-beaded-trinket-dish.webp';
export const DIY_KIT_CATEGORY_DESCRIPTION =
  'Paint-your-own decorative blanks and small keepsakes for a personal colour project. Each listed DIY kit is ₹199. Material, dimensions, exact pieces supplied and whether paints or brushes are included must be confirmed with the ERAMORA concierge.';

interface DiyKitDefinition {
  id: string;
  slug: string;
  name: string;
  subtitle: string;
  design: string;
  description: string;
  image: string;
  sku: string;
}

export const DIY_KIT_CATALOGUE: readonly DiyKitDefinition[] = [
  {
    id: 'diy-rose-lid-jar-tray',
    slug: 'diy-rose-lid-jar-tray',
    name: 'DIY Colouring Kit — Rose-Lid Jar & Tray',
    subtitle: 'Paint-your-own decorative jar and tray design',
    design: 'Decorative jar with sculpted rose-style lid, companion faceted pot and tray as pictured',
    description: 'A white unpainted decorative jar with a sculpted rose-style lid, shown with a small faceted companion pot and tray. Personalise the pictured design with your own colour choices.',
    image: '/brand/eramora/diy-kits/rose-lid-jar-tray.webp',
    sku: 'ERA-DIY-001',
  },
  {
    id: 'diy-petal-edge-trinket-dish',
    slug: 'diy-petal-edge-trinket-dish',
    name: 'DIY Colouring Kit — Petal-Edge Trinket Dish',
    subtitle: 'A flower-inspired dish to colour your way',
    design: 'Round dish with raised petal-like scalloped rim',
    description: 'A round white unpainted dish with a raised petal-like rim. A small decorative surface for a DIY colour project and for keeping little keepsakes once finished.',
    image: '/brand/eramora/diy-kits/petal-edge-trinket-dish.jpg',
    sku: 'ERA-DIY-002',
  },
  {
    id: 'diy-heart-beaded-trinket-dish',
    slug: 'diy-heart-beaded-trinket-dish',
    name: 'DIY Colouring Kit — Heart Trinket Dish',
    subtitle: 'Heart-shaped dish with a beaded border',
    design: 'Heart-shaped shallow dish with raised rounded border',
    description: 'A white unpainted heart-shaped dish framed by a raised rounded, bead-style border. Add your own colours and use the finished piece as a small decorative trinket dish.',
    image: '/brand/eramora/diy-kits/heart-beaded-trinket-dish.webp',
    sku: 'ERA-DIY-003',
  },
  {
    id: 'diy-star-trinket-dish',
    slug: 'diy-star-trinket-dish',
    name: 'DIY Colouring Kit — Star Trinket Dish',
    subtitle: 'A five-point star dish ready for your colour ideas',
    design: 'Five-point star-shaped shallow dish',
    description: 'A white unpainted five-point star dish with a recessed centre. Make it your own with a colour design and use it as a small decorative catchall.',
    image: '/brand/eramora/diy-kits/star-trinket-dish.webp',
    sku: 'ERA-DIY-004',
  },
  {
    id: 'diy-fluted-mini-bowls',
    slug: 'diy-fluted-mini-bowls',
    name: 'DIY Colouring Kit — Fluted Mini Bowl',
    subtitle: 'A ribbed mini bowl for a creative colour project',
    design: 'Small round bowl with fluted sides and a textured rim',
    description: 'A white unpainted mini bowl with vertical fluting and a textured rim. The supplied photograph shows several matching bowls; confirm the exact number of pieces in each ₹199 kit with the concierge.',
    image: '/brand/eramora/diy-kits/fluted-mini-bowls.webp',
    sku: 'ERA-DIY-005',
  },
  {
    id: 'diy-floral-lid-storage-jars',
    slug: 'diy-floral-lid-storage-jars',
    name: 'DIY Colouring Kit — Floral-Lid Ribbed Jar',
    subtitle: 'Ribbed decorative jar with a sculpted floral top',
    design: 'Ribbed cylindrical jar with sculpted flower-style lid',
    description: 'A white unpainted ribbed jar with a sculpted floral lid, shown alongside a matching design. Add colour to the raised details and create a personalised decorative keepsake.',
    image: '/brand/eramora/diy-kits/floral-lid-jars.webp',
    sku: 'ERA-DIY-006',
  },
  {
    id: 'diy-shell-bowl-tray-set',
    slug: 'diy-shell-bowl-tray-set',
    name: 'DIY Colouring Kit — Shell Bowl & Tray',
    subtitle: 'A shell-inspired bowl with a decorative jar and tray',
    design: 'Shell-shaped bowl, rounded lidded jar and tray as pictured',
    description: 'A white unpainted shell-shaped bowl displayed with a rounded lidded jar and tray. A sculptural multi-piece look to personalise with your own colour palette. Confirm the exact kit contents before purchase.',
    image: '/brand/eramora/diy-kits/shell-bowl-tray-set.jpg',
    sku: 'ERA-DIY-007',
  },
  {
    id: 'diy-faceted-mini-pots',
    slug: 'diy-faceted-mini-pots',
    name: 'DIY Colouring Kit — Faceted Mini Pot',
    subtitle: 'Geometric mini pot with angular sides',
    design: 'Small faceted polygon pot',
    description: 'A white unpainted mini pot with crisp geometric facets. The photograph shows multiple matching pieces; ask the concierge to confirm the number of pots included in each ₹199 kit.',
    image: '/brand/eramora/diy-kits/faceted-mini-pots.jpg',
    sku: 'ERA-DIY-008',
  },
  {
    id: 'diy-flower-lid-jar-pair',
    slug: 'diy-flower-lid-jar-pair',
    name: 'DIY Colouring Kit — Flower-Lid Ribbed Jar',
    subtitle: 'Fluted jar with a sculpted flower-style lid',
    design: 'Ribbed round jar with a fan-shaped lid and sculpted flower detail',
    description: 'A white unpainted ribbed jar with a fan-shaped lid and raised flower detail. The supplied photo shows two designs together; confirm the exact pieces supplied in one kit with the concierge.',
    image: '/brand/eramora/diy-kits/flower-lid-ribbed-jars.jpg',
    sku: 'ERA-DIY-009',
  },
  {
    id: 'diy-vase-lotus-bowl-tray',
    slug: 'diy-vase-lotus-bowl-tray',
    name: 'DIY Colouring Kit — Vase & Lotus Bowl Tray',
    subtitle: 'A simple vase and lotus-style bowl display',
    design: 'Rounded-neck vase, lotus-style bowl and tray as pictured',
    description: 'A white unpainted rounded-neck vase displayed with a lotus-style bowl on a tray. Colour the sculpted forms to create a coordinated decorative display. Confirm the exact kit contents before purchase.',
    image: '/brand/eramora/diy-kits/vase-lotus-bowl-tray.webp',
    sku: 'ERA-DIY-010',
  },
  {
    id: 'diy-shell-trinket-dishes',
    slug: 'diy-shell-trinket-dishes',
    name: 'DIY Colouring Kit — Shell Trinket Dish',
    subtitle: 'Shell-shaped dishes with sculpted ridges',
    design: 'Shell-form shallow dish design',
    description: 'A white unpainted shell-form dish with sculpted ridges. The supplied photograph shows two matching shell shapes; confirm the exact quantity included in each kit with the concierge.',
    image: '/brand/eramora/diy-kits/shell-trinket-dishes.webp',
    sku: 'ERA-DIY-011',
  },
  {
    id: 'diy-embossed-keepsake-jars',
    slug: 'diy-embossed-keepsake-jars',
    name: 'DIY Colouring Kit — Embossed Keepsake Jar',
    subtitle: 'Decorative jar with raised ornamental detailing',
    design: 'Ornamented cylindrical jar with a shaped lid',
    description: 'A white unpainted decorative jar with raised ornamental detailing and a shaped lid. Use colour to bring out the sculpted pattern. Confirm the exact jar style and pack contents with the concierge.',
    image: '/brand/eramora/diy-kits/embossed-keepsake-jars.webp',
    sku: 'ERA-DIY-012',
  },
  {
    id: 'diy-scallop-lid-decorative-jar',
    slug: 'diy-scallop-lid-decorative-jar',
    name: 'DIY Colouring Kit — Scallop-Lid Decorative Jar',
    subtitle: 'Ribbed keepsake jar with a fan-shaped lid',
    design: 'Decorative jar with a scalloped, fan-shaped lid and raised details',
    description: 'A white unpainted decorative jar with a fan-shaped lid, ribbed edging and raised ornamental details. A paint-your-own keepsake design; ask the concierge to confirm the exact contents of the ₹199 kit.',
    image: '/brand/eramora/diy-kits/scallop-lid-decorative-jars.webp',
    sku: 'ERA-DIY-013',
  },
];

export function createDiyKitProducts(createdAt: string): Product[] {
  return DIY_KIT_CATALOGUE.map((kit) => ({
    id: kit.id,
    slug: kit.slug,
    name: kit.name,
    subtitle: kit.subtitle,
    categoryId: DIY_KIT_CATEGORY_ID,
    categoryName: 'DIY Colouring Kits',
    description: `${kit.description} Material, dimensions, care guidance and whether paints or brushes are included have not been specified in the supplied photos. Please confirm these details with the ERAMORA concierge before purchase.`,
    specifications: {
      Design: kit.design,
      Finish: 'Unpainted white, as pictured',
      Price: `₹${DIY_KIT_PRICE_INR} per kit`,
      'Material / dimensions': 'To be confirmed',
      'Included painting supplies': 'Confirm with the concierge',
    },
    ingredientsOrMaterials: '',
    images: [kit.image],
    variants: [{
      id: `var-${kit.id}`,
      label: 'DIY kit',
      size: 'As pictured',
      price: DIY_KIT_PRICE_INR,
      stock: 0,
      sku: kit.sku,
    }],
    badges: [],
    isShowcaseDemo: false,
    isFeatured: false,
    isBestseller: false,
    isNewArrival: false,
    isArchived: false,
    seoTitle: `${kit.name} | ERAMORA`,
    seoDescription: `${kit.subtitle}. ₹${DIY_KIT_PRICE_INR} per kit. Ask the ERAMORA WhatsApp concierge to confirm the material, dimensions and included painting supplies.`,
    ratingAverage: 0,
    reviewCount: 0,
    createdAt,
    updatedAt: createdAt,
  }));
}
