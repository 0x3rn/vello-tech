import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const productCondition = pgEnum("product_condition", ["new", "used", "refurbished"]);
export const userRole = pgEnum("user_role", ["admin", "user"]);
export const orderStatus = pgEnum("order_status", ["pending", "processing", "shipped", "delivered", "cancelled"]);

export const users = pgTable(
  "users",
  {
    id: text("id").primaryKey(), // Firebase Auth UID; preserved during migration.
    email: text("email"),
    name: text("name"),
    phoneNumber: text("phone_number"),
    role: userRole("role").notNull().default("user"),
    rewardsPoints: integer("rewards_points").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }),
    sourceData: jsonb("source_data").notNull().default({}),
  },
  (table) => [uniqueIndex("users_email_unique").on(table.email)],
);

export const addresses = pgTable(
  "addresses",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    isDefault: boolean("is_default").notNull().default(false),
    sourceData: jsonb("source_data").notNull().default({}),
  },
  (table) => [index("addresses_user_id_idx").on(table.userId)],
);

export const paymentMethods = pgTable(
  "payment_methods",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    sourceData: jsonb("source_data").notNull().default({}),
  },
  (table) => [index("payment_methods_user_id_idx").on(table.userId)],
);

export const categories = pgTable(
  "categories",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    parentCategoryId: text("parent_category_id"),
  },
  (table) => [uniqueIndex("categories_slug_unique").on(table.slug), index("categories_parent_id_idx").on(table.parentCategoryId)],
);

export const products = pgTable(
  "products",
  {
    id: text("id").primaryKey(),
    categoryId: text("category_id").notNull().references(() => categories.id),
    subcategoryId: text("subcategory_id"),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    brand: text("brand"),
    description: text("description"),
    condition: productCondition("condition").notNull().default("new"),
    price: numeric("price", { precision: 12, scale: 2 }).notNull(),
    discountPrice: numeric("discount_price", { precision: 12, scale: 2 }),
    stockQuantity: integer("stock_quantity").notNull().default(0),
    rating: numeric("rating", { precision: 3, scale: 2 }).notNull().default("0"),
    numReviews: integer("num_reviews").notNull().default(0),
    isFeatured: boolean("is_featured").notNull().default(false),
    isNewArrival: boolean("is_new_arrival").notNull().default(false),
    isBestSeller: boolean("is_best_seller").notNull().default(false),
    isCarousel: boolean("is_carousel").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
    sourceData: jsonb("source_data").notNull().default({}),
  },
  (table) => [
    uniqueIndex("products_slug_unique").on(table.slug),
    index("products_category_id_idx").on(table.categoryId),
    index("products_subcategory_id_idx").on(table.subcategoryId),
    index("products_flags_idx").on(table.isFeatured, table.isNewArrival, table.isBestSeller),
  ],
);

