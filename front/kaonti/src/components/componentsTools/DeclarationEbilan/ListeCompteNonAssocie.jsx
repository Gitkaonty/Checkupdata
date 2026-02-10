import { useEffect, useState } from 'react'
import axios from '../../../../config/axios';
import { Autocomplete, TextField } from '@mui/material';

const ListeCompteNonAssocie = ({ id_compte, id_dossier, id_exercice, id_etat }) => {
    const [listeCompte, setListeCompte] = useState([]);

    const getListeCompteNonAssocie = async () => {
        await axios.post('/declaration/ebilan/getListeCompteNonAssocie', {
            id_compte,
            id_dossier,
            id_exercice,
            id_etat
        }).then((response) => {
            const resData = response?.data;
            if (resData?.state) {
                setListeCompte(resData?.liste ?? []);
            }
        })
    }

    useEffect(() => {
        if (id_compte && id_dossier && id_exercice && id_etat) {
            getListeCompteNonAssocie();
        }
    }, [id_compte, id_dossier, id_exercice, id_etat])

    return (
        <>
            <Autocomplete
                options={(listeCompte ?? []).filter(val => val?.compte)}
                getOptionLabel={(option) => `${option.compte || ''} - ${option.libelle || ''}`}
                renderInput={(params) => <TextField {...params} label={`Compte non associé au compte rubriques du tableau ${id_etat}`} variant="standard" />}
                isOptionEqualToValue={(option, value) => option?.compte === value?.compte}
                disableClearable={false}
                noOptionsText="Aucun compte disponible"
            />
        </>
    )
}

export default ListeCompteNonAssocie;