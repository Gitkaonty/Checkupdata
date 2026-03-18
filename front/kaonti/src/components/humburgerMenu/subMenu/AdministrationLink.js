const traitementList = [
    {
        text: 'Saisie',
        name: "saisie",
        path: "/tab/administration/saisie",
        urldynamic: true
    },
    {
        text: 'Consultation',
        name: "consultation",
        path: "/tab/administration/consultation",
        urldynamic: true
    },
    {
        text: 'Personnel',
        name: "personnel",
        path: "/tab/administration/personnel",
        urldynamic: true
    },
    {
        text: 'Rapprochements bancaires',
        name: "rapprochements",
        path: "/tab/administration/rapprochements",
        urldynamic: true
    },
    {
        text: 'Immobilisations',
        name: "immobilisations",
        path: "/tab/administration/immobilisations",
        urldynamic: true
    },

];

const importList = [
    // {
    //     text: 'Annexe déclarations fiscales',
    //     name: "annexeDeclarationsFiscales",
    //     path: "/tab/administration/importAnnexeDeclarationFiscale",
    //     urldynamic: false
    // },
    // {
    //     text: 'Annexe liasses E-bilan',
    //     name: "annexeLiassesEbilan",
    //     path: "/tab/administration/importAnnexeDeclarationEbilan",
    //     urldynamic: true
    // },
    {
        text: 'Balance',
        name: "balance",
        path: "/tab/administration/importBalance",
        urldynamic: true
    },
    {
        text: 'Journal comptable',
        name: "journalComptable",
        path: "/tab/administration/importJournal",
        urldynamic: true
    },
    // {
    //     text: 'Modèle plan comptable',
    //     name: "modelePlanComptable",
    //     path: "/tab/administration/importModelePlanComptable",
    //     urldynamic: false
    // },
];

const exportList = [
    {
        text: 'Balance',
        name: "balance",
        path: "/tab/administration/exportBalance",
        urldynamic: true
    },
    // {
    //     text: 'DCom - droit de communication',
    //     name: "droitCommunication",
    //     path: "#"
    // },
    {
        text: 'Grand livre',
        name: "grandLivre",
        path: "/tab/administration/exportGrandLivre",
        urldynamic: true
    },
    {
        text: 'Journal comptable',
        name: "journalComptable",
        path: "/tab/administration/exportJournal",
        urldynamic: true
    },
    {
        text: 'Etats financiers',
        name: "etatfinancière",
        path: "/tab/administration/etatFinacier",
        urldynamic: true
    },
    {
        text: 'Etats financiers analytique',
        name: "etatfinancièreAnalytique",
        path: "/tab/administration/etatFinacierAnalytique",
        urldynamic: true
    },
    {
        text: 'SIG',
        name: "sig",
        path: "/tab/administration/sig",
        urldynamic: true
    },
    // {
    //     text: 'Liasse E-bilan',
    //     name: "liasseEbilan",
    //     path: "#"
    // },
];

export { traitementList, importList, exportList };