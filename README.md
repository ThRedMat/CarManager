# VirtualGarage

VirtualGarage est une application full-stack de suivi d'entretien automobile. Elle permet de visualiser l'état de santé d'un véhicule via une interface interactive et de centraliser tous les justificatifs de maintenance.

Le projet se distingue par une interface "Car-First" qui transforme la lecture d'un historique de factures classique en une expérience interactive de diagnostic visuel.

## Structure du projet

Le dépôt est organisé en deux répertoires principaux :

- **backend/** : API REST développée avec PHP / Symfony.
- **frontend/** : Interface utilisateur développée avec Angular.

## Fonctionnalités principales

- **Garage Virtuel Interactif :** Une vue détaillée par véhicule permettant de cliquer sur des points de contrôle (phares, freins, moteur, etc.) directement sur l'image de la voiture pour filtrer l'historique ou ajouter une intervention.
- **Historique Global :** Une interface d'administration de type "back-office" pour la saisie rapide de maintenance et la vue d'ensemble du parc automobile.
- **Génération de Carnet d'Entretien :** Export instantané au format PDF de l'historique complet d'un véhicule.
- **Gestion des Justificatifs :** Téléchargement et archivage des factures (formats Image et PDF) liées à chaque entretien.
- **Diagnostic Visuel :** Système de pastilles de couleurs (Vert, Orange, Rouge) sur les vues "Extérieur" et "Sous le capot" pour identifier rapidement l'état de santé des pièces.

## Stack Technique

**Frontend :**

- Angular
- SCSS (Architecture Flexbox et design responsive)
- jsPDF & jsPDF-AutoTable (Génération de documents côté client)

**Backend :**

- PHP 8.x / Symfony
- API Platform (Architecture RESTful)
- Doctrine ORM

## Installation et Démarrage

### 1. Configuration du Backend (Symfony)

Placez-vous dans le répertoire backend :

```bash
cd backend

# Installation des dépendances PHP
composer install

# Configuration de la base de données
# Éditez le fichier .env pour renseigner votre DATABASE_URL

# Création de la base et exécution des migrations
php bin/console doctrine:database:create
php bin/console doctrine:migrations:migrate

# Démarrage du serveur local
symfony server:start -d
```

L'API sera exposée sur http://127.0.0.1:8000.

### 2. Configuration du Frontend (Angular)

Placez-vous dans le répertoire frontend :

```bash
cd frontend

# Installation des dépendances Node
npm install

# Démarrage du serveur de développement
ng serve
```

L'interface utilisateur sera accessible sur http://localhost:4200.

### Note sur le déploiement

Lors du déploiement sur des plateformes comme Vercel (Frontend) ou Render/Alwaysdata (Backend), veillez à configurer le Root Directory sur le dossier correspondant dans les paramètres de votre projet pour que le build puisse s'exécuter correctement.

### Architecture des Données

Le modèle de données s'articule autour de deux entités principales :

#### Car : Représente le véhicule (Marque, Modèle, Kilométrage, Image associée).

#### Entretien : Représente une intervention (Type de pièce, Date, Montant, Garage, Fichier justificatif lié).

L'application utilise une logique de filtrage contextuel côté client pour isoler les données pertinentes lors de la navigation visuelle.
