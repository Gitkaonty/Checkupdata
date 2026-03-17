const declFiscalesList = [
    {
        text: 'BGE-VCA',
        toolTip: ' Balance générale-ventilation du CA',
        name: "bgevca",
        path: "#",
        urldynamic: false
    },
    {
        text: 'DCom',
        toolTip: 'Droit de communication',
        name: "dcom",
        path: "/tab/declaration/declarationDroitComm",
        urldynamic: true
    },
    {
        text: 'E-bilan',
        toolTip: 'Déclaration E-Bilan',
        name: "ebilan",
        path: "/tab/declaration/declarationEbilan",
        urldynamic: true
    },
    {
        text: 'IR Acompte',
        toolTip: 'Impôt sur les revenus',
        name: "iracompte",
        path: "#",
        urldynamic: false
    },
    {
        text: 'IR Liquidation',
        toolTip: 'Impôt sur les revenus',
        name: "irliquidation",
        path: "#",
        urldynamic: false
    },
    {
        text: 'IRI',
        toolTip: 'Impôt sur les revenus intermittent',
        name: "iri",
        path: "#",
        urldynamic: false
    },
    {
        text: 'IRSA',
        toolTip: 'Impôts sur les revenus salariaux et assimilés',
        name: "irsa",
        path: "/tab/declaration/declarationIRSA",
        urldynamic: true
    },
    {
        text: 'IRCM',
        toolTip: 'Impôt sur le Revenu des Capitaux Mobiliers',
        name: "ircm",
        path: "#",
        urldynamic: false
    },
    {
        text: 'ISI',
        toolTip: 'Impôt synthétique intermittent',
        name: "isi",
        path: "/tab/declaration/declarationISI",
        urldynamic: true
    },
    {
        text: 'TVA',
        toolTip: 'Taxes sur la valeur ajoutée',
        name: "tva",
        path: "/tab/declaration/declarationTVA",
        urldynamic: true
    },
];

const declSocialesList = [
    {
        text: 'Organismes de santé',
        name: "organismesante",
        path: "#"
    },
    {
        text: 'Prévoyances sociales',
        name: "prevoyancesociales",
        path: "#"
    },
];

export { declFiscalesList, declSocialesList };