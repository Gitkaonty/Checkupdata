import { useState } from 'react';
import { DataGrid, frFR } from '@mui/x-data-grid';
import QuickFilter from './DatagridToolsStyle';
import { DataGridStyle } from './DatagridToolsStyle';
import { init } from '../../../init';

const initial = init[0];

export const Datagridbase = ({ row_id, tableRow }) => {
    const [rowSelectionModel, setRowSelectionModel] = useState([]);

    const columnHeader = [
        {
            field: 'rubriquesmatrix.libelle',
            headerName: 'Rubriques',
            type: 'text',
            sortable: true,
            flex: 1,
            headerAlign: 'left',
            align: 'left',
            headerClassName: 'HeaderbackColor',
        },
    ];

    const sendId = (id) => {
        const rowSelectedInfo = tableRow?.find((item) => item.id === id);
        row_id(rowSelectedInfo?.id_rubrique ?? null);
    };

    return (
        <DataGrid
            rows={tableRow}
            columns={columnHeader}
            localeText={frFR.components.MuiDataGrid.defaultProps.localeText}
            checkboxSelection
            disableRowSelectionOnClick
            rowSelectionModel={rowSelectionModel}
            onRowSelectionModelChange={(newModel) => {
                const arr = Array.isArray(newModel) ? newModel : [newModel];

                if (arr.length === 0) {
                    setRowSelectionModel([]);
                    sendId(null);
                    return;
                }
                const lastId = arr[arr.length - 1];
                setRowSelectionModel([lastId]);
                sendId(lastId);
            }}
            disableColumnSelector={DataGridStyle.disableColumnSelector}
            disableDensitySelector={DataGridStyle.disableDensitySelector}
            slots={{ toolbar: QuickFilter }}
            sx={{
                ...DataGridStyle.sx,
                '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': {
                    outline: 'none',
                    border: 'none',
                },
                '& .MuiDataGrid-columnHeaders': {
                    backgroundColor: initial.theme,
                    color: 'white',
                    fontWeight: 'bold',
                },
            }}
            rowHeight={DataGridStyle.rowHeight}
            columnHeaderHeight={DataGridStyle.columnHeaderHeight}
            initialState={{
                pagination: { paginationModel: { page: 0, pageSize: 100 } },
            }}
            pageSizeOptions={[50, 100]}
            pagination={DataGridStyle.pagination}
            columnVisibilityModel={{ id: false }}
        />
    );
};
