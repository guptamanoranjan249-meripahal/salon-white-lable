import { Service, Booking, Review, Artisan, Shop, WithdrawRequest, Transaction, StaffMember, CustomerData } from './types';

export const PREMIUM_SERVICES: Service[] = [
  {
    id: 'haircut',
    name: 'Precision Haircut & Styling',
    category: 'Hair & Styling',
    price: 1800,
    duration: 75,
    description: 'Expert haircut tailored to your face shape, finished with a gentle hair wash, nourishing hair mask, and clean blow-dry style.',
    image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=600',
    features: ['Scalp check & consultation', 'Relaxing hair wash', 'Blow-dry styling', 'Finishing serum']
  },
  {
    id: 'coloring',
    name: 'Global Hair Color & Gloss',
    category: 'Hair & Styling',
    price: 6500,
    duration: 150,
    description: 'Professional hair coloring and balayage treatment with rich tone depth. Includes bond protection and shine gloss finish.',
    image: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&q=80&w=600',
    features: ['Custom shade matching', 'Hair bond protection', 'Shine gloss finish', 'Post-color nourishment']
  },
  {
    id: 'manicure',
    name: 'Classic Manicure & Hand Care',
    category: 'Skin & Facials',
    price: 1200,
    duration: 45,
    description: 'Refreshing hand therapy involving herbal scrub, hydration mask, nail shaping, cuticle care, and clean gel polish.',
    image: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&q=80&w=600',
    features: ['Hand scrub & hydration', 'Cuticle care & shaping', 'Relaxing hand massage', 'Long-lasting gel polish']
  },
  {
    id: 'spa',
    name: 'Relaxing Head Spa & Scalp Therapy',
    category: 'Skin & Facials',
    price: 2500,
    duration: 60,
    description: 'Decompressing scalp hydro-spa featuring soothing steam mist, tea tree oil cleanse, hair therapy, and neck massage.',
    image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=600',
    features: ['Soothing herbal steam', 'Deep clarifying wash', 'Aromatherapy relaxation', 'Neck and shoulder massage']
  },
  {
    id: 'bridal',
    name: 'Bridal & Reception Makeup & Hair',
    category: 'Bridal & Makeup',
    price: 22000,
    duration: 180,
    description: 'Complete wedding hair styling and professional makeup look with trial session and dedicated dressing assistance.',
    image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=600',
    features: ['Pre-wedding styling trial', 'Dressing & veil support', 'Long-lasting setting spray', 'Assistance throughout']
  },
  {
    id: 'barber',
    name: 'Signature Shave & Beard Styling',
    category: 'Groom Shave & Beard Styling',
    price: 900,
    duration: 50,
    description: 'Traditional hot towel shave using smooth razor technique, nourishing sandalwood cream, and face massage.',
    image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=600',
    features: ['Warm hot towel wrap', 'Precision razor shave', 'Cooling aftershave balm', 'Beard trimming & shaping']
  },
  // JAIPUR FESTIVE SPECIALS
  {
    id: 'jaipur-festive-radiance',
    name: 'Jaipur Festive Glow & Scalp Spa',
    category: 'Seasonal',
    price: 3800,
    originalPrice: 5200,
    duration: 135,
    description: 'Our special festival package combining precision haircut, relaxing head spa, and glossy hair treatment for glowing festive looks.',
    image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=700',
    features: [
      'Full precision haircut & blow-dry',
      'Herbal steam scalp therapy',
      'Gloss infusion & hair repair',
      'Complimentary herbal tea & VIP styling room'
    ],
    isSeasonal: true,
    seasonalTag: 'Seasonal',
    seasonalLabel: 'Jaipur Festive Special',
    validUntil: 'Nov 15, 2026'
  },
  {
    id: 'jaipur-bridal-glow',
    name: 'Royal Rajasthani Bridal Balayage & Silk Mask',
    category: 'Seasonal',
    price: 7500,
    originalPrice: 9500,
    duration: 180,
    description: 'Exclusive festive package combining custom balayage with silk protein hair repair, perfect for weddings and major festivals.',
    image: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&q=80&w=700',
    features: [
      'Dimensional festive balayage highlights',
      'Deep silk protein hair mask',
      'Relaxing scalp massage',
      'Take-home hair care sample kit'
    ],
    isSeasonal: true,
    seasonalTag: 'Seasonal',
    seasonalLabel: 'Bridal Festive Curation',
    validUntil: 'Nov 30, 2026'
  },
  {
    id: 'jaipur-pamper-retreat',
    name: 'Complete Head-to-Toe Relaxation Retreat',
    category: 'Seasonal',
    price: 3400,
    originalPrice: 4500,
    duration: 105,
    description: 'An all-inclusive relaxation package pairing our Classic Hand Ritual with the Head Scalp Spa in a private room.',
    image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=700',
    features: [
      'Hand care ritual & gel polish',
      'Scalp steam cleaning & massage',
      'Hand and shoulder relaxation',
      'Complimentary beverage or coffee'
    ],
    isSeasonal: true,
    seasonalTag: 'Seasonal',
    seasonalLabel: 'Festival Weekend Pamper',
    validUntil: 'Dec 01, 2026'
  }
];

