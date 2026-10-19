export interface SalonService {
  id: string;
  name: string;
  category: string;
  price: number;
  duration: number;
  description: string;
  imageUrl: string;
}

export interface SalonTeamMember {
  id: string;
  name: string;
  role: string;
  bio: string;
  specialties: string;
  imageUrl: string;
}

export interface SalonConfig {
  brand: {
    name: string;
    category: string;
    tagline: string;
    logoUrl: string;
    heroImageUrl: string;
    heroBadge: string;
    heroTitle: string;
    heroSubtitle: string;
    heroNote: string;
    marqueeText: string;
    aboutTitle: string;
    aboutText: string;
    servicesTitle: string;
    servicesIntro: string;
    teamTitle: string;
    teamIntro: string;
    contactTitle: string;
    contactIntro: string;
    bookingButton: string;
    footerText: string;
    currency: string;
  };
  contact: {
    address: string;
    phone: string;
    email: string;
    instagram: string;
    facebook: string;
    hours: string;
  };
  theme: {
    accent: string;
    background: string;
    surface: string;
    text: string;
    muted: string;
  };
  services: SalonService[];
  staff: SalonTeamMember[];
}

export interface SalonRecord {
  id: string;
  ownerId: string;
  slug: string;
  publishedSlug: string | null;
  config: SalonConfig;
  publishedConfig?: SalonConfig | null;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SalonOwner {
  id: string;
  email: string;
  name: string;
}

export interface OwnerBooking {
  id: string;
  salonId: string;
  serviceId: string;
  serviceName: string;
  price: number;
  date: string;
  timeSlot: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  notes: string;
  status: 'Pending' | 'Confirmed' | 'Completed' | 'Rejected';
  createdAt: string;
}

export interface PublicSalon {
  id: string;
  slug: string;
  config: SalonConfig;
  isPublished: boolean;
}

export interface Service {
  id: string;
  name: string;
  category: string;
  price: number;
  duration: number; // in minutes
  description: string;
  image: string;
  features: string[];
  isSeasonal?: boolean;
  seasonalTag?: 'Seasonal' | string;
  seasonalLabel?: string;
  originalPrice?: number;
  validUntil?: string;
}

export type BookingStatus = 'Pending' | 'Confirmed' | 'Completed' | 'Rejected';

export interface Booking {
  id: string; // e.g. NEX-XXXX
  shopId?: string; // Multi-tenant scoping
  serviceId: string;
  serviceName: string;
  price: number;
  date: string; // YYYY-MM-DD
  timeSlot: string; // e.g., "10:00 AM"
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  notes?: string;
  status: BookingStatus;
  createdAt: string; // ISO string
  pointsEarned?: number;
}

export interface Review {
  id: string;
  name: string;
  role: string;
  content: string;
  rating: number;
  date: string;
  serviceId?: string;
  serviceName?: string;
  serviceCategory?: string;
  serviceDuration?: number;
  servicePrice?: number;
  serviceTag?: string;
  verifiedTreatment?: boolean;
}

export interface OwnerStats {
  totalBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  estimatedRevenue: number;
}

export interface WorkGalleryItem {
  id: string;
  title: string;
  category: string;
  image: string;
  description: string;
  clientResult?: string;
  tags: string[];
}

export interface ServiceExpertise {
  id: string;
  serviceId?: string;
  serviceName: string;
  category: string;
  masteryLevel: string;
  description: string;
  techniques: string[];
  startingPrice: number;
  durationMinutes: number;
}

export interface Artisan {
  id: string;
  name: string;
  role: string;
  specialty: string;
  bio: string;
  image: string;
  avatar?: string;
  instagram: string;
  rating?: number;
  experience?: string;
  accreditations?: string[];
  workGallery?: WorkGalleryItem[];
  specificExpertise?: ServiceExpertise[];
}

// MULTI-TENANT ENTERPRISE SAAS TYPES

export type ShopStatus = 'Active' | 'Pending' | 'Suspended';

export interface Shop {
  id: string; // e.g. "looks", "royalbarber", "beautyqueen", "nexora"
  name: string;
  tagline: string;
  status: ShopStatus;
  ownerEmail: string;
  subdomain: string; // looks.nexorasalonos.com
  category: 'Barber Shop' | 'Hair Salon' | 'Beauty Parlour' | 'Grooming Studio' | 'Spa' | 'Nails Studio' | 'Tattoo Studio' | 'Massage';
  logoPlaceholder: string;
  backgroundImage: string;
  address: string;
  balance: number; // Wallet tracking
  createdAt: string;
}

export interface WithdrawRequest {
  id: string; // WR-XXXX
  shopId: string;
  shopName: string;
  amount: number;
  destination: string; // e.g., "Chase Account *9412" or "UPI: royalbarb@pay"
  status: 'Pending' | 'Approved' | 'Rejected';
  createdAt: string;
}

export interface Transaction {
  id: string; // TXN-XXXX
  shopId: string;
  shopName: string;
  amount: number;
  type: 'Booking Deposit' | 'Withdrawal' | 'Subscription Plan';
  status: 'Completed' | 'Pending' | 'Rejected';
  createdAt: string;
}

export interface StaffMember {
  id: string;
  shopId: string;
  name: string;
  role: string;
  specialty: string;
  rating: number;
  isAvailable: boolean;
  avatar: string;
  bio?: string;
  image?: string;
  instagram?: string;
  experience?: string;
  accreditations?: string[];
  workGallery?: WorkGalleryItem[];
  specificExpertise?: ServiceExpertise[];
}

export interface CustomerData {
  id: string;
  shopId: string;
  name: string;
  phone: string;
  email: string;
  lastBookingDate: string; // YYYY-MM-DD for inactive customer analysis
  totalSpend: number;
  status: 'Active' | 'Inactive' | 'Reclaimed';
  campaignCount: number;
  loyaltyPoints?: number;
  loyaltyTier?: 'Silver' | 'Gold' | 'Platinum' | 'Diamond VIP';
}

export interface LoyaltyProfile {
  customerEmail: string;
  customerName: string;
  totalPoints: number;
  tier: 'Silver' | 'Gold' | 'Platinum' | 'Diamond VIP';
  pointsEarnedThisBooking: number;
  nextTierPoints: number;
  nextTierName: string;
  rebookDiscountAmount: number;
  bonusPointsEligible: number;
  totalBookingsCount: number;
}
