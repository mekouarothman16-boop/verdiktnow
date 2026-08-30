export const legal = {
  contentHeader: {
    backHome: "Retour à l'accueil",
  },
  myTasks: {
    metaTitle: "Mes tâches · CADRAN",
    title: "Mes tâches",
    subtitle: "Les étapes de feuille de route qui vous sont assignées, tous processus confondus, triées par échéance.",
    emptyTitle: "Aucune tâche assignée",
    emptyText: "Assignez-vous une étape depuis la feuille de route d'un processus pour la voir apparaître ici.",
    overdueBadge: "en retard",
    noDueDate: "Aucune échéance",
    backToPortfolio: "Retour au portefeuille",
  },
  aide: {
    title: "Aide",
    subtitle: "Questions fréquentes sur CADRAN. Vous ne trouvez pas votre réponse ? Écrivez-nous directement.",
    metaTitle: "Aide · CADRAN",
    faq: [
      {
        q: "Comment fonctionne le score d'aptitude ?",
        a: "Vous répondez à 30 énoncés répartis sur 6 leviers (standardisation, règles, données, volume, faisabilité technique, risque). Chaque levier est pondéré ; le score global se recalcule en direct à mesure que vous répondez ou ajustez les pondérations.",
      },
      {
        q: "Le score ou le rapport garantissent-ils un résultat ?",
        a: "Non. Ce sont des aides à la décision basées sur une auto-évaluation individuelle, à valider avec les autres intervenants du processus avant tout engagement budgétaire. La fiabilité de chaque évaluation est d'ailleurs indiquée dans le rapport.",
      },
      {
        q: "Y a-t-il un forfait gratuit ?",
        a: "Oui. Votre premier processus est gratuit, sans carte de crédit : contexte, diagnostic d'aptitude complet, calculateur de ROI et priorisation inclus. L'export PDF, l'analyse par IA et un deuxième processus nécessitent un forfait payant. Voir la section Tarifs pour les paliers disponibles.",
      },
      {
        q: "Comment fonctionne l'analyse par IA ?",
        a: "Sur la page Contexte du diagnostic, le bouton « Analyser avec l'IA » envoie les informations qualitatives que vous avez saisies à Anthropic (Claude) pour suggérer des scores de départ et des risques à surveiller. Rien n'est envoyé sans cette action explicite. Chaque forfait payant inclut un quota mensuel d'analyses.",
      },
      {
        q: "Puis-je inviter des collègues ?",
        a: "Oui, depuis « Mon abonnement ». Vous choisissez leur rôle : Membre (accès complet) ou Lecteur (consultation seule, sans modification).",
      },
      {
        q: "Comment partager un processus avec quelqu'un qui n'a pas de compte ?",
        a: "Depuis l'outil, le bouton « Partager » génère un lien de lecture seule consultable sans compte. Vous pouvez le révoquer à tout moment.",
      },
      {
        q: "Puis-je annuler mon abonnement ?",
        a: "Oui, à tout moment depuis « Mon abonnement » → « Gérer mon abonnement ». L'accès payant reste actif jusqu'à la fin de la période déjà payée.",
      },
      {
        q: "Comment supprimer mon compte ou exporter mes données ?",
        a: "Les deux sont accessibles en libre-service depuis « Mon abonnement ». L'export produit un fichier JSON de toutes vos données ; la suppression est définitive.",
      },
      {
        q: "Mes données sont-elles visibles par d'autres organisations ?",
        a: "Non. Chaque organisation ne voit que ses propres processus, imposé au niveau de la base de données, pas seulement de l'interface.",
      },
    ],
    needHelp: "Besoin d'aide supplémentaire ?",
    needHelpText: "Écrivez-nous directement, nous répondons personnellement.",
  },
  apropos: {
    metaTitle: "À propos · CADRAN",
    title: "À propos",
    whoTitle: "Qui suis-je ?",
    whoText: "Je suis CADRAN, un diagnostic d'aptitude à l'automatisation. Mon travail : évaluer si un processus métier est prêt à être automatisé, chiffrer sa valeur économique, le prioriser face aux autres, et produire un dossier d'affaires assez rigoureux pour être présenté à une direction financière — le tout en une seule séance, pas en semaines de mandat de conseil.",
    missionTitle: "Ma mission",
    missionText: "Remplacer le ressenti par des chiffres avant qu'un budget d'automatisation ne soit engagé. La plupart des projets d'automatisation échouent non pas à cause de l'outil choisi, mais parce que le processus n'était pas prêt — un problème qu'un score sur 100 et un dossier d'affaires chiffré permettent de voir avant, pas après.",
    valuesTitle: "Mes valeurs",
    values: [
      {
        title: "Transparence",
        text: "La transparence des hypothèses prime sur l'apparence de précision. Chaque chiffre que j'affiche explique d'où il vient et à quel point il est incertain.",
      },
      {
        title: "Rigueur qui protège",
        text: "Un plafond ou un avertissement dérivé de votre contexte corrige toujours vers le bas, jamais vers le haut. Aucun mécanisme ne peut flatter artificiellement un score.",
      },
      {
        title: "Honnête à chaque palier",
        text: "Je reste utilisable et honnête au palier gratuit. Les paliers payants ajoutent de la portée, jamais de l'intégrité de calcul.",
      },
      {
        title: "Bilingue par défaut",
        text: "Français et anglais dès le premier jour, jamais une traduction ajoutée après coup ni un anglais approximatif.",
      },
    ],
    historyTitle: "Mon histoire",
    historyParagraphs: [
      "Je suis née d'un constat simple : les organisations qui veulent évaluer leur aptitude à l'automatisation ont historiquement deux options, toutes deux insatisfaisantes. Engager une firme de conseil, pour plusieurs milliers de dollars et plusieurs semaines d'entretiens, pour un diagnostic qui appartient à quelqu'un d'autre à la fin du mandat. Ou se contenter d'un outil générique gratuit, qui ne pousse jamais l'analyse jusqu'au dossier d'affaires chiffré qu'une direction financière exige réellement.",
      "Je comble cet écart : la rigueur d'un mandat de conseil — pondération explicite, analyse de sensibilité, registre de risques, matrice RACI — sans son prix ni son délai. Je suis un produit jeune, construit et opéré en solo, sans levée de fonds ni client de référence à afficher : ce que je peux vous montrer aujourd'hui, c'est la méthode elle-même, pas une liste de logos.",
    ],
  },
  confidentialite: {
    metaTitle: "Politique de confidentialité · CADRAN",
    title: "Politique de confidentialité",
    lastUpdated: "Dernière mise à jour :",
    notice:
      "Avis important : ce texte est un premier jet rédigé pour couvrir honnêtement ce que CADRAN fait réellement de vos données. Ce n'est pas un avis juridique : il doit être révisé par un professionnel du droit avant de constituer votre politique officielle.",
    intro:
      "CADRAN (« nous ») exploite un outil d'évaluation de l'aptitude à l'automatisation des processus d'affaires. Cette politique explique quelles données nous collectons, pourquoi, et quels sont vos droits.",
    sections: [
      {
        h2: "1. Données que nous collectons",
        items: [
          "Compte : adresse courriel et mot de passe (géré par notre fournisseur d'authentification, Supabase ; nous ne voyons jamais votre mot de passe en clair).",
          "Contenu que vous saisissez : noms de processus, descriptions qualitatives, réponses au diagnostic, paramètres financiers, commentaires, étiquettes, tout ce que vous entrez dans l'outil.",
          "Organisation : les membres de votre organisation (courriel, rôle) si vous invitez des collègues.",
          "Facturation : gérée entièrement par Stripe. Nous ne stockons jamais votre numéro de carte, seulement l'identifiant de votre abonnement.",
          "Cookies techniques : uniquement ceux nécessaires à votre session de connexion. Aucun cookie publicitaire ou de suivi tiers.",
        ],
      },
      {
        h2: "2. Pourquoi nous collectons ces données",
        p: "Exclusivement pour faire fonctionner le service : authentifier votre compte, sauvegarder vos évaluations, calculer vos scores et votre ROI, générer vos rapports PDF, traiter les paiements et vous permettre de collaborer avec les membres de votre organisation. Nous ne vendons pas vos données et ne les utilisons pas à des fins publicitaires.",
      },
      {
        h2: "3. Partage avec des tiers",
        p: "Nous faisons appel aux sous-traitants suivants pour opérer le service :",
        items: [
          "Supabase : hébergement de la base de données et authentification.",
          "Stripe : traitement des paiements et facturation.",
          "Anthropic (Claude) : uniquement lorsque vous cliquez sur « Analyser avec l'IA », le contexte que vous avez saisi pour ce processus est envoyé à Anthropic pour générer une suggestion de scores et de risques. Aucun envoi n'a lieu sans cette action explicite de votre part.",
        ],
        p2: "Nous ne partageons vos données avec aucun autre tiers, et ne les vendons à personne.",
      },
      {
        h2: "4. Conservation",
        p: "Vos données sont conservées tant que votre compte est actif. Si vous supprimez un processus, il est effacé immédiatement (sauf s'il est d'abord archivé, auquel cas il reste récupérable jusqu'à suppression définitive). Si vous supprimez votre compte, voir la section 6 ci-dessous.",
      },
      {
        h2: "5. Sécurité",
        p: "L'accès à vos données est protégé par un contrôle d'accès au niveau de la base de données (Row Level Security) : un membre d'une organisation ne peut voir que les processus de cette organisation. Les échanges avec le service sont chiffrés en transit (HTTPS).",
      },
      {
        h2: "6. Vos droits",
        p: "Vous pouvez, à tout moment et vous-même, depuis la page « Mon abonnement » :",
        items: [
          "Exporter une copie de toutes vos données au format JSON.",
          "Supprimer définitivement votre compte et vos données associées.",
        ],
        p2: "Pour toute autre demande (rectification, question sur vos données), écrivez-nous à",
      },
      {
        h2: "7. Modifications",
        p: "Si cette politique change de façon significative, nous vous en informerons par courriel ou par un avis dans l'application avant que les changements prennent effet.",
      },
      {
        h2: "8. Contact",
        p: "Des questions ? Écrivez à",
      },
    ],
  },
  conditions: {
    metaTitle: "Conditions d'utilisation · CADRAN",
    title: "Conditions d'utilisation",
    lastUpdated: "Dernière mise à jour :",
    notice:
      "Avis important : ce texte est un premier jet, pas un avis juridique. Il doit être révisé par un professionnel du droit, notamment la juridiction applicable et l'entité légale exploitante, laissées à compléter ci-dessous, avant de constituer vos conditions officielles.",
    intro: "En créant un compte ou en utilisant CADRAN, vous acceptez les conditions suivantes.",
    sections: [
      {
        h2: "1. Le service",
        p: "CADRAN est un outil d'évaluation de l'aptitude à l'automatisation de processus d'affaires : diagnostic, calcul de retour sur investissement, priorisation et génération de rapports. Les scores, recommandations et estimations produits sont des aides à la décision basées sur les informations que vous fournissez : ce ne sont ni des garanties de résultat, ni un avis professionnel (juridique, comptable, technique ou financier). Vous demeurez responsable de valider toute décision d'automatisation avec vos propres experts avant de vous engager.",
      },
      {
        h2: "2. Votre compte",
        items: [
          "Vous êtes responsable de la confidentialité de vos identifiants de connexion.",
          "Vous devez fournir une adresse courriel valide et exacte.",
          "Un compte est associé à une organisation ; le propriétaire peut inviter d'autres membres et gérer leurs rôles.",
        ],
      },
      {
        h2: "3. Vos données",
        pBeforeLink: "Vous conservez l'entière propriété du contenu que vous saisissez (processus, réponses, commentaires). Nous ne l'utilisons que pour vous fournir le service, comme décrit dans notre",
        linkText: "politique de confidentialité",
      },
      {
        h2: "4. Abonnement et facturation",
        items: [
          "Un premier processus est gratuit, sans carte de crédit requise (contexte, diagnostic, ROI et priorisation inclus ; export PDF et analyse par IA exclus). Un abonnement payant est requis pour tout processus additionnel.",
          "Les forfaits sont facturés mensuellement via Stripe et peuvent être annulés à tout moment depuis la page « Mon abonnement » ; l'accès payant reste actif jusqu'à la fin de la période déjà payée.",
          "Nous nous réservons le droit d'ajuster les prix des forfaits, avec préavis raisonnable aux abonnés existants.",
        ],
      },
      {
        h2: "5. Utilisation acceptable",
        p: "Vous vous engagez à ne pas :",
        items: [
          "Utiliser le service à des fins illégales ou pour y stocker du contenu illégal.",
          "Tenter de contourner les limites techniques (quotas, sécurité) du service.",
          "Revendre ou redistribuer l'accès au service sans autorisation écrite.",
        ],
      },
      {
        h2: "6. Limitation de responsabilité",
        p: "CADRAN est fourni « tel quel ». Dans la mesure permise par la loi applicable, nous ne pouvons être tenus responsables des décisions d'affaires prises sur la base des évaluations produites par l'outil, ni des pertes indirectes découlant de l'utilisation ou de l'impossibilité d'utiliser le service.",
      },
      {
        h2: "7. Résiliation",
        p: "Vous pouvez supprimer votre compte à tout moment depuis la page « Mon abonnement ». Nous pouvons suspendre ou résilier un compte en cas de violation manifeste de ces conditions.",
      },
      {
        h2: "8. Droit applicable",
        pItalic:
          "[À compléter : juridiction et entité légale exploitant CADRAN. Cette section doit être précisée avec un conseiller juridique avant publication.]",
      },
      {
        h2: "9. Contact",
        p: "Des questions sur ces conditions ? Écrivez à",
      },
    ],
  },
};
