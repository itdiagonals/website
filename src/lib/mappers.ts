import type {
  Product as BackendProduct,
  Season as BackendSeason,
  Category as BackendCategory,
  Media as BackendMedia,
  ProductColor as BackendColor,
  ProductSize as BackendSize,
  ProductGalleryItem as BackendGalleryItem,
  ProductVariant as BackendVariant,
  CareGuide as BackendCareGuide,
} from "./api";
import type {
  Product,
  Season,
  Category,
  Media,
  ProductColor,
  ProductSize,
  ProductGalleryItem,
  ProductVariant,
  CareGuide,
} from "./dummy-data";

export function mapBackendMedia(media: BackendMedia | undefined): Media | null {
  if (!media) return null;
  return {
    id: media.id,
    url: media.url,
    alt: media.alt,
  };
}

export function mapBackendCategory(cat: BackendCategory | undefined): Category | null {
  if (!cat) return null;
  return {
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    coverImageId: cat.cover_image_id,
    coverImage: mapBackendMedia(cat.cover_image),
    createdAt: cat.created_at,
    updatedAt: cat.updated_at,
  };
}

export function mapBackendSeason(season: BackendSeason | undefined): Season | null {
  if (!season) return null;
  return {
    id: season.id,
    name: season.name,
    slug: season.slug,
    subtitle: season.subtitle ?? "",
    description: season.description ?? "",
    coverImageId: season.cover_image_id,
    coverImage: mapBackendMedia(season.cover_image),
    isActive: season.is_active,
    lookbookImages:
      (season.lookbook_images?.map(mapBackendMedia).filter(Boolean) as Media[]) ??
      [],
    createdAt: season.created_at,
    updatedAt: season.updated_at,
  };
}

export function mapBackendColor(color: BackendColor): ProductColor {
  return {
    id: color.id,
    name: color.color_name,
    hex: color.hex_code,
  };
}

export function mapBackendSize(size: BackendSize): ProductSize {
  return {
    id: size.id,
    name: size.size,
    label: size.size,
  };
}

export function mapBackendGalleryItem(item: BackendGalleryItem): ProductGalleryItem {
  return {
    id: item.id,
    imageUrl: item.image?.url ?? "",
    sortOrder: item._order,
  };
}

export function mapBackendVariant(variant: BackendVariant): ProductVariant {
  return {
    id: variant.id,
    color: variant.color_name,
    size: variant.size,
    sku: "",
    stock: variant.stock,
    priceAdjustment: 0,
  };
}

export function mapBackendCareGuide(cg: BackendCareGuide | undefined): CareGuide | null {
  if (!cg) return null;
  return {
    id: cg.id,
    title: cg.title,
    instructions: cg.instructions ?? null,
    createdAt: cg.created_at,
    updatedAt: cg.updated_at,
  };
}

export function mapBackendProduct(bp: BackendProduct): Product {
  return {
    id: bp.id,
    name: bp.name,
    slug: bp.slug,
    seasonId: bp.season_id,
    season:
      mapBackendSeason(bp.season) ?? {
        id: 0,
        name: "",
        slug: "",
        subtitle: "",
        description: "",
        coverImageId: 0,
        coverImage: null,
        isActive: false,
        lookbookImages: [],
        createdAt: "",
        updatedAt: "",
      },
    categoryId: bp.category_id,
    category:
      mapBackendCategory(bp.category) ?? {
        id: 0,
        name: "",
        slug: "",
        coverImageId: 0,
        coverImage: null,
        createdAt: "",
        updatedAt: "",
      },
    gender: bp.gender,
    basePrice: bp.base_price,
    weight: bp.weight,
    length: bp.length,
    width: bp.width,
    height: bp.height,
    stock: bp.stock,
    description: bp.description ?? "",
    coverImageId: bp.cover_image_id,
    coverImage: mapBackendMedia(bp.cover_image),
    detailInfo: bp.detail_info ?? null,
    careGuideId: bp.care_guide_id,
    careGuide: mapBackendCareGuide(bp.care_guide),
    availableColors: bp.available_colors?.map(mapBackendColor) ?? [],
    availableSizes: bp.available_sizes?.map(mapBackendSize) ?? [],
    gallery: bp.gallery?.map(mapBackendGalleryItem) ?? [],
    variants: bp.variants?.map(mapBackendVariant) ?? [],
    createdAt: bp.created_at,
    updatedAt: bp.updated_at,
  };
}
