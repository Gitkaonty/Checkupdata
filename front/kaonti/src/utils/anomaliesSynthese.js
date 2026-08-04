export const SYNTHESE_ITEMS = [
  { nom: 'Revue analytique N/N-1', typeRevue: 'analytiqueNN1' },
  { nom: 'Revue analytique mensuelle', typeRevue: 'analytiqueMensuelle' },
  { nom: 'Analyse globale des comptes', typeRevue: 'controleAuto' },
  { nom: 'Analyse fournisseur / Client', typeRevue: 'fournisseurClient' },
  { nom: 'Recherche doublon', typeRevue: 'doublons' },
  { nom: 'Contrôle code analytique', typeRevue: 'analytique' },
];

const emptyStat = { anomalies: 0, restantes: 0 };

const fetchOne = async (axiosPrivate, typeRevue, { id_compte, id_dossier, id_exercice, id_periode, periodeDates }) => {
  try {
    let url;
    switch (typeRevue) {
      case 'controleAuto':
        url = `/administration/revisionControleAuto/${id_compte}/${id_dossier}/${id_exercice}/stats`;
        if (id_periode) url += `?id_periode=${id_periode}`;
        break;
      case 'fournisseurClient':
        url = `/administration/revisionFournisseurClient/${id_compte}/${id_dossier}/${id_exercice}/stats`;
        if (id_periode) url += `?id_periode=${id_periode}`;
        break;
      case 'doublons':
        url = `/administration/rechercheDoublon/${id_compte}/${id_dossier}/${id_exercice}/stats`;
        if (id_periode) url += `?id_periode=${id_periode}`;
        break;
      case 'analytique': {
        url = `/administration/revisionAnalytique/${id_compte}/${id_dossier}/${id_exercice}`;
        if (id_periode) url += `?id_periode=${id_periode}`;
        const r = await axiosPrivate.get(url);
        if (r.data?.state && r.data?.data) {
          const rows = r.data.data;
          const total = rows.length;
          const nonValidees = rows.filter(x => x.valide === false || x.valide === 0).length;
          return { anomalies: total, restantes: nonValidees || total };
        }
        return { ...emptyStat };
      }
      case 'analytiqueNN1':
      case 'analytiqueMensuelle':
      default:
        url = `/revuAnalytiqueStats/totals?id_compte=${id_compte}&id_dossier=${id_dossier}&id_exercice=${id_exercice}&type_revue=${typeRevue}`;
        if (id_periode) url += `&id_periode=${id_periode}`;
        if (periodeDates) url += `&date_debut=${periodeDates.date_debut}&date_fin=${periodeDates.date_fin}`;
        break;
    }

    const resp = await axiosPrivate.get(url);
    if (resp.data?.state && resp.data?.data) {
      const d = resp.data.data;
      return {
        anomalies: d.total_anomalies || d.nbLignes || d.total || 0,
        restantes: d.restantes || d.remaining || d.nbGroupes || d.nonValide || 0,
      };
    }
    return { ...emptyStat };
  } catch (error) {
    console.error(`[Synthese] stats ${typeRevue}:`, error);
    return { ...emptyStat };
  }
};

const round = (n) => Math.round(n);

export async function fetchAnomaliesSynthese(axiosPrivate, { id_compte, id_dossier, id_exercice, id_periode, periodeDates }) {
  if (periodeDates && id_periode) {
    try {
      await Promise.all([
        axiosPrivate.get(`/dashboard/revuAnalytiqueNN1/${id_compte}/${id_dossier}/${id_exercice}?date_debut=${periodeDates.date_debut}&date_fin=${periodeDates.date_fin}&id_periode=${id_periode}`),
        axiosPrivate.get(`/dashboard/revuAnalytiqueMensuelle/${id_compte}/${id_dossier}/${id_exercice}?date_debut=${periodeDates.date_debut}&date_fin=${periodeDates.date_fin}&id_periode=${id_periode}`),
      ]);
    } catch (error) {
      console.error('[Synthese] pré-sauvegarde anomalies:', error);
    }
  }

  const rows = await Promise.all(
    SYNTHESE_ITEMS.map(async (item) => {
      const stat = item.typeRevue
        ? await fetchOne(axiosPrivate, item.typeRevue, { id_compte, id_dossier, id_exercice, id_periode, periodeDates })
        : { ...emptyStat };
      const anomalies = Number(stat.anomalies) || 0;
      const restantes = Number(stat.restantes) || 0;
      const progress = anomalies === 0 ? 0 : round(((anomalies - restantes) / anomalies) * 100);
      return { nom: item.nom, anomalies, restantes, progress };
    })
  );

  const anomalies = rows.reduce((s, r) => s + r.anomalies, 0);
  const restantes = rows.reduce((s, r) => s + r.restantes, 0);
  const validated = anomalies - restantes;
  const progress = anomalies === 0 ? 0 : round((validated / anomalies) * 100);

  return { rows, totals: { anomalies, restantes, validated, progress } };
}