export const productColors = pgTable(
  "product_colors",
  {
    id: text("id").primaryKey(),
    productId: text("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    hex: text("hex").notNull(),
    priceModifier: numeric("price_modifier", { precision: 12, scale: 2 }),
    stockQuantity: integer("stock_quantity"),
  },
  (table) => [uniqueIndex("product_colors_product_name_unique").on(table.productId, table.name)],
);

export const productImages = pgTable(
  "product_images",
  {
    id: text("id").primaryKey(),
    productId: text("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
    colorId: text("color_id").references(() => productColors.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    sourceUrl: text("source_url").notNull(),
    storageKey: text("storage_key"),
    alt: text("alt"),
    position: integer("position").notNull().default(0),
  },
  (table) => [index("product_images_product_id_idx").on(table.productId), index("product_images_color_id_idx").on(table.colorId)],
);

export const productSpecifications = pgTable(
  "product_specifications",
  {
    productId: text("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
    key: text("key").notNull(),
    value: text("value").notNull(),
  },
  (table) => [primaryKey({ columns: [table.productId, table.key] })],
);

export const productVariantGroups = pgTable(
  "product_variant_groups",
  {
    id: text("id").primaryKey(),
    productId: text("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    position: integer("position").notNull().default(0),
  },
  (table) => [uniqueIndex("product_variant_groups_product_name_unique").on(table.productId, table.name)],
);

export const productVariantChoices = pgTable(
  "product_variant_choices",
  {
    id: text("id").primaryKey(),
    groupId: text("group_id").notNull().references(() => productVariantGroups.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    priceModifier: numeric("price_modifier", { precision: 12, scale: 2 }).notNull().default("0"),
    stockQuantity: integer("stock_quantity").notNull().default(0),
    position: integer("position").notNull().default(0),
  },
  (table) => [uniqueIndex("product_variant_choices_group_name_unique").on(table.groupId, table.name)],
);

export const cartItems = pgTable(
  "cart_items",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    productId: text("product_id").notNull(),
    quantity: integer("quantity").notNull(),
    configuration: jsonb("configuration").notNull().default({}),
    sourceData: jsonb("source_data").notNull().default({}),
  },
  (table) => [index("cart_items_user_id_idx").on(table.userId)],
);

export const orders = pgTable(
  "orders",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
    customerEmail: text("customer_email"),
    status: orderStatus("status").notNull().default("pending"),
    paymentMethod: text("payment_method"),
    paymentReference: text("payment_reference"),
    totalAmount: numeric("total_amount", { precision: 12, scale: 2 }).notNull().default("0"),
    createdAt: timestamp("created_at", { withTimezone: true }),
    sourceData: jsonb("source_data").notNull().default({}),
  },
  (table) => [index("orders_user_created_at_idx").on(table.userId, table.createdAt), uniqueIndex("orders_payment_reference_unique").on(table.paymentReference)],
);

export const orderItems = pgTable(
  "order_items",
  {
    id: text("id").primaryKey(),
    orderId: text("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
    productId: text("product_id"),
    name: text("name").notNull(),
    slug: text("slug"),
    imageUrl: text("image_url"),
    unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).notNull(),
    quantity: integer("quantity").notNull(),
    configuration: jsonb("configuration").notNull().default({}),
  },
  (table) => [index("order_items_order_id_idx").on(table.orderId)],
);

export const reviews = pgTable(
  "reviews",
  {
    id: text("id").primaryKey(),
    productId: text("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    userName: text("user_name"),
    rating: integer("rating").notNull(),
    title: text("title"),
    comment: text("comment"),
    isVerifiedPurchase: boolean("is_verified_purchase").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }),
  },
  (table) => [uniqueIndex("reviews_user_product_unique").on(table.userId, table.productId), index("reviews_product_created_at_idx").on(table.productId, table.createdAt)],
);

export const shippingRates = pgTable(
  "shipping_rates",
  {
    id: text("id").primaryKey(),
    country: text("country").notNull(),
    state: text("state").notNull(),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  },
  (table) => [uniqueIndex("shipping_rates_country_state_unique").on(table.country, table.state)],
);

export const taxRates = pgTable(
  "tax_rates",
  {
    id: text("id").primaryKey(),
    country: text("country").notNull(),
    state: text("state").notNull(),
    percentage: numeric("percentage", { precision: 7, scale: 4 }),
    amount: numeric("amount", { precision: 12, scale: 2 }),
  },
  (table) => [uniqueIndex("tax_rates_country_state_unique").on(table.country, table.state)],
);

export const appSettings = pgTable("app_settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
});

export const newsletterSubscriptions = pgTable("newsletter_subscriptions", {
  email: text("email").primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const webhookEvents = pgTable("webhook_events", {
  id: text("id").primaryKey(),
  source: text("source").notNull(),
  orderId: text("order_id").references(() => orders.id, { onDelete: "set null" }),
  processedAt: timestamp("processed_at", { withTimezone: true }),
  sourceData: jsonb("source_data").notNull().default({}),
});