export const TESTIMONIALS: Review[] = [
  {
    id: '1',
    name: 'Ananya Sharma',
    role: 'Fashion Blogger',
    content: 'Aura Studio is amazing! The balayage hair color turned out stunning and I received so many compliments during the wedding celebrations.',
    rating: 5,
    date: '2026-05-18',
    serviceId: 'coloring',
    serviceName: 'Global Hair Color & Gloss',
    serviceCategory: 'Hair & Styling',
    serviceDuration: 150,
    servicePrice: 6500,
    serviceTag: 'Global Balayage & Shine',
    verifiedTreatment: true
  },
  {
    id: '2',
    name: 'Vikram Malhotra',
    role: 'Entrepreneur',
    content: 'The signature shave and beard grooming session was super relaxing. Very professional stylists and clean environment.',
    rating: 5,
    date: '2026-05-24',
    serviceId: 'barber',
    serviceName: 'Signature Shave & Beard Styling',
    serviceCategory: 'Groom Shave & Beard Styling',
    serviceDuration: 50,
    servicePrice: 900,
    serviceTag: 'Hot Towel Shave',
    verifiedTreatment: true
  },
  {
    id: '3',
    name: 'Priya Sen',
    role: 'Software Architect',
    content: 'The head spa and hand manicure made my weekend stress disappear completely. Highly recommend to everyone in Jaipur!',
    rating: 5,
    date: '2026-05-29',
    serviceId: 'manicure',
    serviceName: 'Classic Manicure & Hand Care',
    serviceCategory: 'Skin & Facials',
    serviceDuration: 45,
    servicePrice: 1200,
    serviceTag: 'Hand Ritual & Scrub',
    verifiedTreatment: true
  }
];

export const GALLERY_ROWS = [
  [
    'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=400',
    'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&q=80&w=400',
    'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=400',
    'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&q=80&w=400'
  ],
  [
    'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=400',
    'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=400',
    'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&q=80&w=400',
    'https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6?auto=format&fit=crop&q=80&w=400'
  ],
  [
    'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&q=80&w=400',
    'https://images.unsplash.com/photo-1595425970377-c9703cf48b6d?auto=format&fit=crop&q=80&w=400',
    'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&q=80&w=400',
    'https://images.unsplash.com/photo-1521590832167-7bcbfea00f4d?auto=format&fit=crop&q=80&w=400'
  ]
];

