const sql = `
PRAGMA foreign_keys = ON;
DROP TABLE IF EXISTS savings_contributions;
DROP TABLE IF EXISTS wishlist_items;
DROP TABLE IF EXISTS savings_buckets;
`;

export const migration003 = {
  version: 3,
  sql,
};
