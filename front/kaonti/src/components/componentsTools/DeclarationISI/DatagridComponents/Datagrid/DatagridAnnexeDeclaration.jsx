import { useState } from 'react';
import { IconButton, Stack, Tooltip } from '@mui/material';

import { CiExport } from 'react-icons/ci';
import { IoMdTrash } from "react-icons/io";

import { init } from '../../../../../../init.js';
import { TbRefresh } from "react-icons/tb";

import PopupEditIsi from '../../Popup/PopupEditIsi.jsx';
import PopupConfirmDelete from '../../../popupConfirmDelete.jsx';
import toast from 'react-hot-toast';

import VirtualTableAnnexeDeclarationTable from '../VirtualTable/Tables/VirtualTableAnnexeDeclarationTable.jsx';
import VirtualTableAnnexeDeclarationColumns from '../VirtualTable/Columns/VirtualTableAnnexeDeclarationColumns.jsx';
import useAxiosPrivate from '../../../../../../config/axiosPrivate.js';

const initial = init[0];

const DatagridAnnexe = ({
    listAnnexeDeclaration,
    setIsAnnexeRefreshed,
    valSelectMois,
    valSelectAnnee,
    compteId,
    selectedExerciceId,
    fileId,
    compteisi,
    handleOpenPopupExportIsi,
    canModify,
    canAdd,
    canDelete,
    canView,
    deviseParDefaut
}) => {
    const axiosPrivate = useAxiosPrivate();
    const [showModalPopupIsiEdit, setShowModalPopupIsiEdit] = useState(false);
    const [showDialogIsiDelete, setShowDialogIsiDelete] = useState(false);
    const [showDialogIsiDeleteAll, setShowDialogIsiDeleteAll] = useState(false);

    const [rowToModify, setRowToModify] = useState({});
    const [idToDelete, setIdToDelete] = useState(null);
    const [actionDelete, setActionDelete] = useState(null);

    // Fermerture de la dialoge d'ajout
    const handleCloseDialogConfirmEditIsi = (value) => {
        setIsAnnexeRefreshed();
        setShowModalPopupIsiEdit(false);
        setIdToDelete(null);
    }

    // Fonction de suppresion d'une isi
    const deleteSelectedIsi = (value) => {
        if (value) {
            setShowDialogIsiDelete(false);
            axiosPrivate.delete(`/declaration/isi/deleteIsi/${idToDelete}`, { data: { action: actionDelete } })
                .then((response) => {
                    if (response?.data?.state) {
                        setIsAnnexeRefreshed();
                        setIdToDelete(null);
                    } else {
                        toast.error(response?.data?.message);
                    }
                })
                .catch((err) => {
                    if (err.response && err.response.data && err.response.data.message) {
                        toast.error(err.response.data.message);
                    } else {
                        toast.error(err.message || "Erreur inconnue");
                    }
                })
        } else {
            setShowDialogIsiDelete(false);
            setIdToDelete(null);
        }
    }

    // Fonction de suppression de toutes les isi
    const deleteAllIsi = (value) => {
        if (value) {
            setShowDialogIsiDelete(false);
            axiosPrivate.delete(`/declaration/isi/deleteAllIsi/${compteId}/${fileId}/${selectedExerciceId}`, {
                params: {
                    mois: Number(valSelectMois),
                    annee: Number(valSelectAnnee)
                }
            })
                .then((response) => {
                    if (response?.data?.state) {
                        setIsAnnexeRefreshed();
                        setShowDialogIsiDeleteAll(false);
                    } else {
                        toast.error(response?.data?.message);
                    }
                })
                .catch((err) => {
                    if (err.response && err.response.data && err.response.data.message) {
                        toast.error(err.response.data.message);
                    } else {
                        toast.error(err.message || "Erreur inconnue");
                    }
                })
        } else {
            setShowDialogIsiDeleteAll(false);
        }
    }

    // Génération des ISI automatique
    const generateAnnexeDeclarationAuto = () => {
        axiosPrivate.post('/declaration/isi/generateAnnexeDeclarationAuto', {
            id_compte: Number(compteId),
            id_dossier: Number(fileId),
            id_exercice: Number(selectedExerciceId),
            mois: Number(valSelectMois),
            annee: Number(valSelectAnnee),
            compteisi: compteisi
        })
            .then((response) => {
                if (response?.data?.state) {
                    toast.success(response?.data?.message);
                    setIsAnnexeRefreshed();
                } else {
                    toast.error(response?.data?.message);
                }
            })
            .catch((err) => {
                if (err.response && err.response.data && err.response.data.message) {
                    toast.error(err.response.data.message);
                } else {
                    toast.error(err.message || "Erreur inconnue");
                }
            })
    }

    const modifyOneRowAnnexeDeclaration = (row) => {
        setRowToModify(row);
        setShowModalPopupIsiEdit(true);
    }

    const deleteOneRowAnnexeDeclaration = (row) => {
        setIdToDelete(Number(row.id));
        setActionDelete(row.type);
        setShowDialogIsiDelete(true);
    }

    const handleShowDialogDeleteAllIsi = () => {
        setShowDialogIsiDeleteAll(true);
    }

    const columns = VirtualTableAnnexeDeclarationColumns(fileId);

    return (
        <>
            {
                showModalPopupIsiEdit && canModify
                    ?
                    <PopupEditIsi
                        objectAnnexeDIsi={rowToModify}
                        confirmationState={handleCloseDialogConfirmEditIsi}
                        setRowToModify={() => setRowToModify(null)}
                        deviseParDefaut={deviseParDefaut}
                    />
                    :
                    null
            }
            {
                showDialogIsiDelete && canDelete ?
                    <PopupConfirmDelete
                        msg={`Voulez-vous vraiment supprimer le ligne sélectionnée ?`}
                        confirmationState={deleteSelectedIsi}
                    />
                    :
                    null
            }
            {
                showDialogIsiDeleteAll && canDelete ?
                    <PopupConfirmDelete
                        msg={`Voulez-vous vraiment supprimer toutes les lignes de ce tableau ?`}
                        confirmationState={deleteAllIsi}
                    />
                    :
                    null
            }
            <Stack width={"100%"} height={"100%"} spacing={3} alignItems={"flex-start"}
                alignContent={"flex-start"} justifyContent={"stretch"} >

                <Stack
                    width={"100%"}
                    height={"30px"}
                    spacing={0.5}
                    alignItems={"center"}
                    alignContent={"center"}
                    direction={"row"}
                    justifyContent={"right"}
                >
                    <Tooltip title="Exporter en XML, Exccel et PDF">
                        <IconButton
                            variant="contained"
                            style={{
                                width: "45px",
                                height: "45px",
                                borderRadius: "1px",
                                border: "1px solid #D32F2F",
                                backgroundColor: "transparent",
                                textTransform: "none",
                                outline: "none",
                                marginRight: '1px'
                            }}
                            onClick={handleOpenPopupExportIsi}
                        >
                            <CiExport style={{ width: '25px', height: '25px', color: "#D32F2F" }} />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Générer automatiquement la déclaration ISI">
                        <IconButton
                            disabled={!canAdd}
                            variant="contained"
                            style={{
                                width: "45px",
                                height: '45px',
                                borderRadius: "1px",
                                borderColor: "transparent",
                                textTransform: 'none',
                                outline: 'none',
                                backgroundColor: initial.theme,
                            }}
                            onClick={generateAnnexeDeclarationAuto}
                        >
                            <TbRefresh style={{ width: '25px', height: '25px', color: 'white' }} />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Supprimer toutes les lignes du tableau">
                        <IconButton
                            disabled={!canDelete}
                            variant="contained"
                            style={{
                                width: "45px",
                                height: '45px',
                                borderRadius: "1px",
                                borderColor: "transparent",
                                textTransform: 'none',
                                outline: 'none',
                                backgroundColor: initial.button_delete_color,
                            }}
                            onClick={handleShowDialogDeleteAllIsi}
                        >
                            <IoMdTrash style={{ width: '25px', height: '25px', color: 'white' }} />
                        </IconButton>
                    </Tooltip>
                </Stack>
                <Stack
                    width={"100%"}
                    height={"50vh"}
                    alignItems={'start'}
                    style={{ overflow: 'auto' }}
                >
                    <VirtualTableAnnexeDeclarationTable columns={columns} rows={listAnnexeDeclaration} modifyState={modifyOneRowAnnexeDeclaration} deleteState={deleteOneRowAnnexeDeclaration} />
                </Stack>
            </Stack>
        </>
    )
}

export default DatagridAnnexe