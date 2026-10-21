import { randomUUID } from 'node:crypto';
import type { SalonConfig, SalonService, SalonTeamMember } from '../src/types';

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function cleanText(value: unknown, label: string, maxLength: number, required = false): string {
  if (typeof value !== 'string') {
    if (required) throw new ValidationError(`${label} is required.`);
    return '';
  }
  const result = value.trim();
  if (result.length > maxLength) throw new ValidationError(`${label} must be ${maxLength} characters or fewer.`);
  if (required && !result) throw new ValidationError(`${label} is required.`);
  return result;
}

export function normalizeEmail(value: unknown): string {
  const email = cleanText(value, 'Email', 254, true).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new ValidationError('Enter a valid email address.');
  }
  return email;
}

export function normalizeSlug(value: unknown): string {
  const slug = cleanText(value, 'Website address', 48, true).toLowerCase();
  if (slug.length < 3 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new ValidationError('Use 3–48 lowercase letters or numbers, with single hyphens between words.');
  }
  if (['api', 'dashboard', 'login', 'signup', 'assets', 'media', 'admin', 'www', 'bookings'].includes(slug)) {
    throw new ValidationError('That website address is reserved. Please choose another.');
  }
  return slug;
}

function normalizeHex(value: unknown, fallback: string, label: string): string {
  if (typeof value !== 'string' || value.trim() === '') return fallback;
  const color = value.trim();
  if (!/^#[0-9a-fA-F]{6}$/.test(color)) throw new ValidationError(`${label} must be a six-digit hex color.`);
  return color.toUpperCase();
}

function normalizeImageUrl(value: unknown, label: string, ownerId: string): string {
  const url = cleanText(value, label, 1500);
  if (!url) return '';
  if (url.startsWith(`/media/${ownerId}/`) && /^\/media\/[a-f0-9-]{16,64}\/[a-zA-Z0-9-]{16,64}\.(?:jpg|png|webp|gif)$/.test(url)) {
    return url;
  }
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' || !parsed.hostname) throw new Error('invalid image URL');
    return parsed.toString();
  } catch {
    throw new ValidationError(`${label} must be an uploaded image or a secure https image URL.`);
  }
}

function normalizeService(value: unknown, index: number, ownerId: string): SalonService {
  if (!isRecord(value)) throw new ValidationError(`Service ${index + 1} is invalid.`);
  const id = typeof value.id === 'string' && /^[a-zA-Z0-9_-]{1,64}$/.test(value.id) ? value.id : randomUUID();
  const name = cleanText(value.name, `Service ${index + 1} name`, 100);
  const hasPrice = value.price !== '' && value.price !== undefined && value.price !== null;
  const hasDuration = value.duration !== '' && value.duration !== undefined && value.duration !== null;
  const price = Number(value.price);
  const duration = Number(value.duration);
  if (hasPrice && (!Number.isFinite(price) || price < 0 || price > 1_000_000)) {
    throw new ValidationError(`Enter a valid price for service ${index + 1}.`);
  }
  if (hasDuration && (!Number.isInteger(duration) || duration < 0 || (duration > 0 && duration < 5) || duration > 1440)) {
    throw new ValidationError(`Service ${index + 1} duration must be 0 or between 5 and 1,440 minutes.`);
  }
  return {
    id,
    name,
    category: cleanText(value.category, `Service ${index + 1} category`, 60),
    price: value.price === '' || value.price === undefined || value.price === null ? 0 : price,
    duration: value.duration === '' || value.duration === undefined || value.duration === null ? 0 : duration,
    description: cleanText(value.description, `Service ${index + 1} description`, 1200),
    imageUrl: normalizeImageUrl(value.imageUrl, `Service ${index + 1} image`, ownerId),
  };
}

function normalizeTeamMember(value: unknown, index: number, ownerId: string): SalonTeamMember {
  if (!isRecord(value)) throw new ValidationError(`Team member ${index + 1} is invalid.`);
  const id = typeof value.id === 'string' && /^[a-zA-Z0-9_-]{1,64}$/.test(value.id) ? value.id : randomUUID();
  return {
    id,
    name: cleanText(value.name, `Team member ${index + 1} name`, 100),
    role: cleanText(value.role, `Team member ${index + 1} role`, 80),
    bio: cleanText(value.bio, `Team member ${index + 1} bio`, 1000),
    specialties: cleanText(value.specialties, `Team member ${index + 1} specialties`, 250),
    imageUrl: normalizeImageUrl(value.imageUrl, `Team member ${index + 1} image`, ownerId),
  };
}

export function defaultSalonConfig(salonName: string): SalonConfig {
  return {
    brand: {
      name: salonName,
      category: '',
      tagline: '',
      logoUrl: '',
      heroImageUrl: '',
      heroBadge: '',
      heroTitle: '',
      heroSubtitle: '',
      heroNote: '',
      marqueeText: '',
      aboutTitle: '',
      aboutText: '',
      servicesTitle: '',
      servicesIntro: '',
      teamTitle: '',
      teamIntro: '',
      contactTitle: '',
      contactIntro: '',
      bookingButton: '',
      footerText: '',
      currency: 'INR',
      template: 'atelier',
    },
    contact: {
      address: '',
      locationUrl: '',
      phone: '',
      email: '',
      instagram: '',
      facebook: '',
      hours: '',
    },
    theme: {
      accent: '#D4AF37',
      background: '#090908',
      surface: '#151410',
      text: '#F5F1E9',
      muted: '#B8B2A8',
    },
    services: [],
    staff: [],
  };
}

