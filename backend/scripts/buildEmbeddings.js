/**
 * scripts/buildEmbeddings.js
 *
 * One-off backfill script: embed all published FAQs and store vectors in MongoDB.
 * Also warm the in-memory vector index.
 *
 * Usage:
 *   node scripts/buildEmbeddings.js
 *
 * Run from backend/ directory.
 */

require('../config/db');
const FAQ = require('../models/FAQ');
const { embed } = require('../utils/embedder');
const { vectorStore } = require('../utils/vectorStore');

const BATCH_SIZE = 10;

async function main() {
  console.log('[buildEmbeddings] Starting...\n');

  const faqs = await FAQ.find({ status: 'published' }).select('_id question answer category tags');
  const total = faqs.length;
  console.log(`[buildEmbeddings] Found ${total} published FAQs to embed\n`);

  let processed = 0;
  let skipped = 0;
  let errors = 0;

  for (let i = 0; i < faqs.length; i += BATCH_SIZE) {
    const batch = faqs.slice(i, i + BATCH_SIZE);

    await Promise.allSettled(
      batch.map(async (faq) => {
        const textToEmbed = [faq.question, faq.answer, ...(faq.tags || [])].join(' ');

        let embedding;
        try {
          embedding = await embed(textToEmbed);
        } catch (err) {
          console.error(`[buildEmbeddings] ERROR embedding faq ${faq._id}:`, err.message);
          errors++;
          return;
        }

        faq.embedding = embedding;
        faq.embeddingUpdatedAt = new Date();
        await faq.save();

        // Also load into in-memory index
        vectorStore.upsert(faq._id.toString(), embedding, {
          question: faq.question,
          answer: faq.answer,
          category: faq.category,
          tags: faq.tags,
        });

        processed++;
      })
    );

    process.stdout.write(
      `\r  Progress: ${Math.min(i + BATCH_SIZE, total)}/${total}  (${processed} done, ${errors} errors)   `
    );
  }

  console.log(`\n\n[buildEmbeddings] Done.`);
  console.log(`  Processed: ${processed}`);
  console.log(`  Skipped:   ${skipped}`);
  console.log(`  Errors:    ${errors}`);
  console.log(`  Index size: ${vectorStore.size} vectors in memory`);

  process.exit(errors > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('\n[buildEmbeddings] Fatal:', err);
  process.exit(1);
});