// Seed standard mock bookings
export const SEED_BOOKINGS: Booking[] = [
  {
    id: 'AURA-8241',
    serviceId: 'coloring',
    serviceName: 'Global Hair Color & Gloss',
    price: 6500,
    date: new Date(Date.now() + 86400000 * 1).toISOString().split('T')[0], // tomorrow
    timeSlot: '11:00 AM',
    customerName: 'Aarav Patel',
    customerEmail: 'aarav.patel@gmail.com',
    customerPhone: '+91 98765 43210',
    notes: 'Looking for natural brown tones with caramel highlights.',
    status: 'Confirmed',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: 'AURA-3912',
    serviceId: 'haircut',
    serviceName: 'Precision Haircut & Styling',
    price: 1800,
    date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0], // day after tomorrow
    timeSlot: '02:00 PM',
    customerName: 'Rohan Gupta',
    customerEmail: 'rohan.gupta@outlook.com',
    customerPhone: '+91 98123 45678',
    notes: 'Keep top length neat with clean taper fade on sides.',
    status: 'Pending',
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString()
  },
  {
    id: 'AURA-7751',
    serviceId: 'bridal',
    serviceName: 'Bridal & Reception Makeup & Hair',
    price: 22000,
    date: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
    timeSlot: '09:00 AM',
    customerName: 'Neha Singh',
    customerEmail: 'neha.singh@yahoo.com',
    customerPhone: '+91 99001 12233',
    notes: 'Bridal trial appointment. Bringing traditional lehenga dupatta for matching.',
    status: 'Confirmed',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString()
  },
  {
    id: 'AURA-4428',
    serviceId: 'spa',
    serviceName: 'Relaxing Head Spa & Scalp Therapy',
    price: 2500,
    date: new Date(Date.now() - 86400000 * 1).toISOString().split('T')[0], // yesterday
    timeSlot: '04:00 PM',
    customerName: 'Kavita Iyer',
    customerEmail: 'kavita.iyer@gmail.com',
    customerPhone: '+91 97411 22334',
    notes: 'Prefers gentle scalp massage with eucalyptus essential oil.',
    status: 'Completed',
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString()
  },
  {
    id: 'AURA-1052',
    serviceId: 'manicure',
    serviceName: 'Classic Manicure & Hand Care',
    price: 1200,
    date: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    timeSlot: '10:00 AM',
    customerName: 'Ananya Roy',
    customerEmail: 'ananya.roy@gmail.com',
    customerPhone: '+91 98222 33445',
    notes: 'Nail shaping with nude gel polish.',
    status: 'Confirmed',
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString()
  }
];

export const TIME_SLOTS = [
  '09:00 AM',
  '10:00 AM',
  '11:00 AM',
  '12:00 PM',
  '01:00 PM',
  '02:00 PM',
  '03:00 PM',
  '04:00 PM',
  '05:00 PM',
  '06:00 PM'
];

export const MOCK_SHOPS: Shop[] = [
  {
    id: 'c-scheme',
    name: 'Aura Studio & Salon - C-Scheme',
    tagline: 'Your Neighborhood Sanctuary of Style',
    status: 'Active',
    ownerEmail: 'aarav@aura.in',
    subdomain: 'cscheme.aurastudio.in',
    category: 'Hair Salon',
    logoPlaceholder: 'AUR',
    backgroundImage: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=600',
    address: 'C-Scheme, Near Statue Circle, Jaipur • Phone: +91 98290 12345',
    balance: 48500,
    createdAt: '2026-01-10T10:00:00.000Z'
  },
  {
    id: 'malviya-nagar',
    name: 'Aura Studio & Salon - Malviya Nagar',
    tagline: 'Classic Shaves & Modern Tapers',
    status: 'Active',
    ownerEmail: 'priya@aura.in',
    subdomain: 'malviya.aurastudio.in',
    category: 'Barber Shop',
    logoPlaceholder: 'AUR',
    backgroundImage: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=600',
    address: 'Malviya Nagar, Near World Trade Park, Jaipur • Phone: +91 94140 54321',
    balance: 32000,
    createdAt: '2026-02-15T11:00:00.000Z'
  },
  {
    id: 'vaishali-nagar',
    name: 'Aura Studio & Salon - Vaishali Nagar',
    tagline: 'Bridal Care & Radiant Makeovers',
    status: 'Active',
    ownerEmail: 'rohan@aura.in',
    subdomain: 'vaishali.aurastudio.in',
    category: 'Beauty Parlour',
    logoPlaceholder: 'AUR',
    backgroundImage: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=600',
    address: 'Vaishali Nagar, Amrapali Circle, Jaipur • Phone: +91 97840 98765',
    balance: 74000,
    createdAt: '2026-03-01T09:30:00.000Z'
  }
];

export const MOCK_WITHDRAW_REQUESTS: WithdrawRequest[] = [
  {
    id: 'WR-101',
    shopId: 'c-scheme',
    shopName: 'Aura Studio & Salon - C-Scheme',
    amount: 15000,
    destination: 'HDFC Bank A/C ending in 4092 (IFSC: HDFC0001234)',
    status: 'Approved',
    createdAt: '2026-05-10T14:20:00.000Z'
  },
  {
    id: 'WR-102',
    shopId: 'malviya-nagar',
    shopName: 'Aura Studio & Salon - Malviya Nagar',
    amount: 8000,
    destination: 'ICICI Bank A/C ending in 8812 (IFSC: ICIC0005678)',
    status: 'Pending',
    createdAt: '2026-05-18T09:15:00.000Z'
  }
];

