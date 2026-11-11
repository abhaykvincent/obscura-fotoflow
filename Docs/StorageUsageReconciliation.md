# Studio Storage Usage Reconciliation (FF-STO-001)

This procedure is intentionally separate from the code fix. Do **not** run it
against production without an approved, dry-run reviewed plan.

## Unit contract

| Field | Unit | Notes |
| --- | --- | --- |
| Browser `File.size` | bytes | Source value |
| Photo `originalSize` | bytes | Exact original size |
| Project `totalFileSize` | bytes | Sum of canonical photo `originalSize` |
| Studio `usage.storage.used` | decimal MB | 1 MB = 1,000,000 bytes |
| Studio `usage.storage.quota` | decimal MB | 1 MB = 1,000,000 bytes |

All studio usage writes go through
`src/firebase/functions/storageAccounting.js`. Conversion lives in
`src/utils/storageUnits.js`.

## Accounting path inventory

| Path | Operation | Source unit | Studio unit | Idempotency |
| --- | --- | --- | --- | --- |
| `createProjectPhoto` | photo create | bytes | MB increase | Transaction + existing photoId check |
| `deleteProjectPhoto` | photo delete | bytes | MB decrease | Transaction + photo existence guard |
| `deleteProjectFromFirestore` | project delete | `totalFileSize` bytes | MB decrease | Transaction + project existence guard; archived projects are skipped |
| `updateProjectStorageToArchive` | archive | `totalFileSize` bytes | MB decrease | Already-archived guard |
| `restoreProjectFromArchive` | restore | `totalFileSize` bytes | MB increase | Only when archived |
| `photoMigration.js` | legacy migration | bytes | no change by default | Canonical photo creation without re-accounting |
| `file-firestore.js` compatibility path | collection metadata/linking | MB input for legacy counters only | no studio write | Canonical create owns studio accounting |

## Reconciling existing inflated values

1. **Freeze writes.** Pause bulk migration and reconciliation tooling. Back up or
   export the affected studio and project documents.
2. **Build the authoritative asset population per studio.** Use canonical
   project photos (`studios/{domain}/projects/*/photos/*`). Track legacy
   `uploadedFiles[]` entries separately.
3. **Sum unique billable original sizes in bytes.** De-duplicate by canonical
   `photoId`; do not count the same asset once per collection.
4. **Classify exceptions:** legacy-only assets, assets already accounted by the
   old compatibility path, duplicate records, deleted storage objects and
   assets shared across collections.
5. **Convert the authoritative byte total to decimal MB.** Use
   `totalBytes / 1_000_000`. Do not use MiB.
6. **Compare stored vs calculated values.** Record current, expected and the
   proposed adjustment for each studio.
7. **Produce a dry-run report.** Include studio id, project ids sampled, unique
   asset count, byte total, expected MB, stored MB, adjustment and exception
   notes.
8. **Review the report.** A human must approve every non-zero adjustment. Do not
   blindly divide all usage values by 1,000,000; historical records may already
   contain valid MB values or duplicate increments.
9. **Apply through an authorized, resumable, auditable process.** Write one
   adjustment per studio with an operation id, operator and timestamp. Keep the
   report as the source of truth.
10. **Verify** corrected values against representative studios and projects and
    confirm that a known-size test upload changes usage by the expected MB.

## Rollback

If reconciliation produces unexpected results:

- Stop further reconciliation.
- Preserve records, reports and logs.
- Do not reverse counters blindly.
- Rebuild the expected value from asset-level evidence before applying any
  correction.
