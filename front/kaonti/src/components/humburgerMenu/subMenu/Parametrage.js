const comptaList = [
    {
        text: 'Analytique',
        name: "analytique",
        path: "/tab/parametrages/paramAnalytique",
        urldynamic: true
    },
    {
        text: 'Code journaux',
        name: "codejournaux",
        path: "/tab/parametrages/paramCodeJournal",
        urldynamic: true
    },
    {
        text: 'CRM',
        name: "crm",
        path: "/tab/parametrages/paramCrm",
        urldynamic: true
    },
    {
        text: 'Devises',
        name: "devises",
        path: "/tab/parametrages/paramDevise",
        urldynamic: true
    },
    {
        text: 'Exercices',
        name: "exercices",
        path: "/tab/parametrages/paramExercice",
        urldynamic: true
    },
    {
        text: 'Plan comptable',
        name: "planComptable",
        path: "/tab/parametrages/paramPlanComptable",
        urldynamic: true
    },
    {
        text: 'Plan comptable - modèle',
        name: "planComptableModele",
        path: "/tab/parametrages/paramPlanComptableModele",
        urldynamic: false
    },
    {
        text: 'TVA',
        name: "tva",
        path: "/tab/parametrages/paramTVA",
        urldynamic: true
    },
    {
        text: 'Chiffre D\'affaires',
        name: "chiffreAffaires",
        path: "/tab/parametrages/chiffreDaffaires",
        urldynamic: true
    },
];

const paramliassesList = [
    {
        text: 'Mapping E-bilan',
        name: "mappingComptes",
        path: "/tab/parametrages/paramMapping",
        urldynamic: true
    },
    {
        text: 'Mapping Etats externes',
        name: "mappingComptes",
        path: "/tab/parametrages/paramMapping-externe",
        urldynamic: true
    },
];

const socialesList = [
    {
        text: 'Organismes de santé',
        name: "organismessante",
        path: "#",
        urldynamic: true
    },
    {
        text: 'Prévoyance sociales',
        name: "prevoyancesociales",
        path: "#",
        urldynamic: true
    },
    {
        text: 'Catégories',
        name: "classification",
        path: "/tab/parametrages/paramClassification",
        urldynamic: true
    },
    {
        text: 'Fonctions',
        name: "fonctions",
        path: "/tab/parametrages/paramFonctions",
        urldynamic: true
    },
    {
        text: 'Portefeuille',
        name: "portefeuille",
        path: "/tab/parametrages/paramPortefeuille",
        urldynamic: false
    },
];

export { comptaList, paramliassesList, socialesList }