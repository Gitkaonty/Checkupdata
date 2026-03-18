import { IconButton, ListItemIcon, ListItemText, Menu, MenuItem, Stack, Tooltip } from '@mui/material';
import { useState } from 'react'
import { CiExport } from 'react-icons/ci';
import { FaFilePdf } from "react-icons/fa6";
import { FaFileExcel } from "react-icons/fa";

const ExportEtatFinancierButtonAll = ({ exportAllToPdf, exportAllToExcel }) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const handleOpen = (event) => setAnchorEl(event.currentTarget);
    const handleClose = () => setAnchorEl(null);
    return (
        <>
            <Stack
                direction="row"
                justifyContent="flex-end"
                width="70%"
                spacing={0.5}
                style={{
                    marginLeft: "0px",
                    marginTop: "5px",
                    borderRadius: "5px"
                }}
            >
                <Tooltip title={`Exporter tout`}>
                    <span>
                        <IconButton
                            onClick={handleOpen}
                            variant="contained"
                            style={{
                                width: "45px",
                                height: "45px",
                                borderRadius: "2px",
                                border: "2px solid #D32F2F",
                                backgroundColor: "transparent",
                                textTransform: "none",
                                outline: "none",
                            }}
                        >
                            <CiExport style={{ width: 25, height: 25, color: "#D32F2F" }} />
                        </IconButton>
                    </span>
                </Tooltip>
                <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleClose}
                    disableScrollLock={true}
                    anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'right',
                    }}
                    transformOrigin={{
                        vertical: 'top',
                        horizontal: 'right',
                    }}
                    sx={{
                        mt: 1,
                    }}
                >
                    <MenuItem
                        onClick={() => {
                            exportAllToPdf();
                            handleClose();
                        }}
                    >
                        <ListItemIcon>
                            <FaFilePdf size={20} color="#D32F2F" />
                        </ListItemIcon>
                        <ListItemText primary={`Exporter tout en PDF`} />
                    </MenuItem>

                    <MenuItem
                        onClick={() => {
                            exportAllToExcel();
                            handleClose();
                        }}
                    >
                        <ListItemIcon>
                            <FaFileExcel size={20} color="#2E7D32" />
                        </ListItemIcon>
                        <ListItemText primary={`Exporter tout en Excel`} />
                    </MenuItem>
                </Menu>
            </Stack>
        </>
    )
}

export default ExportEtatFinancierButtonAll