import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { MongoClient } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017";
const DB_NAME = process.env.MONGODB_DB_NAME || "my_app";

async function run() {
	const filePath = resolve(process.cwd(), "db/seed/products.json");
	const raw = await readFile(filePath, "utf-8");
	const products = JSON.parse(raw);

	const client = new MongoClient(MONGODB_URI);
	await client.connect();

	const db = client.db(DB_NAME);
	const collection = db.collection("products");

	await collection.createIndex({ id: 1 }, { unique: true });

	const operations = products.map((product) => ({
		updateOne: {
			filter: { id: product.id },
			update: { $set: product },
			upsert: true,
		},
	}));

	if (operations.length > 0) {
		await collection.bulkWrite(operations);
	}

	console.log(`Seeded ${products.length} products into ${DB_NAME}.products`);
	await client.close();
}

run().catch((error) => {
	console.error("Seed failed:", error);
	process.exit(1);
});
