/**
 * One-time, idempotent migration:
 *   legacy collection.selectionGallery + project.selectedImageIds
 *   → studios/{domain}/projects/{projectId}/selectionGalleries/default
 *     + selections/{photoKey} references (no Storage copies).
 *
 * Usage (with Firebase emulators or production credentials):
 *   node scripts/migrate-selection-galleries.js --domain <studio-domain> [--project <projectId>] [--dry-run]
 *
 * The script uses the client SDK already configured in src/firebase/app.js,
 * so it inherits the current environment (emulator when FIRESTORE_EMULATOR_HOST is set).
 * Safe to run more than once: existing selection docs are skipped, gallery is created once.
 */

const args = process.argv.slice(2);
const getArg = (flag) => {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : null;
};

const DRY_RUN = args.includes('--dry-run');
const DOMAIN = getArg('--domain');
const PROJECT = getArg('--project');

async function main() {
  if (!DOMAIN) {
    console.error('Usage: node scripts/migrate-selection-galleries.js --domain <studio-domain> [--project <projectId>] [--dry-run]');
    process.exit(1);
  }
  // Dynamic imports keep the script runnable without bundler config
  const { db } = await import('../src/firebase/app.js');
  const { collection, getDocs, getDoc, doc } = await import('firebase/firestore');
  const { ensureDefaultGallery, migrateLegacySelectionsToGallery } = await import(
    '../src/firebase/functions/selection-gallery-firestore.js'
  );

  const projectsRef = collection(db, 'studios', DOMAIN, 'projects');
  const projectsSnap = await getDocs(projectsRef);
  const targets = projectsSnap.docs.filter((d) => (!PROJECT || d.id === PROJECT));
  console.log(`Found ${targets.length} project(s) in studio "${DOMAIN}"${PROJECT ? ` (filtered: ${PROJECT})` : ''}${DRY_RUN ? ' [DRY RUN]' : ''}`);

  const report = [];
  for (const pDoc of targets) {
    const projectId = pDoc.id;
    const data = pDoc.data();
    const hasLegacy = Array.isArray(data.collections) && data.collections.some((c) => c.selectionGallery === true);
    const hasSelectedIds = Array.isArray(data.selectedImageIds) && data.selectedImageIds.length > 0;
    if (!hasLegacy && !hasSelectedIds) {
      report.push({ projectId, skipped: true, reason: 'no legacy selection' });
      continue;
    }
    if (DRY_RUN) {
      report.push({ projectId, dryRun: true, legacyCollections: (data.collections || []).filter((c) => c.selectionGallery === true).map((c) => c.id), selectedIds: (data.selectedImageIds || []).length });
      continue;
    }
    try {
      await ensureDefaultGallery(DOMAIN, projectId);
      const result = await migrateLegacySelectionsToGallery(DOMAIN, projectId, { ...data, id: projectId });
      console.log(`✔ ${projectId}: migrated=${result.migrated} skipped=${result.skipped} total=${result.total}`);
      result.log.forEach((l) => console.log(`   ${l}`));
      report.push({ projectId, ...result });
    } catch (e) {
      console.error(`✘ ${projectId}: ${e.message}`);
      report.push({ projectId, error: e.message });
    }
  }
  console.log('\nMigration report:');
  console.log(JSON.stringify(report, null, 2));
}

main().catch((e) => {
  console.error('Migration failed:', e);
  process.exit(1);
});
