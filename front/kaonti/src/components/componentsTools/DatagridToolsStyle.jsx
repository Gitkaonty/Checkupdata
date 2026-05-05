import { GridToolbarQuickFilter, GridToolbarContainer } from '@mui/x-data-grid';
import { Stack } from '@mui/material';

export default function QuickFilter() {
  return (
    <GridToolbarContainer>
      <Stack style={{ backgroundColor: 'transparent' }} width={'100%'} alignItems={'end'}>
        <GridToolbarQuickFilter placeholder="Recherche..." />
      </Stack>

    </GridToolbarContainer>
  );
}

export const DataGridStyle = {
  disableMultipleSelection: true,
  disableColumnSelector: true,
  disableDensitySelector: true,
  rowHeight: 40,
  columnHeaderHeight: 40,
  localeText: '{frFR.components.MuiDataGrid.defaultProps.localeText}',
  sx: {
    m: 0,
    border: '0px',

    "& .MuiDataGrid-columnHeader.MuiDataGrid-ColumnHeader": {
      fontSize: '14px',
      fontFamily: 'Arial Black',
      fontWeight: 'bold',
    },
    "& .MuiDataGrid-columnSeparator": {
      display: 'flex',
      visibility: 'visible',
    },
    "& .MuiDataGrid-columnHeader": {
      borderBottom: "2px solid #1A5276",
    },

    "& .MuiDataGrid-row:nth-of-type(even)": {
      backgroundColor: "#F4F9F9",
      borderBottom: "0px",
      borderTop: "0px"
    },

    "& .MuiDataGrid-row:nth-of-type(odd)": {
      backgroundColor: "#ffffff",
      borderBottom: "0px",
      borderTop: "0px"
    },

    "& .MuiDataGrid-cell": {
      borderBottom: "none",
      '&:focus': {
        outline: 'none',
      },
    },
    "& .MuiDataGrid-row": {
      borderBottom: "none",
    },
    "& .MuiDataGrid-footer": {
      display: 'none',
    },
    '& .MuiDataGrid-columnHeaderCheckbox': {
      justifyContent: 'left',
      marginLeft: '0px'
    },
    '& .MuiDataGrid-footerContainer': {
      left: 100

    },
  },
  checkboxSelection: true,
  pagination: true
};