import { createClient } from "@supabase/supabase-js";

const oldUrl = process.env.OLD_SUPABASE_URL;
const oldServiceKey = process.env.OLD_SUPABASE_SERVICE_ROLE_KEY;
const oldAnonKey = process.env.OLD_SUPABASE_ANON_KEY;
const newUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const newServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const oldKey = oldServiceKey || oldAnonKey;

if (!oldUrl || !oldKey) {
  console.error("Missing old Supabase credentials. Set OLD_SUPABASE_URL and OLD_SUPABASE_SERVICE_ROLE_KEY (or OLD_SUPABASE_ANON_KEY).");
  process.exit(1);
}

if (!newUrl || !newServiceKey) {
  console.error("Missing new Supabase credentials. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const oldDb = createClient(oldUrl, oldKey, { auth: { persistSession: false } });
const newDb = createClient(newUrl, newServiceKey, { auth: { persistSession: false } });

function isMissingTable(error) {
  const code = error?.code;
  return code === "42P01" || code === "PGRST205";
}

function extractMissingColumn(error) {
  const message = String(error?.message ?? "");
  const match = message.match(/Could not find the '([^']+)' column/);
  return match?.[1] ?? null;
}

function removeColumnFromRows(rows, columnName) {
  return rows.map((row) => {
    const next = { ...row };
    delete next[columnName];
    return next;
  });
}

async function tableExists(db, tableName) {
  const { error } = await db.from(tableName).select("*").limit(1);
  if (error && isMissingTable(error)) return false;
  if (error) throw error;
  return true;
}

async function fetchAll(db, tableName, columns = "*") {
  const { data, error } = await db.from(tableName).select(columns);
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

async function insertInChunks(db, tableName, rows, chunkSize = 200) {
  if (rows.length === 0) return 0;
  let payload = rows;

  while (true) {
    let inserted = 0;
    let hadSchemaRetry = false;

    for (let i = 0; i < payload.length; i += chunkSize) {
      const chunk = payload.slice(i, i + chunkSize);
      const { error } = await db.from(tableName).insert(chunk);
      if (error) {
        const missingColumn = extractMissingColumn(error);
        if (missingColumn && chunk.some((row) => Object.prototype.hasOwnProperty.call(row, missingColumn))) {
          payload = removeColumnFromRows(payload, missingColumn);
          hadSchemaRetry = true;
          break;
        }
        throw error;
      }
      inserted += chunk.length;
    }

    if (!hadSchemaRetry) {
      return inserted;
    }
  }
}

async function upsertWithSchemaFallback(db, tableName, rows, onConflict) {
  if (rows.length === 0) return 0;
  let payload = rows;

  while (true) {
    const { error } = await db.from(tableName).upsert(payload, { onConflict });
    if (!error) {
      return payload.length;
    }

    const missingColumn = extractMissingColumn(error);
    if (missingColumn && payload.some((row) => Object.prototype.hasOwnProperty.call(row, missingColumn))) {
      payload = removeColumnFromRows(payload, missingColumn);
      continue;
    }

    throw error;
  }
}

async function main() {
  const summary = [];

  const requiredTables = ["games", "categories", "products", "admins"];
  for (const table of requiredTables) {
    const oldHas = await tableExists(oldDb, table);
    const newHas = await tableExists(newDb, table);
    if (!oldHas || !newHas) {
      throw new Error(`Required table missing: ${table} (old=${oldHas}, new=${newHas})`);
    }
  }

  const oldGames = await fetchAll(oldDb, "games");
  const gamePayload = oldGames
    .filter((row) => row?.key && row?.label)
    .map((row) => ({
      key: String(row.key),
      label: String(row.label),
      logo: String(row.logo ?? ""),
      display_order: Number(row.display_order ?? 0),
      is_hidden: Boolean(row.is_hidden ?? false),
    }));

  if (gamePayload.length > 0) {
    await upsertWithSchemaFallback(newDb, "games", gamePayload, "key");
  }

  const newGames = await fetchAll(newDb, "games", "id,key");
  const oldGameById = new Map(oldGames.map((row) => [Number(row.id), String(row.key)]));
  const newGameIdByKey = new Map(newGames.map((row) => [String(row.key), Number(row.id)]));
  summary.push(`games upserted: ${gamePayload.length}`);

  const oldCategories = await fetchAll(oldDb, "categories");
  const categoryPayload = [];
  for (const row of oldCategories) {
    const oldGameKey = oldGameById.get(Number(row.game_id));
    if (!oldGameKey) continue;
    const newGameId = newGameIdByKey.get(oldGameKey);
    if (!newGameId) continue;

    categoryPayload.push({
      game_id: newGameId,
      key: String(row.key),
      label: String(row.label ?? row.key),
      image: String(row.image ?? ""),
      display_order: Number(row.display_order ?? 0),
      is_hidden: Boolean(row.is_hidden ?? false),
    });
  }

  if (categoryPayload.length > 0) {
    await upsertWithSchemaFallback(newDb, "categories", categoryPayload, "game_id,key");
  }

  const newCategories = await fetchAll(newDb, "categories", "id,game_id,key");
  const newCategoryIdByComposite = new Map(
    newCategories.map((row) => [`${Number(row.game_id)}|${String(row.key)}`, Number(row.id)])
  );
  const oldCategoryToNewCategory = new Map();
  for (const oldCategory of oldCategories) {
    const oldGameKey = oldGameById.get(Number(oldCategory.game_id));
    if (!oldGameKey) continue;
    const newGameId = newGameIdByKey.get(oldGameKey);
    if (!newGameId) continue;
    const composite = `${newGameId}|${String(oldCategory.key)}`;
    const newCategoryId = newCategoryIdByComposite.get(composite);
    if (newCategoryId) {
      oldCategoryToNewCategory.set(Number(oldCategory.id), newCategoryId);
    }
  }
  summary.push(`categories upserted: ${categoryPayload.length}`);

  const oldProducts = await fetchAll(oldDb, "products");
  const existingProducts = await fetchAll(newDb, "products", "category_id,title,price");
  const existingProductKeys = new Set(
    existingProducts.map((row) => `${Number(row.category_id)}|${String(row.title).trim()}|${String(row.price).trim()}`)
  );

  const productInserts = [];
  for (const row of oldProducts) {
    const newCategoryId = oldCategoryToNewCategory.get(Number(row.category_id));
    if (!newCategoryId) continue;

    const title = String(row.title ?? "").trim();
    const price = String(row.price ?? "").trim();
    if (!title || !price) continue;

    const key = `${newCategoryId}|${title}|${price}`;
    if (existingProductKeys.has(key)) continue;
    existingProductKeys.add(key);

    productInserts.push({
      category_id: newCategoryId,
      title,
      description: String(row.description ?? ""),
      price,
      original_price: row.original_price ? String(row.original_price) : null,
      discount: Number(row.discount ?? 0),
      is_bestseller: Boolean(row.is_bestseller ?? false),
      image: String(row.image ?? ""),
      display_order: Number(row.display_order ?? 0),
      is_hidden: Boolean(row.is_hidden ?? false),
    });
  }
  const insertedProducts = await insertInChunks(newDb, "products", productInserts);
  summary.push(`products inserted: ${insertedProducts}`);

  const oldAdmins = await fetchAll(oldDb, "admins");
  const adminPayload = oldAdmins
    .filter((row) => row?.key && row?.name && row?.wa_number)
    .map((row) => ({
      key: String(row.key),
      name: String(row.name),
      image: String(row.image ?? ""),
      wa_number: String(row.wa_number),
      is_active: Boolean(row.is_active ?? true),
      is_hidden: Boolean(row.is_hidden ?? false),
      display_order: Number(row.display_order ?? 0),
    }));
  if (adminPayload.length > 0) {
    await upsertWithSchemaFallback(newDb, "admins", adminPayload, "key");
  }
  summary.push(`admins upserted: ${adminPayload.length}`);

  const optionalTables = ["gacha_images", "testimonials", "site_settings"];
  const oldOptional = {};
  const newOptional = {};
  for (const table of optionalTables) {
    oldOptional[table] = await tableExists(oldDb, table);
    newOptional[table] = await tableExists(newDb, table);
  }

  if (oldOptional.gacha_images && newOptional.gacha_images) {
    const oldRows = await fetchAll(oldDb, "gacha_images");
    const newRows = await fetchAll(newDb, "gacha_images", "src");
    const existing = new Set(newRows.map((row) => String(row.src)));
    const inserts = oldRows
      .filter((row) => row?.src && !existing.has(String(row.src)))
      .map((row) => ({
        src: String(row.src),
        alt: String(row.alt ?? ""),
        is_hidden: Boolean(row.is_hidden ?? false),
        display_order: Number(row.display_order ?? 0),
      }));
    const inserted = await insertInChunks(newDb, "gacha_images", inserts);
    summary.push(`gacha_images inserted: ${inserted}`);
  } else {
    summary.push("gacha_images skipped");
  }

  if (oldOptional.testimonials && newOptional.testimonials) {
    const oldRows = await fetchAll(oldDb, "testimonials");
    const newRows = await fetchAll(newDb, "testimonials", "src");
    const existing = new Set(newRows.map((row) => String(row.src)));
    const inserts = oldRows
      .filter((row) => row?.src && !existing.has(String(row.src)))
      .map((row) => ({
        src: String(row.src),
        alt: String(row.alt ?? ""),
        caption: String(row.caption ?? ""),
        is_hidden: Boolean(row.is_hidden ?? false),
        display_order: Number(row.display_order ?? 0),
      }));
    const inserted = await insertInChunks(newDb, "testimonials", inserts);
    summary.push(`testimonials inserted: ${inserted}`);
  } else {
    summary.push("testimonials skipped");
  }

  if (oldOptional.site_settings && newOptional.site_settings) {
    const oldRows = await fetchAll(oldDb, "site_settings");
    const payload = oldRows
      .filter((row) => row?.key)
      .map((row) => ({
        key: String(row.key),
        value: row.value === null || row.value === undefined ? "" : String(row.value),
      }));
    if (payload.length > 0) {
      await upsertWithSchemaFallback(newDb, "site_settings", payload, "key");
    }
    summary.push(`site_settings upserted: ${payload.length}`);
  } else {
    summary.push("site_settings skipped");
  }

  console.log("Migration success:");
  for (const line of summary) {
    console.log(`- ${line}`);
  }
}

main().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