export const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: 'TXN-901',
    shopId: 'c-scheme',
    shopName: 'Aura Studio & Salon - C-Scheme',
    amount: 1800,
    type: 'Booking Deposit',
    status: 'Completed',
    createdAt: '2026-05-18T11:30:00.000Z'
  },
  {
    id: 'TXN-902',
    shopId: 'vaishali-nagar',
    shopName: 'Aura Studio & Salon - Vaishali Nagar',
    amount: 22000,
    type: 'Booking Deposit',
    status: 'Completed',
    createdAt: '2026-05-18T15:45:00.000Z'
  }
];

export const MOCK_STAFF: StaffMember[] = [
  {
    id: 'st-1',
    shopId: 'c-scheme',
    name: 'Aarav Sharma',
    role: 'Senior Hair Stylist',
    specialty: 'Precision Haircuts',
    rating: 4.9,
    isAvailable: true,
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=500'
  },
  {
    id: 'st-2',
    shopId: 'c-scheme',
    name: 'Priya Sen',
    role: 'Color Specialist',
    specialty: 'Global Hair Color',
    rating: 5.0,
    isAvailable: true,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=500'
  }
];

export const MOCK_CUSTOMERS: CustomerData[] = [
  {
    id: 'cust-1',
    shopId: 'c-scheme',
    name: 'Rohan Gupta',
    email: 'rohan.gupta@outlook.com',
    phone: '+91 98123 45678',
    lastBookingDate: '2026-05-10',
    totalSpend: 14500,
    status: 'Active',
    campaignCount: 2
  },
  {
    id: 'cust-2',
    shopId: 'c-scheme',
    name: 'Ananya Roy',
    email: 'ananya.roy@gmail.com',
    phone: '+91 98222 33445',
    lastBookingDate: '2026-05-14',
    totalSpend: 9800,
    status: 'Active',
    campaignCount: 1
  }
];

