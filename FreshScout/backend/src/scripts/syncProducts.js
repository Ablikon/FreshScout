import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import { syncAllProducts } from '../services/sync.service.js';

async function run() {
  await connectDB();
  console.log('Starting manual sync...');
  const count = await syncAllProducts();
  console.log(`Synced ${count} products`);
  await mongoose.disconnect();
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
