export const plans = {
  free: { label: "Gratuit", tagline: "Aucun abonnement actif" },
  essentiel: { label: "Essentiel", tagline: "Pour démarrer un programme d'automatisation (recommandé pour 1 à 5 utilisateurs)" },
  croissance: { label: "Croissance", tagline: "Pour une équipe qui évalue en continu (recommandé pour 6 à 20 utilisateurs)" },
  entreprise: { label: "Entreprise", tagline: "Prix par utilisateur négocié, support prioritaire" },
};

export const perUserLabel = "utilisateur";

/** Le siège "Spectateur" (rôle viewer) n'est pas une organisation à part : c'est un ajout à
 * la personne sur une organisation Essentiel/Croissance/Entreprise déjà payante. Affiché comme
 * une 4e carte dans la grille de tarification pour rester lisible, mais sans bouton de paiement
 * direct — l'ajout se fait en invitant un membre avec le rôle "Spectateur" dans l'organisation. */
export const viewerSeat = {
  label: "Spectateur",
  unitLabel: "personne",
  tagline: "Pour visualiser les processus complétés par vos collègues, sans les modifier",
  addOnNote: "S'ajoute à une organisation Essentiel, Croissance ou Entreprise — invitez un membre avec le rôle Spectateur depuis votre compte.",
  inviteHint: "Spectateur : {price}.",
};
