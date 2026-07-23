# Functional Breakdown Structure (FBS)

Outil UrBizia de gestion de l'arborescence fonctionnelle (FBS) — application web statique (HTML/JS), sans backend applicatif propre : les données sont hébergées et synchronisées via [Supabase](https://supabase.com) (base de données + authentification), et l'accès est réservé aux personnes invitées.

## Fonctionnement

- `index.html` est l'application complète (aucune étape de build nécessaire).
- Au chargement, l'utilisateur doit se connecter avec un compte Supabase Auth (email + mot de passe) créé par un administrateur.
- Les données de référence (FBS, arborescence, lexique, acronymes, compétences) sont partagées entre tous les utilisateurs connectés.
- Les données de travail (contractors, scope of work) sont visibles par tous mais modifiables uniquement par leur créateur.
- Les administrateurs peuvent importer/réinitialiser la base de référence depuis l'onglet Paramètres ; toute modification (y compris les éditions ponctuelles de couleur/icône) se synchronise automatiquement avec Supabase.
- Une sauvegarde complète de la base est déclenchée automatiquement à la connexion si la précédente date de plus de 7 jours (fonction Edge `backup-database`, stockée dans le bucket Supabase Storage `db-backups`).

## Développement

Aucune dépendance à installer : ouvrir `index.html` directement, ou le servir via n'importe quel serveur statique.

## Migration

`scripts/migrate.js` documente l'extraction ponctuelle des données depuis l'ancienne version 100% locale (`INITIAL_RAW` embarqué dans le HTML) vers les tables Supabase — conservé pour traçabilité, pas nécessaire à l'usage courant.
