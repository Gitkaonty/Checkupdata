import { Autocomplete, Checkbox, FormControl, Paper, Stack, TextField } from '@mui/material';

import { DataGrid, frFR } from '@mui/x-data-grid';
import QuickFilter, { DataGridStyle } from '../DatagridToolsStyle';
import { init } from '../../../../init';


const initial = init[0];

const RolePermissionTab = ({
    listCompte,
    listSousCompte,
    setSelectedCompteId,
    setSelectedSousCompteId,
    setUserPermissions,
    userPermissions,
    columns,
    selectedCompteId,
    selectedSousCompteId
}) => {
    return (
        <>
            <Stack
                width={"100%"}
                paddingLeft={"5px"}
                alignItems={"center"}
                alignContent={"center"}
                direction={"row"}
                justifyContent={"space-between"}
                style={{
                    marginLeft: "0px",
                    marginTop: "20px",
                    backgroundColor: '#F4F9F9',
                    borderRadius: "5px",
                }}
            >
                <Stack
                    direction={"row"}
                    sx={{
                        flexGrow: 1,
                        flexWrap: 'wrap',
                        width: '100%'
                    }}
                    spacing={1.5}
                    alignItems={"center"}
                    alignContent={"center"}
                >

                    <FormControl variant="standard" sx={{ width: '12%' }}>
                        <Autocomplete
                            disabled
                            options={listCompte}
                            getOptionLabel={(option) => `${option.nom || ''}`}
                            isOptionEqualToValue={(option, value) => option.id === value.id}
                            PaperComponent={(props) => (
                                <Paper
                                    {...props}
                                    sx={{ backgroundColor: 'white', boxShadow: '0px 4px 10px rgba(0,0,0,0.2)' }}
                                />
                            )}
                            value={selectedCompteId}
                            onChange={(e, value) => { setSelectedCompteId(value); setSelectedSousCompteId([]); setUserPermissions([]) }}
                            renderInput={(params) => (
                                <TextField {...params} variant="standard" label="Compte" />
                            )}
                        />
                    </FormControl>

                    <FormControl variant="standard" sx={{ width: '87%' }}>
                        <Autocomplete
                            multiple
                            disableCloseOnSelect
                            options={[{ id: "__all__", username: "Tout sélectionner" }, ...listSousCompte]}
                            getOptionLabel={(option) => option.username || ""}
                            isOptionEqualToValue={(option, value) => option.id === value.id}
                            PaperComponent={(props) => (
                                <Paper
                                    {...props}
                                    sx={{
                                        backgroundColor: 'white',
                                        boxShadow: '0px 4px 10px rgba(0,0,0,0.2)'
                                    }}
                                />
                            )}
                            value={selectedSousCompteId}
                            onChange={(e, value, reason, details) => {
                                if (details?.option?.id === "__all__") {
                                    if (selectedSousCompteId.length === listSousCompte.length) {
                                        setSelectedSousCompteId([]);
                                    } else {
                                        setSelectedSousCompteId(listSousCompte);
                                    }
                                    return;
                                }

                                setSelectedSousCompteId(value);
                                if (value.length === 0) {
                                    setUserPermissions([]);
                                }
                            }}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    variant="standard"
                                    label="Sous-comptes"
                                />
                            )}
                            renderOption={(props, option, { selected }) => {
                                const isSelectAll = option.id === "__all__";

                                return (
                                    <li
                                        {...props}
                                        style={{
                                            paddingTop: 2,
                                            paddingBottom: 2,
                                            paddingLeft: 4,
                                            paddingRight: 4,
                                            fontSize: "0.8rem",
                                            display: "flex",
                                            alignItems: "center"
                                        }}
                                    >
                                        <Checkbox
                                            checked={
                                                isSelectAll
                                                    ? selectedSousCompteId.length === listSousCompte.length
                                                    : selected
                                            }
                                            style={{ marginRight: 8 }}
                                        />
                                        {isSelectAll
                                            ? (selectedSousCompteId.length === listSousCompte.length
                                                ? "Tout désélectionner"
                                                : "Tout sélectionner")
                                            : option.username}
                                    </li>
                                );
                            }}
                        />
                    </FormControl>

                </Stack>
            </Stack>
            <Stack
                width="100%"
                height="700px"
                style={{
                    marginLeft: "0px",
                    marginTop: "20px",
                    overflow: "auto",
                }}
            >
                <DataGrid
                    rows={userPermissions}
                    columns={columns}
                    disableMultipleSelection={DataGridStyle.disableMultipleSelection}
                    disableColumnSelector={DataGridStyle.disableColumnSelector}
                    disableDensitySelector={DataGridStyle.disableDensitySelector}
                    disableRowSelectionOnClick

                    localeText={frFR.components.MuiDataGrid.defaultProps.localeText}

                    slots={{
                        toolbar: QuickFilter,
                    }}

                    rowHeight={DataGridStyle.rowHeight}
                    columnHeaderHeight={DataGridStyle.columnHeaderHeight}

                    initialState={{
                        pagination: {
                            paginationModel: { page: 0, pageSize: 100 },
                        },
                    }}

                    sx={{
                        ...DataGridStyle.sx,
                        '& .MuiDataGrid-columnHeaders': {
                            backgroundColor: initial.tableau_theme,
                            color: initial.text_theme,
                        },
                        '& .MuiDataGrid-columnHeaderTitle': {
                            color: initial.text_theme,
                            fontWeight: 600,
                        },
                        '& .MuiDataGrid-iconButtonContainer, & .MuiDataGrid-sortIcon': {
                            color: initial.text_theme,
                        },
                        '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': {
                            outline: 'none',
                            border: 'none',
                        },
                        '& .highlight-separator': {
                            borderBottom: '1px solid red'
                        },
                        '& .MuiDataGrid-row.highlight-separator': {
                            borderBottom: '1px solid red',
                        },
                        '& .MuiDataGrid-virtualScroller': {
                            maxHeight: '700px',
                        },
                    }}

                    experimentalFeatures={{ newEditingApi: true }}
                    pageSizeOptions={[5, 10, 20, 30, 50, 100]}

                    pagination={DataGridStyle.pagination}

                    columnVisibilityModel={{
                        id: false,
                    }}

                    style={{ height: "700px" }}
                />

            </Stack>
        </>
    )
}

export default RolePermissionTab