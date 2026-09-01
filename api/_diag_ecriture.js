require('dotenv').config();
const db = require('./Models');
(async () => {
  try {
    const rows = await db.sequelize.query(
      `SELECT comptegen, COUNT(*) n, SUM(COALESCE(debit,0)) d, SUM(COALESCE(credit,0)) c
       FROM journals WHERE id_ecriture=:ec AND id_dossier=1 AND id_exercice=2
       GROUP BY comptegen ORDER BY comptegen`,
      { replacements: { ec: 'ef7da9dd434d013a0f88482eb' }, type: db.Sequelize.QueryTypes.SELECT });
    console.log('=== Écriture VM1122_005 (Egis) par compte ===');
    let d=0,c=0;
    rows.forEach(r => { d+=Number(r.d); c+=Number(r.c);
      const cg=(r.comptegen||'').trim();
      let cls = /^[67]/.test(cg)?'HT':/^445/.test(cg)?'TVA':/^(40|41)/.test(cg)?'TIERS':/^44/.test(cg)?'44x(retenue?)':/^5/.test(cg)?'TRESO':'AUTRE';
      console.log(`${cg.padEnd(12)} [${cls.padEnd(13)}] n=${r.n} D=${Number(r.d).toFixed(2)} C=${Number(r.c).toFixed(2)}`);
    });
    console.log('TOTAL D=',d.toFixed(2),' C=',c.toFixed(2));
  } catch(e){ console.error('ERR',e.message); } finally { setTimeout(()=>process.exit(0),100); }
})();
