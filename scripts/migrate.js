#!/usr/bin/env node
// One-time migration: extract INITIAL_RAW from the legacy local-only HTML file
// and generate SQL INSERT statements for the Supabase schema (see README).
//
// Usage:
//   node scripts/migrate.js path/to/UrBizia_FBS_v12.0.html > migration.sql
//
// The generated SQL matches the tables created by the Supabase project
// (fbs, pcrm, acronymes, competences, lexique, lexique_domaines). Run it
// against a fresh project via the SQL editor or `supabase db execute`.

const fs = require("fs");

const file = process.argv[2];
if (!file) {
  console.error("Usage: node migrate.js <path-to-legacy-html>");
  process.exit(1);
}

const html = fs.readFileSync(file, "utf-8");
const match = html.match(/var INITIAL_RAW = (\{[\s\S]*?\});\s*\n/);
if (!match) {
  console.error("Could not find INITIAL_RAW in the given file.");
  process.exit(1);
}
const data = JSON.parse(match[1]);

function esc(v) {
  if (v === null || v === undefined) return "NULL";
  return "'" + String(v).replace(/'/g, "''") + "'";
}
function arr(list) {
  if (!list || !list.length) return "'{}'";
  return "ARRAY[" + list.map(esc).join(",") + "]::text[]";
}

const out = [];

out.push("insert into fbs (id, idu, type_id, no, dc, lg, ref, ref_orig, phase, besoin, risque, competences, application, illustrations) values");
out.push(
  data.fbs
    .map(
      (f) =>
        `(${f.id}, ${esc(f.idu)}, ${esc(f.typeId)}, ${esc(f.no)}, ${esc(f.dc)}, ${esc(f.lg)}, ${esc(f.ref)}, ${esc(f.refOrig)}, ${esc(f.phase)}, ${esc(f.besoin)}, ${esc(f.risque)}, ${arr(f.competences)}, ${esc(f.application)}, '[]'::jsonb)`
    )
    .join(",\n") + ";"
);

const maxFbsId = Math.max(...data.fbs.map((f) => f.id));
out.push("\ninsert into pcrm (child_id, parent_id, ord) values");
out.push(
  data.pcrm
    .map((p) => `(${p.childId}, ${p.parentId === 0 ? "NULL" : p.parentId}, ${p.ord ?? "NULL"})`)
    .join(",\n") + ";"
);

out.push("\ninsert into acronymes (id, categorie, ordre, designation, couleur, icon_base64) values");
out.push(
  data.acronymes
    .map(
      (a) =>
        `(${esc(a.id)}, ${esc(a.categorie)}, ${a.ordre ?? "NULL"}, ${esc(a.designation)}, ${esc(a.couleur)}, ${esc(a.iconBase64)})`
    )
    .join(",\n") + ";"
);

out.push("\ninsert into competences (label) values");
out.push(data.competences.map((c) => `(${esc(c)})`).join(",\n") + ";");

out.push("\ninsert into lexique (expression, equivalence, acronyme, domaines, definition) values");
out.push(
  data.lexique
    .map((l) => `(${esc(l.expression)}, ${esc(l.equivalence)}, ${esc(l.acronyme)}, ${arr(l.domaines)}, ${esc(l.definition)})`)
    .join(",\n") + ";"
);

out.push("\ninsert into lexique_domaines (label) values");
out.push(data.lexiqueDomaines.map((d) => `(${esc(d)})`).join(",\n") + ";");

console.log(out.join("\n"));
console.error(
  `\n-- Row counts: fbs=${data.fbs.length} pcrm=${data.pcrm.length} acronymes=${data.acronymes.length} competences=${data.competences.length} lexique=${data.lexique.length} lexiqueDomaines=${data.lexiqueDomaines.length} (max fbs id: ${maxFbsId})`
);
