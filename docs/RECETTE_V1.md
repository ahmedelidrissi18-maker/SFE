# Recette V1

## Comptes de demonstration

- `admin@stagiaires.local`
- `rh@stagiaires.local`
- `encadrant@stagiaires.local`
- `stagiaire@stagiaires.local`

Mot de passe :

```text
valeur de DEFAULT_USER_PASSWORD
```

## Parcours a valider

### 1. Connexion

- ouvrir `/login`
- se connecter avec un compte valide
- verifier la redirection vers `/dashboard`
- verifier qu un mot de passe faux affiche une erreur

### 2. Creation stagiaire

- se connecter en `ADMIN` ou `RH`
- ouvrir `/stagiaires`
- creer un nouveau stagiaire
- verifier la presence du stagiaire dans la liste
- ouvrir la fiche detaillee

### 3. Creation stage

- depuis la fiche stagiaire, creer un stage
- verifier l affectation d un encadrant
- verifier l affichage sur `/stages`

### 4. Soumission rapport

- se connecter en `STAGIAIRE`
- ouvrir `/rapports`
- creer un rapport hebdomadaire
- le soumettre
- verifier son statut `Soumis`

### 5. Validation rapport

- se connecter en `ENCADRANT`
- ouvrir `/rapports`
- ouvrir le rapport soumis
- ajouter un commentaire
- valider ou retourner le rapport

### 6. Ajout document

- se connecter en `ADMIN` ou `RH`
- ouvrir une fiche stagiaire avec stage
- televerser un document PDF
- verifier la ligne du document puis le telechargement

### 7. Restrictions par role

- en `STAGIAIRE`, verifier l absence d acces a `/stagiaires` et `/stages`
- en `ENCADRANT`, verifier l absence d acces a `/stagiaires`
- verifier la page `/acces-refuse`

### 8. Notifications

- verifier l affichage du badge dans l en tete
- ouvrir `/notifications`
- marquer une notification comme lue
- verifier le bouton "Tout marquer comme lu"

## Resultat attendu

La V1 est acceptable pour une recette si tous les parcours ci-dessus passent sans erreur bloquante.
