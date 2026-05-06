const { MongoClient, ObjectId } = require('mongodb');
const uri = process.env.MONGO_DB_URL;
(async () => {
  const c = new MongoClient(uri);
  await c.connect();
  const db = c.db('test');
  const products = await db.collection('inventoryproducts').find({}).limit(5).toArray();
  console.log("Sample products:");
  for (const p of products) {
    console.log(JSON.stringify({ _id: p._id, name: p.name, sku: p.sku, unit: p.unit, unitOfMeasureId: p.unitOfMeasureId }, null, 2));
  }
  // Check uoms
  const uoms = await db.collection('inventoryuoms').find({}).limit(5).toArray();
  console.log("\nSample uoms:");
  for (const u of uoms) {
    console.log(JSON.stringify({ _id: u._id, name: u.name, symbol: u.symbol }));
  }
  await c.close();
})();
