# trouvetavoie — consignes pour Claude

Site d'orientation pour lycéens : https://trouvetavoie.pages.dev
Dépôt public, déployé automatiquement par Cloudflare Pages depuis `main`.
Ce fichier est public lui aussi : n'y mets jamais de données personnelles, de mot de passe ni de code d'accès.

Le propriétaire écrit en français, souvent en langage oral (dictée). Réponds en français, simplement, sans jargon.

## Règles à toujours respecter

1. **Montrer avant de publier.** Toute modification du site se fait sur une branche, avec un aperçu (lien d'artifact et captures d'écran lisibles, format téléphone). On ne pousse sur `main` que quand le propriétaire dit « publie ».
2. **Anonymat.** Aucun nom du propriétaire sur le site, ni dans la page « Notre histoire ». Seules les mentions légales portent l'identité de l'éditeur, car c'est obligatoire.
3. **Jamais de faux chiffres ni de faux avis.** Pas de « +5000 étudiants », pas de témoignages inventés. On n'affiche que des compteurs réels (nombre de métiers, de chemins…).
4. **Jamais de mot de passe.** Ne jamais en demander ni en accepter. On ne peut pas publier sur TikTok à sa place : il programme lui-même dans TikTok Studio.
5. **Paiements.** Ne pas activer de vrais paiements tant que le SIRET n'est pas reçu et ajouté aux mentions légales.

## Structure du site

- `index.html` : toute l'application, une seule page avec routes par `#` (`#accueil`, `#metiers`, `#metier-<cle>`, `#quiz`, `#ecoles`, `#plan`, `#comparer`, `#calendrier`, `#parents`, `#paiement`, `#a-propos`, `#mentions`, `#cgv`, `#confidentialite`…).
- Données dans `index.html` : `METIERS`, `EXTRA`, `PSUP`, `SALAIRES`, `UNIVERS`, `Q` (quiz), `OFFERS` (prix), `CAL` (dates Parcoursup 2027), `VIDEOS` (métiers qui ont une vidéo).
- `tools/pages-metiers.mjs` : génère les pages statiques `/metiers/<cle>/`, `/apres-bac/<bac>/`, `/calendrier-parcoursup-2027/`, `sitemap.xml`, `robots.txt`. À relancer après toute modification des données (`node tools/pages-metiers.mjs`).
- `tools/ajouter-video.mjs <cle> <video.mp4> <miniature.png>` : ajoute la vidéo d'un métier sur sa fiche (`videos/<cle>.mp4` + `.jpg`, met à jour `VIDEOS`).
- `functions/api/` : paiement (pas encore actif en vrai), `checkout.js` (POST : e-mail + mot de passe choisis à l'achat), `compte.js` (connexion sur un autre appareil : e-mail + mot de passe, empreinte PBKDF2 rangée dans les métadonnées du paiement Stripe, aucune base de données), `acces.js` (accès test du propriétaire : le code est dans la variable Cloudflare `ACCES_TEST`, jamais dans le site).
- `functions/api/admin.js` : liste privée (clé `ADMIN_CLE`) des nouveaux achats et des demandes de mot de passe, lue par la tâche programmée des e-mails. Modèles d'e-mails : `tools/mails.md`.
- Exemple de plan (profil fictif, `EX_QA`) affiché sur l'accueil, la page de paiement et la page parents.
- Tests : servir le dossier (`python3 -m http.server 8123`) et vérifier avec Playwright qu'il n'y a aucune erreur JS, en version gratuite et en version payante.

## Gratuit / payant

- **Gratuit** : quiz complet (résultats de base), fiches métiers (but, quotidien, qualités, salaire, chemins), calendrier Parcoursup, favoris, page parents.
- **Essentiel (4,99 €)** : analyse complète du quiz, conseils et points de vigilance des fiches (coût, sélectivité), comparateur de métiers, métiers par bac.
- **Complet (9,99 €)** : tout l'Essentiel + plan Parcoursup personnalisé (8 parties : objectif, parcours année par année, 3 pistes comparées, vœux ambitieux / réalistes / plan B, points d'attention, projet motivé, où candidater, calendrier + to-do, export PDF) + 5 lettres de motivation.
- Paiement unique, pas d'abonnement. Le propriétaire trouvait qu'il y avait « trop de gratuit » : ne pas rendre gratuit ce qui est payant sans son accord.

## E-mails (boîte du site : trouvetavoie2027@gmail.com, connectée à Claude)

- Automatiques : bienvenue après un achat, lien « nouveau mot de passe ». Modèles dans `tools/mails.md`.
- Messages reçus : Claude prépare seulement des **brouillons** ; le propriétaire relit et envoie lui-même.
- Pour que ça marche : variable Cloudflare `ADMIN_CLE` + la même valeur enregistrée comme clé réseau de l'environnement Claude pour `trouvetavoie.pages.dev` (jamais écrite dans le dépôt ni dans le chat).

## Vidéos TikTok (« métier du jour »)

- Projet Remotion dans `tiktok/remotion` (`node render.mjs` choisit le métier du jour et produit mp4, miniature, description).
- Format : 30–40 s, verticale, pro et animée, avec la mascotte (un élève) et des effets sonores.
- Contenu : activité, but, quotidien, qualités, salaire. **Jamais le parcours d'études.**
- Voix : Kokoro (sherpa-onnx < 2), mélange 20 % Puck / 80 % Siwis, vitesse 1,15, lue en continu par scène. Le propriétaire veut une voix jeune, naturelle, **sans accent**.
- Une tâche programmée envoie chaque matin (7 h 39, heure de Paris) la vidéo, la miniature et la description, l'ajoute à la galerie et sur la fiche du métier.
- TikTok : @trouvetavoie.com

## Où on en est (à mettre à jour)

- 25/11/2026 : publication du plan Parcoursup détaillé, de l'analyse payante, du comparateur, des pages par bac, du calendrier, des favoris et de la page parents.
- Micro-entreprise : dossier envoyé au guichet unique (INPI) le 25/11/2026, activité « exploitation de portails Internet ». **En attente du SIRET.**

## À faire

- Le propriétaire doit créer la variable `ACCES_TEST` sur Cloudflare (code choisi par lui, jamais écrit ici) pour retrouver son accès test.

- Quand le SIRET arrive : compléter les mentions légales et les CGV (SIRET, « TVA non applicable, art. 293 B du CGI », médiateur de la consommation), puis activer les vrais paiements.
- Nouveau style de vidéo : le propriétaire doit envoyer un lien de vidéo modèle.
- Corriger les phrases « quotidien » mal découpées de certains nouveaux métiers (ex. contrôleur aérien).