export function normalizeSalonConfig(value: unknown, ownerId: string, salonNameFallback = ''): SalonConfig {
  if (!isRecord(value)) throw new ValidationError('Website settings are invalid.');
  const brand = isRecord(value.brand) ? value.brand : {};
  const contact = isRecord(value.contact) ? value.contact : {};
  const theme = isRecord(value.theme) ? value.theme : {};
  const defaults = defaultSalonConfig(salonNameFallback);
  const servicesValue = Array.isArray(value.services) ? value.services : [];
  const staffValue = Array.isArray(value.staff) ? value.staff : [];
  if (servicesValue.length > 80) throw new ValidationError('A website can include up to 80 services.');
  if (staffValue.length > 50) throw new ValidationError('A website can include up to 50 team members.');

  const currency = cleanText(brand.currency, 'Currency', 3).toUpperCase() || 'INR';
  if (!/^[A-Z]{3}$/.test(currency)) throw new ValidationError('Choose a valid three-letter currency code.');
  const template = cleanText(brand.template, 'Website template', 20) || 'atelier';
  if (!['atelier', 'minimal', 'botanical'].includes(template)) throw new ValidationError('Choose a supported website template.');
  try {
    new Intl.NumberFormat('en', { style: 'currency', currency }).format(0);
  } catch {
    throw new ValidationError('Choose a supported currency.');
  }

  const normalizeLink = (input: unknown, label: string, httpsOnly = false): string => {
    const link = cleanText(input, label, 600);
    if (!link) return '';
    try {
      const parsed = new URL(link);
      if (!(httpsOnly ? parsed.protocol === 'https:' : ['https:', 'http:', 'mailto:', 'tel:'].includes(parsed.protocol))) throw new Error('invalid link');
      return link;
    } catch {
      throw new ValidationError(`${label} must be a valid web, email, or phone link.`);
    }
  };

  return {
    brand: {
      name: cleanText(brand.name, 'Website name', 100, true),
      category: cleanText(brand.category, 'Salon type', 60),
      tagline: cleanText(brand.tagline, 'Tagline', 180),
      logoUrl: normalizeImageUrl(brand.logoUrl, 'Logo', ownerId),
      heroImageUrl: normalizeImageUrl(brand.heroImageUrl, 'Hero image', ownerId),
      heroBadge: cleanText(brand.heroBadge, 'Hero eyebrow', 80),
      heroTitle: cleanText(brand.heroTitle, 'Hero heading', 140),
      heroSubtitle: cleanText(brand.heroSubtitle, 'Hero introduction', 500),
      heroNote: cleanText(brand.heroNote, 'Hero note', 100),
      marqueeText: cleanText(brand.marqueeText, 'Brand detail line', 160),
      aboutTitle: cleanText(brand.aboutTitle, 'About heading', 100),
      aboutText: cleanText(brand.aboutText, 'About text', 2400),
      servicesTitle: cleanText(brand.servicesTitle, 'Services heading', 100),
      servicesIntro: cleanText(brand.servicesIntro, 'Services introduction', 500),
      teamTitle: cleanText(brand.teamTitle, 'Team heading', 100),
      teamIntro: cleanText(brand.teamIntro, 'Team introduction', 500),
      contactTitle: cleanText(brand.contactTitle, 'Contact heading', 100),
      contactIntro: cleanText(brand.contactIntro, 'Contact introduction', 500),
      bookingButton: cleanText(brand.bookingButton, 'Booking button text', 60),
      footerText: cleanText(brand.footerText, 'Footer text', 500),
      currency,
      template: template as SalonConfig['brand']['template'],
    },
    contact: {
      address: cleanText(contact.address, 'Address', 300),
      locationUrl: normalizeLink(contact.locationUrl, 'Map and directions link', true),
      phone: cleanText(contact.phone, 'Phone', 60),
      email: contact.email ? normalizeEmail(contact.email) : '',
      instagram: normalizeLink(contact.instagram, 'Instagram link'),
      facebook: normalizeLink(contact.facebook, 'Facebook link'),
      hours: cleanText(contact.hours, 'Opening hours', 700),
    },
    theme: {
      accent: normalizeHex(theme.accent, defaults.theme.accent, 'Accent color'),
      background: normalizeHex(theme.background, defaults.theme.background, 'Background color'),
      surface: normalizeHex(theme.surface, defaults.theme.surface, 'Card color'),
      text: normalizeHex(theme.text, defaults.theme.text, 'Text color'),
      muted: normalizeHex(theme.muted, defaults.theme.muted, 'Muted text color'),
    },
    services: servicesValue.map((service, index) => normalizeService(service, index, ownerId)),
    staff: staffValue.map((member, index) => normalizeTeamMember(member, index, ownerId)),
  };
}
