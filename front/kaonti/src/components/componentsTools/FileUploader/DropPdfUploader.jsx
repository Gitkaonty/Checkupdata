import { useState, useCallback, useEffect } from 'react';
import {
    Box, Typography, Paper, Button, Stack, CircularProgress
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { URL } from '../../../../config/axios';
import { init } from '../../../../init';

import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';

import PopupConfirmDelete from '../popupConfirmDelete';
import toast from 'react-hot-toast';

const DropPDFUploader = ({ file, setFile, mode }) => {
    const [dragActive, setDragActive] = useState(false);
    const [remoteFileSize, setRemoteFileSize] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const [openDialogDeleteFile, setOpenDialogDeleteFile] = useState(false);

    let initial = init[0];

    const handleDrag = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    }, []);

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        setIsLoading(true);

        const newFile = e.dataTransfer.files?.[0];
        setTimeout(() => {
            if (newFile) {
                setFile(newFile);
                setIsLoading(false);
            }
        }, 1000)
    };

    const handleFileChange = (e) => {
        const newFile = e.target.files?.[0];
        setIsLoading(true);
        setTimeout(() => {
            if (newFile) {
                setFile(newFile);
                setIsLoading(false);
            }
        }, 1000)
    };

    const fileName = typeof file === 'string'
        ? file.split('/').pop()
        : file?.name;

    const fileSize = typeof file === 'string'
        ? remoteFileSize
        : file ? (file.size / 1024).toFixed(2) : null;

    const handleOpenDialogDeleteFile = () => {
        setOpenDialogDeleteFile(true);
    }

    const handleDeleteFile = (value) => {
        if (value) {
            setFile(null);
            setOpenDialogDeleteFile(false);
            toast.success('Fichier supprimé avec succès');
        } else {
            setOpenDialogDeleteFile(false);
        }
    }

    useEffect(() => {
        if (mode === 'modification' && typeof file === 'string') {
            setIsLoading(true);
            fetch(`${URL}/${file}`, { method: 'HEAD' })
                .then(res => {
                    const size = res.headers.get("Content-Length");
                    if (size) setRemoteFileSize((size / 1024).toFixed(2));
                })
                .finally(() => setIsLoading(false))
                .catch(() => setRemoteFileSize(null));
        }
    }, [file, mode]);

    return (
        <>
            {
                openDialogDeleteFile
                    ?
                    <PopupConfirmDelete
                        confirmationState={handleDeleteFile}
                        msg={'Voulez vous vraiment supprimer ce fichier ? '}
                        presonalisedMessage={true}
                    />
                    :
                    null
            }
            <Box sx={{ mt: 4 }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems="start">
                    <Paper
                        elevation={dragActive ? 6 : 2}
                        onDragOver={handleDrag}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDrop={handleDrop}
                        onClick={() => document.getElementById('fileInput').click()}
                        sx={{
                            flex: 1.5,
                            border: '2px dashed',
                            borderColor: dragActive ? 'primary.main' : 'grey.400',
                            borderRadius: 2,
                            p: 3,
                            height: 150,
                            textAlign: 'center',
                            bgcolor: dragActive ? 'primary.light' : 'grey.100',
                            cursor: 'pointer',
                            transition: '0.2s',
                            position: 'relative',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            maxWidth: 350
                        }}
                    >
                        {isLoading ? (
                            <CircularProgress color="primary" />
                        ) : (
                            <>
                                <UploadFileIcon sx={{ fontSize: 48, color: 'primary.main' }} />
                                <Typography variant="body1" mt={2}>
                                    {fileName || 'Glissez ou cliquez pour importer un fichier'}
                                </Typography>
                            </>
                        )}
                        <input
                            id="fileInput"
                            type="file"
                            onChange={handleFileChange}
                            hidden
                        />
                    </Paper>

                    <Stack spacing={1} justifyContent="space-between" sx={{ flex: 1, width: 600 }}>
                        {(fileName || fileSize) && (
                            <Box>
                                {fileName && (
                                    <Typography variant="body2">
                                        <strong>Nom :</strong> {fileName}
                                    </Typography>
                                )}
                                {fileSize && (
                                    <Typography variant="body2">
                                        <strong>Taille :</strong> {fileSize} KB
                                    </Typography>
                                )}
                                {mode === 'modification' && typeof file === 'string' && (
                                    <Button
                                        sx={{
                                            mt: 1,
                                            textTransform: 'none',
                                            backgroundColor: initial.theme,
                                            color: 'white',
                                            '&:hover': {
                                                backgroundColor: initial.theme,
                                                color: 'white',
                                            },
                                            width: 50,
                                            minWidth: 0,
                                            padding: 1,
                                        }}
                                        style={{ textTransform: 'none', outline: 'none' }}
                                        href={`${URL}/${file}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <VisibilityIcon />
                                    </Button>
                                )}
                            </Box>
                        )}

                        {file && (
                            <Button
                                sx={{
                                    mt: 1,
                                    textTransform: 'none',
                                    backgroundColor: initial.button_delete_color,
                                    color: 'white',
                                    '&:hover': {
                                        backgroundColor: initial.button_delete_color,
                                    },
                                    width: 50,
                                    minWidth: 0,
                                    padding: 1,
                                }}
                                style={{ textTransform: 'none', outline: 'none' }}
                                onClick={handleOpenDialogDeleteFile}
                            >
                                <DeleteIcon />
                            </Button>
                        )}

                    </Stack>
                </Stack>
            </Box>
        </>
    );
};

export default DropPDFUploader;