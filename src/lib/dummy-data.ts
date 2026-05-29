export interface Media {
  id: number;
  url: string;
  alt?: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  coverImageId: number;
  coverImage: Media | null;
  createdAt: string;
  updatedAt: string;
}

export interface Season {
  id: number;
  name: string;
  slug: string;
  subtitle: string;
  description: string;
  coverImageId: number;
  coverImage: Media | null;
  isActive: boolean;
  lookbookImages: Media[];
  createdAt: string;
  updatedAt: string;
}

export interface CareGuide {
  id: number;
  title: string;
  instructions: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProductColor {
  id: number;
  name: string;
  hex: string;
}

export interface ProductSize {
  id: number;
  name: string;
  label: string;
}

export interface ProductGalleryItem {
  id: number;
  imageUrl: string;
  sortOrder: number;
}

export interface ProductVariant {
  id: number;
  color: string;
  size: string;
  sku: string;
  stock: number;
  priceAdjustment: number;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  seasonId: number;
  season: Season;
  categoryId: number;
  category: Category;
  gender: string;
  basePrice: number;
  weight: number;
  length: number;
  width: number;
  height: number;
  stock: number;
  description: string;
  coverImageId: number;
  coverImage: Media | null;
  detailInfo: Record<string, unknown> | null;
  careGuideId: number;
  careGuide: CareGuide | null;
  availableColors: ProductColor[];
  availableSizes: ProductSize[];
  gallery: ProductGalleryItem[];
  variants: ProductVariant[];
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface CustomerAddress {
  id: number;
  label: string;
  fullAddress: string;
}

export interface TransactionItem {
  id: number;
  transactionId: number;
  productId: number;
  selectedSize: string;
  selectedColor: string;
  selectedColorHex: string;
  quantity: number;
  price: number;
  createdAt: string;
}

export interface Transaction {
  id: number;
  orderId: string;
  userId: string;
  shippingAddressId: number;
  totalAmount: number;
  shippingCost: number;
  courierName: string;
  courierService: string;
  trackingNumber: string;
  biteshipOrderId: string;
  biteshipReference: string;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  shippingStatus: "pending" | "shipped" | "delivered";
  snapToken: string;
  createdAt: string;
  updatedAt: string;
  user: User;
  shippingAddress: CustomerAddress;
  items: TransactionItem[];
}

export const categories: Category[] = [
  {
    id: 1,
    name: "Jerseys",
    slug: "jerseys",
    coverImageId: 10,
    coverImage: { id: 10, url: "/categories/jerseys.jpg", alt: "Jerseys category" },
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-06-01T10:00:00Z",
  },
  {
    id: 2,
    name: "Shorts",
    slug: "shorts",
    coverImageId: 11,
    coverImage: { id: 11, url: "/categories/shorts.jpg", alt: "Shorts category" },
    createdAt: "2024-01-20T10:00:00Z",
    updatedAt: "2024-06-01T10:00:00Z",
  },
  {
    id: 3,
    name: "Socks",
    slug: "socks",
    coverImageId: 12,
    coverImage: { id: 12, url: "/categories/socks.jpg", alt: "Socks category" },
    createdAt: "2024-02-01T10:00:00Z",
    updatedAt: "2024-06-01T10:00:00Z",
  },
  {
    id: 4,
    name: "Accessories",
    slug: "accessories",
    coverImageId: 13,
    coverImage: { id: 13, url: "/categories/accessories.jpg", alt: "Accessories category" },
    createdAt: "2024-02-10T10:00:00Z",
    updatedAt: "2024-06-01T10:00:00Z",
  },
  {
    id: 5,
    name: "Training",
    slug: "training",
    coverImageId: 14,
    coverImage: { id: 14, url: "/categories/training.jpg", alt: "Training category" },
    createdAt: "2024-03-01T10:00:00Z",
    updatedAt: "2024-06-01T10:00:00Z",
  },
];

export const seasons: Season[] = [
  {
    id: 1,
    name: "El Ligue Premiere Gacor Terbaru 2024",
    slug: "el-ligue-premiere",
    subtitle: "Navy & Gold",
    description: "Our flagship collection inspired by classic football aesthetics. Bold colors and premium materials for the ultimate fan experience. The El Ligue Premiere collection captures the spirit of the game with its iconic diagonal stripe design and rich color palette. Each piece is crafted with attention to detail, featuring breathable fabrics and modern fits that pay homage to football's heritage while embracing contemporary style.",
    coverImageId: 20,
    coverImage: { id: 20, url: "/seasons/el-ligue-premiere.jpg", alt: "El Ligue Premiere" },
    isActive: true,
    lookbookImages: [
      { id: 21, url: "/products/season-1.png", alt: "Look 1" },
      { id: 22, url: "/products/season-3.png", alt: "Look 2" },
    ],
    createdAt: "2024-08-01T10:00:00Z",
    updatedAt: "2024-09-01T10:00:00Z",
  },
  {
    id: 2,
    name: "Summer Drop 2024",
    slug: "summer-drop-2024",
    subtitle: "Pastel & White",
    description: "Lightweight summer essentials for on and off the pitch",
    coverImageId: 23,
    coverImage: { id: 23, url: "/seasons/summer-drop.jpg", alt: "Summer Drop 2024" },
    isActive: false,
    lookbookImages: [
      { id: 24, url: "/seasons/summer-1.jpg", alt: "Look 1" },
    ],
    createdAt: "2024-05-15T10:00:00Z",
    updatedAt: "2024-06-01T10:00:00Z",
  },
  {
    id: 3,
    name: "Winter Collection",
    slug: "winter-collection-2024",
    subtitle: "Charcoal & Crimson",
    description: "Warm layers for cold weather training",
    coverImageId: 25,
    coverImage: { id: 25, url: "/seasons/winter-collection.jpg", alt: "Winter Collection" },
    isActive: false,
    lookbookImages: [],
    createdAt: "2024-10-01T10:00:00Z",
    updatedAt: "2024-10-15T10:00:00Z",
  },
  {
    id: 4,
    name: "Heritage Line",
    slug: "heritage-line",
    subtitle: "Vintage Green",
    description: "Retro-inspired designs celebrating football history",
    coverImageId: 26,
    coverImage: { id: 26, url: "/seasons/heritage-line.jpg", alt: "Heritage Line" },
    isActive: false,
    lookbookImages: [
      { id: 27, url: "/seasons/heritage-1.jpg", alt: "Look 1" },
      { id: 28, url: "/seasons/heritage-2.jpg", alt: "Look 2" },
    ],
    createdAt: "2024-03-20T10:00:00Z",
    updatedAt: "2024-04-01T10:00:00Z",
  },
];

export const careGuides: CareGuide[] = [
  {
    id: 1,
    title: "Jersey Care Instructions",
    instructions: { wash: "30°C inside out", dry: "Do not tumble dry", iron: "Do not iron printed areas" },
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-02-01T10:00:00Z",
  },
  {
    id: 2,
    title: "Shorts Care Instructions",
    instructions: { wash: "Cold with similar colors", dry: "Air dry recommended" },
    createdAt: "2024-01-20T10:00:00Z",
    updatedAt: "2024-02-01T10:00:00Z",
  },
  {
    id: 3,
    title: "Sock Care Instructions",
    instructions: { wash: "30°C", notes: "Avoid fabric softener to maintain elasticity" },
    createdAt: "2024-02-01T10:00:00Z",
    updatedAt: "2024-03-01T10:00:00Z",
  },
  {
    id: 4,
    title: "General Fabric Care",
    instructions: { wash: "Check label", detergent: "Mild detergent", bleach: "Avoid bleach" },
    createdAt: "2024-02-10T10:00:00Z",
    updatedAt: "2024-03-01T10:00:00Z",
  },
  {
    id: 5,
    title: "Storage Tips",
    instructions: { location: "Cool, dry place", method: "Fold jerseys rather than hanging to maintain shape" },
    createdAt: "2024-03-01T10:00:00Z",
    updatedAt: "2024-04-01T10:00:00Z",
  },
];

const defaultColors: ProductColor[] = [
  { id: 1, name: "Navy", hex: "#1a237e" },
  { id: 2, name: "White", hex: "#ffffff" },
  { id: 3, name: "Black", hex: "#000000" },
  { id: 4, name: "Red", hex: "#d32f2f" },
  { id: 5, name: "Green", hex: "#388e3c" },
];

const defaultSizes: ProductSize[] = [
  { id: 1, name: "S", label: "Small" },
  { id: 2, name: "M", label: "Medium" },
  { id: 3, name: "L", label: "Large" },
  { id: 4, name: "XL", label: "Extra Large" },
  { id: 5, name: "XXL", label: "2XL" },
];

export const products: Product[] = [
  {
    id: 1,
    name: "El Ligue Home Jersey",
    slug: "el-ligue-home-jersey",
    seasonId: 1,
    season: seasons[0],
    categoryId: 1,
    category: categories[0],
    gender: "men",
    basePrice: 899000,
    weight: 250,
    length: 70,
    width: 50,
    height: 2,
    stock: 45,
    description: "Official home jersey from the El Ligue Premiere collection. Premium breathable fabric with moisture-wicking technology.",
    coverImageId: 1,
    coverImage: { id: 1, url: "/products/products-1.png", alt: "El Ligue Home Jersey" },
    detailInfo: { material: "100% Polyester", fit: "Regular", technology: "Dri-FIT" },
    careGuideId: 1,
    careGuide: careGuides[0],
    availableColors: [defaultColors[0], defaultColors[2]],
    availableSizes: [defaultSizes[1], defaultSizes[2], defaultSizes[3]],
    gallery: [
      { id: 1, imageUrl: "/products/products-1.png", sortOrder: 1 },
      { id: 2, imageUrl: "/products/products-1.png", sortOrder: 2 },
    ],
    variants: [
      { id: 1, color: "Navy", size: "M", sku: "DG-ELH-NVY-M", stock: 12, priceAdjustment: 0 },
      { id: 2, color: "Navy", size: "L", sku: "DG-ELH-NVY-L", stock: 8, priceAdjustment: 0 },
      { id: 3, color: "Black", size: "M", sku: "DG-ELH-BLK-M", stock: 10, priceAdjustment: 0 },
      { id: 4, color: "Black", size: "XL", sku: "DG-ELH-BLK-XL", stock: 15, priceAdjustment: 0 },
    ],
    createdAt: "2024-09-01T10:00:00Z",
    updatedAt: "2024-09-15T10:00:00Z",
  },
  {
    id: 2,
    name: "El Ligue Away Jersey",
    slug: "el-ligue-away-jersey",
    seasonId: 1,
    season: seasons[0],
    categoryId: 1,
    category: categories[0],
    gender: "unisex",
    basePrice: 899000,
    weight: 245,
    length: 72,
    width: 52,
    height: 2,
    stock: 32,
    description: "Stylish away jersey featuring the signature diagonal stripe pattern. Lightweight and durable.",
    coverImageId: 2,
    coverImage: { id: 2, url: "/products/products-2.png", alt: "El Ligue Away Jersey" },
    detailInfo: { material: "92% Polyester, 8% Spandex", fit: "Slim", technology: "AeroSwift" },
    careGuideId: 1,
    careGuide: careGuides[0],
    availableColors: [defaultColors[1], defaultColors[0]],
    availableSizes: defaultSizes,
    gallery: [
      { id: 3, imageUrl: "/products/products-2.png", sortOrder: 1 },
    ],
    variants: [
      { id: 5, color: "White", size: "S", sku: "DG-ELA-WHT-S", stock: 5, priceAdjustment: 0 },
      { id: 6, color: "White", size: "M", sku: "DG-ELA-WHT-M", stock: 8, priceAdjustment: 0 },
      { id: 7, color: "Navy", size: "L", sku: "DG-ELA-NVY-L", stock: 10, priceAdjustment: 0 },
      { id: 8, color: "Navy", size: "XL", sku: "DG-ELA-NVY-XL", stock: 9, priceAdjustment: 0 },
    ],
    createdAt: "2024-09-01T10:00:00Z",
    updatedAt: "2024-09-15T10:00:00Z",
  },
  {
    id: 3,
    name: "Summer Training Shorts",
    slug: "summer-training-shorts",
    seasonId: 2,
    season: seasons[1],
    categoryId: 2,
    category: categories[1],
    gender: "unisex",
    basePrice: 459000,
    weight: 180,
    length: 45,
    width: 35,
    height: 3,
    stock: 60,
    description: "Breathable training shorts with elastic waistband and side pockets.",
    coverImageId: 3,
    coverImage: { id: 3, url: "/products/products-1.png", alt: "Summer Training Shorts" },
    detailInfo: { material: "88% Polyester, 12% Elastane", inseam: "7 inch" },
    careGuideId: 2,
    careGuide: careGuides[1],
    availableColors: [defaultColors[1], defaultColors[2], defaultColors[4]],
    availableSizes: [defaultSizes[1], defaultSizes[2], defaultSizes[3]],
    gallery: [
      { id: 4, imageUrl: "/products/products-1.png", sortOrder: 1 },
    ],
    variants: [
      { id: 9, color: "White", size: "M", sku: "DG-STS-WHT-M", stock: 20, priceAdjustment: 0 },
      { id: 10, color: "Black", size: "L", sku: "DG-STS-BLK-L", stock: 18, priceAdjustment: 0 },
      { id: 11, color: "Green", size: "XL", sku: "DG-STS-GRN-XL", stock: 22, priceAdjustment: 0 },
    ],
    createdAt: "2024-06-10T10:00:00Z",
    updatedAt: "2024-07-01T10:00:00Z",
  },
  {
    id: 4,
    name: "Performance Socks Pack",
    slug: "performance-socks-pack",
    seasonId: 2,
    season: seasons[1],
    categoryId: 3,
    category: categories[2],
    gender: "unisex",
    basePrice: 189000,
    weight: 120,
    length: 25,
    width: 10,
    height: 5,
    stock: 120,
    description: "Set of 3 pairs of cushioned performance socks with arch support.",
    coverImageId: 4,
    coverImage: { id: 4, url: "/products/products-1.png", alt: "Performance Socks Pack" },
    detailInfo: { material: "Cotton blend", cushion: "Medium", arch: "Supported" },
    careGuideId: 3,
    careGuide: careGuides[2],
    availableColors: [defaultColors[1], defaultColors[2], defaultColors[0]],
    availableSizes: [defaultSizes[0], defaultSizes[1], defaultSizes[2]],
    gallery: [
      { id: 5, imageUrl: "/products/products-1.png", sortOrder: 1 },
    ],
    variants: [
      { id: 12, color: "White", size: "S", sku: "DG-PSP-WHT-S", stock: 40, priceAdjustment: 0 },
      { id: 13, color: "Black", size: "M", sku: "DG-PSP-BLK-M", stock: 35, priceAdjustment: 0 },
      { id: 14, color: "Navy", size: "L", sku: "DG-PSP-NVY-L", stock: 45, priceAdjustment: 0 },
    ],
    createdAt: "2024-06-15T10:00:00Z",
    updatedAt: "2024-07-01T10:00:00Z",
  },
  {
    id: 5,
    name: "Heritage Scarf",
    slug: "heritage-scarf",
    seasonId: 4,
    season: seasons[3],
    categoryId: 4,
    category: categories[3],
    gender: "unisex",
    basePrice: 299000,
    weight: 200,
    length: 180,
    width: 30,
    height: 1,
    stock: 25,
    description: "Classic knitted scarf with heritage crest embroidery.",
    coverImageId: 5,
    coverImage: { id: 5, url: "/products/products-1.png", alt: "Heritage Scarf" },
    detailInfo: { material: "100% Acrylic", dimensions: "180x30cm" },
    careGuideId: 4,
    careGuide: careGuides[3],
    availableColors: [defaultColors[0], defaultColors[3]],
    availableSizes: [],
    gallery: [
      { id: 6, imageUrl: "/products/products-1.png", sortOrder: 1 },
    ],
    variants: [
      { id: 15, color: "Navy", size: "-", sku: "DG-HSC-NVY", stock: 10, priceAdjustment: 0 },
      { id: 16, color: "Red", size: "-", sku: "DG-HSC-RED", stock: 15, priceAdjustment: 0 },
    ],
    createdAt: "2024-04-10T10:00:00Z",
    updatedAt: "2024-05-01T10:00:00Z",
  },
  {
    id: 6,
    name: "Training Bib Set",
    slug: "training-bib-set",
    seasonId: 2,
    season: seasons[0],
    categoryId: 5,
    category: categories[4],
    gender: "unisex",
    basePrice: 349000,
    weight: 400,
    length: 60,
    width: 50,
    height: 10,
    stock: 18,
    description: "Set of 6 reversible training bibs in team colors.",
    coverImageId: 6,
    coverImage: { id: 6, url: "/products/products-1.png", alt: "Training Bib Set" },
    detailInfo: { quantity: "6 pieces", reversible: true },
    careGuideId: 4,
    careGuide: careGuides[3],
    availableColors: [defaultColors[0], defaultColors[3], defaultColors[4]],
    availableSizes: [],
    gallery: [
      { id: 7, imageUrl: "/products/products-1.png", sortOrder: 1 },
    ],
    variants: [
      { id: 17, color: "Navy", size: "-", sku: "DG-TBS-NVY", stock: 6, priceAdjustment: 0 },
      { id: 18, color: "Red", size: "-", sku: "DG-TBS-RED", stock: 6, priceAdjustment: 0 },
      { id: 19, color: "Green", size: "-", sku: "DG-TBS-GRN", stock: 6, priceAdjustment: 0 },
    ],
    createdAt: "2024-09-20T10:00:00Z",
    updatedAt: "2024-10-01T10:00:00Z",
  },
  {
    id: 7,
    name: "Winter Training Jacket",
    slug: "winter-training-jacket",
    seasonId: 3,
    season: seasons[2],
    categoryId: 5,
    category: categories[4],
    gender: "unisex",
    basePrice: 1299000,
    weight: 600,
    length: 75,
    width: 55,
    height: 5,
    stock: 0,
    description: "Insulated training jacket with water-resistant outer shell.",
    coverImageId: 7,
    coverImage: { id: 7, url: "/products/products-1.png", alt: "Winter Training Jacket" },
    detailInfo: { material: "Nylon shell, fleece lining", waterproof: "DWR coating" },
    careGuideId: 4,
    careGuide: careGuides[3],
    availableColors: [defaultColors[2], defaultColors[0]],
    availableSizes: [defaultSizes[2], defaultSizes[3], defaultSizes[4]],
    gallery: [
      { id: 8, imageUrl: "/products/products-1.png", sortOrder: 1 },
    ],
    variants: [
      { id: 20, color: "Black", size: "L", sku: "DG-WTJ-BLK-L", stock: 0, priceAdjustment: 0 },
      { id: 21, color: "Navy", size: "XL", sku: "DG-WTJ-NVY-XL", stock: 0, priceAdjustment: 0 },
    ],
    createdAt: "2024-11-01T10:00:00Z",
    updatedAt: "2024-11-15T10:00:00Z",
  },
  {
    id: 8,
    name: "Match Day Kit Bag",
    slug: "match-day-kit-bag",
    seasonId: 1,
    season: seasons[0],
    categoryId: 4,
    category: categories[3],
    gender: "unisex",
    basePrice: 599000,
    weight: 800,
    length: 50,
    width: 30,
    height: 25,
    stock: 40,
    description: "Spacious kit bag with separate shoe compartment and wet/dry storage.",
    coverImageId: 8,
    coverImage: { id: 8, url: "/products/products-1.png", alt: "Match Day Kit Bag" },
    detailInfo: { capacity: "40L", compartments: "3", material: "600D Polyester" },
    careGuideId: 5,
    careGuide: careGuides[4],
    availableColors: [defaultColors[2], defaultColors[0]],
    availableSizes: [],
    gallery: [
      { id: 9, imageUrl: "/products/products-1.png", sortOrder: 1 },
    ],
    variants: [
      { id: 22, color: "Black", size: "-", sku: "DG-MKB-BLK", stock: 20, priceAdjustment: 0 },
      { id: 23, color: "Navy", size: "-", sku: "DG-MKB-NVY", stock: 20, priceAdjustment: 0 },
    ],
    createdAt: "2024-09-05T10:00:00Z",
    updatedAt: "2024-09-20T10:00:00Z",
  },
];

const dummyUsers: User[] = [
  { id: "usr-1", name: "Andi Wijaya", email: "andi.wijaya@email.com" },
  { id: "usr-2", name: "Budi Santoso", email: "budi.s@email.com" },
  { id: "usr-3", name: "Citra Dewi", email: "citra.dewi@email.com" },
  { id: "usr-4", name: "Dedi Kurniawan", email: "dedi.k@email.com" },
  { id: "usr-5", name: "Eka Putri", email: "eka.putri@email.com" },
  { id: "usr-6", name: "Fajar Nugraha", email: "fajar.n@email.com" },
  { id: "usr-7", name: "Gita Maharani", email: "gita.m@email.com" },
  { id: "usr-8", name: "Hadi Susanto", email: "hadi.s@email.com" },
];

const dummyAddresses: CustomerAddress[] = [
  { id: 1, label: "Home", fullAddress: "Jl. Sudirman No. 45, Jakarta Selatan" },
  { id: 2, label: "Office", fullAddress: "Jl. Thamrin No. 12, Jakarta Pusat" },
  { id: 3, label: "Home", fullAddress: "Jl. Setiabudi No. 78, Bandung" },
  { id: 4, label: "Home", fullAddress: "Jl. Ahmad Yani No. 23, Surabaya" },
  { id: 5, label: "Home", fullAddress: "Jl. Gatot Subroto No. 56, Medan" },
  { id: 6, label: "Office", fullAddress: "Jl. Diponegoro No. 89, Yogyakarta" },
  { id: 7, label: "Home", fullAddress: "Jl. Merdeka No. 34, Semarang" },
  { id: 8, label: "Home", fullAddress: "Jl. Pemuda No. 67, Malang" },
];

export const transactions: Transaction[] = [
  {
    id: 1,
    orderId: "DG-2025-001",
    userId: "usr-1",
    shippingAddressId: 1,
    totalAmount: 1817000,
    shippingCost: 25000,
    courierName: "JNE",
    courierService: "REG",
    trackingNumber: "JNE1234567890",
    biteshipOrderId: "biteship-001",
    biteshipReference: "ref-001",
    status: "delivered",
    shippingStatus: "delivered",
    snapToken: "snap-token-001",
    createdAt: "2025-05-18T08:30:00Z",
    updatedAt: "2025-05-20T14:00:00Z",
    user: dummyUsers[0],
    shippingAddress: dummyAddresses[0],
    items: [
      { id: 1, transactionId: 1, productId: 1, selectedSize: "M", selectedColor: "Navy", selectedColorHex: "#1a237e", quantity: 1, price: 899000, createdAt: "2025-05-18T08:30:00Z" },
      { id: 2, transactionId: 1, productId: 3, selectedSize: "L", selectedColor: "White", selectedColorHex: "#ffffff", quantity: 2, price: 459000, createdAt: "2025-05-18T08:30:00Z" },
    ],
  },
  {
    id: 2,
    orderId: "DG-2025-002",
    userId: "usr-2",
    shippingAddressId: 2,
    totalAmount: 899000,
    shippingCost: 20000,
    courierName: "J&T",
    courierService: "EZ",
    trackingNumber: "JT9876543210",
    biteshipOrderId: "biteship-002",
    biteshipReference: "ref-002",
    status: "shipped",
    shippingStatus: "shipped",
    snapToken: "snap-token-002",
    createdAt: "2025-05-19T10:15:00Z",
    updatedAt: "2025-05-21T09:00:00Z",
    user: dummyUsers[1],
    shippingAddress: dummyAddresses[1],
    items: [
      { id: 3, transactionId: 2, productId: 2, selectedSize: "L", selectedColor: "Navy", selectedColorHex: "#1a237e", quantity: 1, price: 899000, createdAt: "2025-05-19T10:15:00Z" },
    ],
  },
  {
    id: 3,
    orderId: "DG-2025-003",
    userId: "usr-3",
    shippingAddressId: 3,
    totalAmount: 898000,
    shippingCost: 30000,
    courierName: "SiCepat",
    courierService: "BEST",
    trackingNumber: "SC1122334455",
    biteshipOrderId: "biteship-003",
    biteshipReference: "ref-003",
    status: "processing",
    shippingStatus: "pending",
    snapToken: "snap-token-003",
    createdAt: "2025-05-20T14:30:00Z",
    updatedAt: "2025-05-20T16:00:00Z",
    user: dummyUsers[2],
    shippingAddress: dummyAddresses[2],
    items: [
      { id: 4, transactionId: 3, productId: 5, selectedSize: "-", selectedColor: "Red", selectedColorHex: "#d32f2f", quantity: 1, price: 299000, createdAt: "2025-05-20T14:30:00Z" },
      { id: 5, transactionId: 3, productId: 8, selectedSize: "-", selectedColor: "Black", selectedColorHex: "#000000", quantity: 1, price: 599000, createdAt: "2025-05-20T14:30:00Z" },
    ],
  },
  {
    id: 4,
    orderId: "DG-2025-004",
    userId: "usr-4",
    shippingAddressId: 4,
    totalAmount: 567000,
    shippingCost: 15000,
    courierName: "JNE",
    courierService: "YES",
    trackingNumber: "",
    biteshipOrderId: "",
    biteshipReference: "",
    status: "pending",
    shippingStatus: "pending",
    snapToken: "snap-token-004",
    createdAt: "2025-05-21T09:00:00Z",
    updatedAt: "2025-05-21T09:00:00Z",
    user: dummyUsers[3],
    shippingAddress: dummyAddresses[3],
    items: [
      { id: 6, transactionId: 4, productId: 4, selectedSize: "M", selectedColor: "White", selectedColorHex: "#ffffff", quantity: 3, price: 189000, createdAt: "2025-05-21T09:00:00Z" },
    ],
  },
  {
    id: 5,
    orderId: "DG-2025-005",
    userId: "usr-5",
    shippingAddressId: 5,
    totalAmount: 2697000,
    shippingCost: 35000,
    courierName: "J&T",
    courierService: "REG",
    trackingNumber: "JT5566778899",
    biteshipOrderId: "biteship-005",
    biteshipReference: "ref-005",
    status: "cancelled",
    shippingStatus: "pending",
    snapToken: "snap-token-005",
    createdAt: "2025-05-21T11:20:00Z",
    updatedAt: "2025-05-21T13:00:00Z",
    user: dummyUsers[4],
    shippingAddress: dummyAddresses[4],
    items: [
      { id: 7, transactionId: 5, productId: 1, selectedSize: "L", selectedColor: "Navy", selectedColorHex: "#1a237e", quantity: 2, price: 899000, createdAt: "2025-05-21T11:20:00Z" },
      { id: 8, transactionId: 5, productId: 2, selectedSize: "XL", selectedColor: "White", selectedColorHex: "#ffffff", quantity: 1, price: 899000, createdAt: "2025-05-21T11:20:00Z" },
    ],
  },
  {
    id: 6,
    orderId: "DG-2025-006",
    userId: "usr-6",
    shippingAddressId: 6,
    totalAmount: 808000,
    shippingCost: 20000,
    courierName: "SiCepat",
    courierService: "GOKIL",
    trackingNumber: "SC9988776655",
    biteshipOrderId: "biteship-006",
    biteshipReference: "ref-006",
    status: "processing",
    shippingStatus: "pending",
    snapToken: "snap-token-006",
    createdAt: "2025-05-22T07:45:00Z",
    updatedAt: "2025-05-22T08:30:00Z",
    user: dummyUsers[5],
    shippingAddress: dummyAddresses[5],
    items: [
      { id: 9, transactionId: 6, productId: 6, selectedSize: "-", selectedColor: "Navy", selectedColorHex: "#1a237e", quantity: 1, price: 349000, createdAt: "2025-05-22T07:45:00Z" },
      { id: 10, transactionId: 6, productId: 3, selectedSize: "XL", selectedColor: "Green", selectedColorHex: "#388e3c", quantity: 1, price: 459000, createdAt: "2025-05-22T07:45:00Z" },
    ],
  },
  {
    id: 7,
    orderId: "DG-2025-007",
    userId: "usr-7",
    shippingAddressId: 7,
    totalAmount: 598000,
    shippingCost: 18000,
    courierName: "JNE",
    courierService: "REG",
    trackingNumber: "JNE5544332211",
    biteshipOrderId: "biteship-007",
    biteshipReference: "ref-007",
    status: "shipped",
    shippingStatus: "shipped",
    snapToken: "snap-token-007",
    createdAt: "2025-05-22T13:10:00Z",
    updatedAt: "2025-05-23T08:00:00Z",
    user: dummyUsers[6],
    shippingAddress: dummyAddresses[6],
    items: [
      { id: 11, transactionId: 7, productId: 5, selectedSize: "-", selectedColor: "Navy", selectedColorHex: "#1a237e", quantity: 2, price: 299000, createdAt: "2025-05-22T13:10:00Z" },
    ],
  },
  {
    id: 8,
    orderId: "DG-2025-008",
    userId: "usr-8",
    shippingAddressId: 8,
    totalAmount: 599000,
    shippingCost: 22000,
    courierName: "J&T",
    courierService: "EZ",
    trackingNumber: "",
    biteshipOrderId: "",
    biteshipReference: "",
    status: "pending",
    shippingStatus: "pending",
    snapToken: "snap-token-008",
    createdAt: "2025-05-23T10:00:00Z",
    updatedAt: "2025-05-23T10:00:00Z",
    user: dummyUsers[7],
    shippingAddress: dummyAddresses[7],
    items: [
      { id: 12, transactionId: 8, productId: 8, selectedSize: "-", selectedColor: "Black", selectedColorHex: "#000000", quantity: 1, price: 599000, createdAt: "2025-05-23T10:00:00Z" },
    ],
  },
];

export function formatPrice(amount: number): string {
  return "Rp " + amount.toLocaleString("id-ID");
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export interface DailySales {
  day: string;
  date: string;
  revenue: number;
  transactions: number;
}

export const dailySales: DailySales[] = [
  { day: "Sen", date: "2025-05-17", revenue: 1248000, transactions: 3 },
  { day: "Sel", date: "2025-05-18", revenue: 1817000, transactions: 2 },
  { day: "Rab", date: "2025-05-19", revenue: 899000, transactions: 1 },
  { day: "Kam", date: "2025-05-20", revenue: 898000, transactions: 2 },
  { day: "Jum", date: "2025-05-21", revenue: 3264000, transactions: 3 },
  { day: "Sab", date: "2025-05-22", revenue: 1406000, transactions: 3 },
  { day: "Min", date: "2025-05-23", revenue: 599000, transactions: 1 },
];

export const stats = {
  totalProducts: products.length,
  totalTransactions: transactions.length,
  totalRevenue: transactions.reduce((sum, t) => (t.status !== "cancelled" ? sum + t.totalAmount : sum), 0),
  totalCustomers: new Set(transactions.map((t) => t.user.email)).size,
  pendingTransactions: transactions.filter((t) => t.status === "pending").length,
  lowStockProducts: products.filter((p) => p.stock > 0 && p.stock < 10).length,
  outOfStockProducts: products.filter((p) => p.stock === 0).length,
  activeSeasons: seasons.filter((s) => s.isActive).length,
};