export const ARTISANS: Artisan[] = [
  {
    id: 'artisan-1',
    name: 'Aarav Sharma',
    role: 'Principal Hair Stylist & Director',
    specialty: 'Precision Haircuts & Layering',
    rating: 4.9,
    experience: '12+ Years',
    bio: 'Aarav has over 12 years of experience styling hair for top celebrities and fashion shows across Mumbai and Delhi. He specializes in modern cuts and effortless styling.',
    image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=500',
    instagram: '@aaravsharma_hair',
    accreditations: [
      'L\'Oréal Professional Expert Stylist',
      'Vidal Sassoon Academy Certified',
      'Top Stylist Award India 2024'
    ],
    workGallery: [
      {
        id: 'wg-101',
        title: 'Modern Layered Bob',
        category: 'Precision Cuts',
        image: 'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?auto=format&fit=crop&q=80&w=800',
        description: 'Clean layered cut with natural movement designed for everyday easy maintenance.',
        clientResult: 'Bouncy, lightweight hair texture with zero styling hassle.',
        tags: ['LayeredBob', 'PrecisionCut', 'EasyMaintenance']
      },
      {
        id: 'wg-102',
        title: 'Face-Framing Curtain Bangs',
        category: 'Precision Cuts',
        image: 'https://images.unsplash.com/photo-1521590832167-7bcbfea00f4d?auto=format&fit=crop&q=80&w=800',
        description: 'Soft feathered fringe framing cheekbones gracefully while preserving length.',
        clientResult: 'Flattering facial contouring requiring minimal daily blow-drying.',
        tags: ['CurtainBangs', 'SoftLayers', 'BespokeCut']
      },
      {
        id: 'wg-103',
        title: 'Glossy Party Blowout',
        category: 'Styling',
        image: 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&q=80&w=800',
        description: 'Smooth, mirror-shine bouncy waves created with professional thermal styling.',
        clientResult: 'Glossy red-carpet ready hair bounce lasting up to 48 hours.',
        tags: ['PartyBlowout', 'BouncyWaves', 'GlossFinish']
      },
      {
        id: 'wg-104',
        title: 'Sleek Straight Polish',
        category: 'Smoothing',
        image: 'https://images.unsplash.com/photo-1492106087820-71f1a00d2b11?auto=format&fit=crop&q=80&w=800',
        description: 'Anti-frizz smoothing finish with thermal protection and argan oil serum.',
        clientResult: 'Silky glass-like straight hair texture with maximum shine.',
        tags: ['SleekStraight', 'AntiFrizz', 'SilkyPolish']
      }
    ],
    specificExpertise: [
      {
        id: 'exp-101',
        serviceId: 'haircut',
        serviceName: 'Precision Haircut & Styling',
        category: 'Hair & Styling',
        masteryLevel: 'Senior Director (12+ yrs)',
        description: 'Aarav’s signature haircutting service focused on face shape enhancement and effortless maintenance.',
        techniques: [
          'Face proportion consultation',
          'Texturizing & weight reduction',
          'Scalp massage wash',
          'Professional blow-dry finish'
        ],
        startingPrice: 1800,
        durationMinutes: 75
      },
      {
        id: 'exp-102',
        serviceId: 'haircut',
        serviceName: 'Hair Makeover & Re-styling',
        category: 'Hair & Styling',
        masteryLevel: 'Master Stylist',
        description: 'Complete hair transformation tailored to your personal style, face shape, and hair type.',
        techniques: [
          'Full silhouette reshaping',
          'Volume boosting layers',
          'Split-end removal technique',
          'Styling guidance session'
        ],
        startingPrice: 2500,
        durationMinutes: 90
      },
      {
        id: 'exp-103',
        serviceId: 'spa',
        serviceName: 'Relaxing Head Spa & Scalp Therapy',
        category: 'Skin & Facials',
        masteryLevel: 'Certified Specialist',
        description: 'Nourishing scalp treatment combined with steam and stress-relief massage.',
        techniques: [
          'Scalp clarifying wash',
          'Aromatherapy steam therapy',
          'Relaxing neck & shoulder massage'
        ],
        startingPrice: 2500,
        durationMinutes: 60
      }
    ]
  },
  {
    id: 'artisan-2',
    name: 'Priya Sen',
    role: 'Master Colorist & Balayage Expert',
    specialty: 'Global Hair Color & Highlights',
    rating: 5.0,
    experience: '10+ Years',
    bio: 'Priya is an expert in hair coloring, global highlights, and balayage techniques. She ensures your hair stays healthy and shiny throughout any color transformation.',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=500',
    instagram: '@priyasen_color',
    accreditations: [
      'Wella Master Color Expert India',
      'Balayage Guild Certified Specialist',
      'Olaplex Ambassador Stylist'
    ],
    workGallery: [
      {
        id: 'wg-201',
        title: 'Warm Caramel Balayage',
        category: 'Balayage',
        image: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&q=80&w=800',
        description: 'Sun-kissed caramel ribbons blended seamlessly into dark brunette hair.',
        clientResult: 'Natural dimensional glow with easy grow-out maintenance.',
        tags: ['CaramelBalayage', 'SunKissed', 'Highlights']
      },
      {
        id: 'wg-202',
        title: 'Soft Honey Highlights',
        category: 'Highlights',
        image: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&q=80&w=800',
        description: 'Fine babylights creating luminous golden warmth across the crown.',
        clientResult: 'Brightened facial complexion with silky smooth hair shine.',
        tags: ['HoneyHighlights', 'Babylights', 'GlossTone']
      },
      {
        id: 'wg-203',
        title: 'Rich Chestnut Brown Melt',
        category: 'Global Color',
        image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=800',
        description: 'Deep glossy chestnut tone with rich mahogany undertones.',
        clientResult: 'Luxurious vibrant color reflection and enhanced hair softness.',
        tags: ['ChestnutBrown', 'GlobalColor', 'ShineGloss']
      },
      {
        id: 'wg-204',
        title: 'Ash Blonde Dimension',
        category: 'Balayage',
        image: 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&q=80&w=800',
        description: 'Cool ash blonde highlights protected with intensive bond-building treatment.',
        clientResult: 'Clean, modern tone with maintained hair strength and elasticity.',
        tags: ['AshBlonde', 'CoolTones', 'BondRepair']
      }
    ],
    specificExpertise: [
      {
        id: 'exp-201',
        serviceId: 'coloring',
        serviceName: 'Global Hair Color & Gloss',
        category: 'Hair & Styling',
        masteryLevel: 'Master Colorist (10+ yrs)',
        description: 'Priya’s acclaimed hair coloring protocol delivering vibrant, long-lasting shades with healthy shine.',
        techniques: [
          'Custom color mixing & testing',
          'Root touch-up & gray coverage',
          'Active bond protection treatment',
          'Gloss seal for mirror shine'
        ],
        startingPrice: 6500,
        durationMinutes: 150
      },
      {
        id: 'exp-202',
        serviceId: 'coloring',
        serviceName: 'Gloss Refresh & Toning',
        category: 'Hair & Styling',
        masteryLevel: 'Senior Specialist',
        description: 'Quick color refresh to remove unwanted brassy tones and restore vibrant shine.',
        techniques: [
          'Tone correction glaze',
          'Hydration lock mask',
          'UV color protection spray'
        ],
        startingPrice: 3000,
        durationMinutes: 60
      },
      {
        id: 'exp-203',
        serviceId: 'coloring',
        serviceName: 'Color Correction & Repair',
        category: 'Hair & Styling',
        masteryLevel: 'Expert Technician',
        description: 'Professional color correction service to fix uneven tones and restore healthy hair color.',
        techniques: [
          'Gentle color extraction',
          'Protein repair treatment',
          'Even tone re-application'
        ],
        startingPrice: 8500,
        durationMinutes: 180
      }
    ]
  },
  {
    id: 'artisan-3',
    name: 'Rohan Verma',
    role: 'Bridal Makeup & Spa Specialist',
    specialty: 'Bridal Styling & Head Spas',
    rating: 4.9,
    experience: '9+ Years',
    bio: 'Rohan is renowned for creating flawless bridal looks and soothing head spa treatments. He ensures every bride feels confident and relaxed on her big day.',
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=500',
    instagram: '@rohan_bridal_glam',
    accreditations: [
      'Certified Bridal Makeup Artist Delhi',
      'Advanced Trichology & Head Spa Diploma',
      'Featured in Femina Wedding Times'
    ],
    workGallery: [
      {
        id: 'wg-301',
        title: 'Royal Indian Bridal Look',
        category: 'Bridal & Makeup',
        image: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=800',
        description: 'Immaculate traditional bridal makeup with elegant bun and secure dupatta setting.',
        clientResult: 'Stunning all-day wear makeup that looks radiant in both photos and live lighting.',
        tags: ['BridalMakeup', 'TraditionalBride', 'ReceptionGlam']
      },
      {
        id: 'wg-302',
        title: 'Herbal Scalp Steam Therapy',
        category: 'Skin & Facials',
        image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=800',
        description: 'Relaxing herbal steam treatment with soothing essential oils and scalp massage.',
        clientResult: 'Relieves stress, cleanses hair roots, and leaves hair wonderfully soft.',
        tags: ['HeadSpa', 'ScalpCare', 'StressRelief']
      },
      {
        id: 'wg-303',
        title: 'Festive Party Hairstyling',
        category: 'Hair & Styling',
        image: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&q=80&w=800',
        description: 'Graceful braided updo adorned with fresh floral gajra or accessories.',
        clientResult: 'Elegant festive hairstyle with strong hold and delicate finish.',
        tags: ['FestiveHair', 'FloralBraid', 'PartyUpdo']
      },
      {
        id: 'wg-304',
        title: 'Engagement Glam & Waves',
        category: 'Bridal & Makeup',
        image: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&q=80&w=800',
        description: 'Soft glam makeup paired with cascading glossy soft waves.',
        clientResult: 'Glamorous yet natural appearance perfect for engagement ceremonies.',
        tags: ['EngagementGlam', 'SoftWaves', 'PartyMakeup']
      }
    ],
    specificExpertise: [
      {
        id: 'exp-301',
        serviceId: 'bridal',
        serviceName: 'Bridal & Reception Makeup & Hair',
        category: 'Bridal & Makeup',
        masteryLevel: 'Senior Bridal Director (9+ yrs)',
        description: 'Rohan’s world-renowned bridal concierge journey including trial architecture, veil engineering, and day-of styling.',
        techniques: [
          'Pre-wedding consultation & trial',
          'HD & airbrush makeup application',
          'Secure dupatta & jewelry pinning',
          'Touch-up kit provided'
        ],
        startingPrice: 22000,
        durationMinutes: 180
      },
      {
        id: 'exp-302',
        serviceId: 'spa',
        serviceName: 'Relaxing Head Spa & Scalp Therapy',
        category: 'Skin & Facials',
        masteryLevel: 'Certified Specialist',
        description: 'Calming scalp therapy using herbal steam and pressure-point massage.',
        techniques: [
          'Scalp health check',
          'Herbal steam infusion',
          'Neck and shoulder relaxation massage'
        ],
        startingPrice: 2500,
        durationMinutes: 60
      },
      {
        id: 'exp-303',
        serviceId: 'bridal',
        serviceName: 'Party Guest Makeup & Hair',
        category: 'Bridal & Makeup',
        masteryLevel: 'Senior Stylist',
        description: 'Professional makeup and hairstyling for family members and party guests.',
        techniques: [
          'Customized party makeup',
          'Blow-dry or curling iron styling',
          'Long-wear setting finish'
        ],
        startingPrice: 4500,
        durationMinutes: 90
      }
    ]
  },
  {
    id: 'artisan-4',
    name: 'Sneha Kapoor',
    role: 'Master Barber & Grooming Specialist',
    specialty: 'Beard Styling & Razor Shaves',
    rating: 4.9,
    experience: '11+ Years',
    bio: 'Sneha is an expert in traditional hot towel shaves, precision beard grooming, and modern men’s haircuts.',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=500',
    instagram: '@snehakapoor_grooming',
    accreditations: [
      'Master Barbers Association India',
      'Advanced Fade & Razor Specialist',
      'Grooming Expert Award 2023'
    ],
    workGallery: [
      {
        id: 'wg-401',
        title: 'Traditional Hot Towel Shave',
        category: 'Groom Shave & Beard Styling',
        image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=800',
        description: 'Steamed hot towel compress with rich lather and smooth razor glide.',
        clientResult: 'Smooth, irritation-free skin and a refreshing clean feel.',
        tags: ['HotTowelShave', 'RazorShave', 'SmoothSkin']
      },
      {
        id: 'wg-402',
        title: 'Precision Beard Shaping & Fade',
        category: 'Groom Shave & Beard Styling',
        image: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&q=80&w=800',
        description: 'Clean cheek line definition with sharp jawline fade and beard oil finish.',
        clientResult: 'Sharp, well-groomed beard shape that looks extremely polished.',
        tags: ['BeardFade', 'BeardShaping', 'Lineup']
      },
      {
        id: 'wg-403',
        title: 'Classic Men’s Taper Cut',
        category: 'Hair & Styling',
        image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=800',
        description: 'Clean side taper with textured top scissors finish.',
        clientResult: 'Professional gentleman’s haircut suitable for office or casual wear.',
        tags: ['MensCut', 'ClassicTaper', 'CleanFade']
      },
      {
        id: 'wg-404',
        title: 'Eucalyptus Steamed Shave Spa',
        category: 'Groom Shave & Beard Styling',
        image: 'https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6?auto=format&fit=crop&q=80&w=800',
        description: 'Relaxing eucalyptus steam towels with soothing face massage.',
        clientResult: 'Deeply cleansed pores and relaxed facial muscles.',
        tags: ['EucalyptusSteam', 'FaceSpa', 'Relaxation']
      }
    ],
    specificExpertise: [
      {
        id: 'exp-401',
        serviceId: 'barber',
        serviceName: 'Signature Shave & Beard Styling',
        category: 'Groom Shave & Beard Styling',
        masteryLevel: 'Master Barber (11+ yrs)',
        description: 'Sneha’s signature hot towel shave and beard grooming ritual.',
        techniques: [
          'Warm steamed towel application',
          'Rich lather preparation',
          'Precision straight-razor shave',
          'Cooling aftershave balm massage'
        ],
        startingPrice: 900,
        durationMinutes: 50
      }
    ]
  }
];
