import { GridToolbarQuickFilter, GridToolbarContainer } from '@mui/x-data-grid';
import { Box, Button, Stack } from '@mui/material';
import { init } from '../../../init';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';


const initial = init[0];

export default function QuickFilter({ withAddButton, addAction }) {
  return (
    <GridToolbarContainer>
      <Stack
        width="100%"
        alignItems="flex-start"
        sx={{ backgroundColor: 'transparent', marginBottom: '10px' }}
      >
        <Box
          sx={{
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: 'transparent',
            mb: 1,
          }}
        >
          <Box
            sx={{
              position: 'relative',
              border: '1px solid #94A3B8',
              borderRadius: '6px',
              width: '250px',
              '& .MuiInputBase-root': {
                minHeight: '20px',
                padding: '0px 8px',
                '&:before, &:after': {
                  borderBottom: 'none !important',
                },
                '&:hover:not(.Mui-disabled):before': {
                  borderBottom: 'none !important',
                },
              },
              '& .MuiInputBase-input': {
                padding: '2px 35px 2px 5px',
                fontSize: '13px',
                lineHeight: '18px',
              },
              '& .MuiDataGrid-toolbarQuickFilterIcon': {
                display: 'none',
              },
              '& > svg:first-of-type': {
                display: 'none'
              },
              '& .custom-search-icon': {
                position: 'absolute',
                left: 4,
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: 18,
                color: '#94A3B8',
                pointerEvents: 'none',
              },
            }}
          >
            <SearchIcon className="custom-search-icon" />
            <GridToolbarQuickFilter placeholder="Recherche..." />
          </Box>
          {withAddButton && (
            <Button
              variant="contained"
              disableElevation
              startIcon={<AddIcon />}
              onClick={addAction}
              sx={{
                bgcolor: '#1E90FF',
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 700,
                px: 3,
                height: '37px',
              }}
            >
              Ajouter
            </Button>
          )}
        </Box>
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
      borderBottom: `2px solid #1A5276`,
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
      color: '#94A3B8', fontSize: '13px'
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
    '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': {
      outline: 'none',
      border: 'none',
    },
    '& .MuiDataGrid-columnHeaders': {
      backgroundColor: initial.datagridHeaderColor,
      fontWeight: 800,
      color: 'white',
      fontSize: '11px',
      borderTopLeftRadius: '10px',
      borderTopRightRadius: '10px',
    },
    '& .MuiDataGrid-columnHeaderTitle': {
      textTransform: 'uppercase',
    }
  },
  checkboxSelection: true,
  pagination: true
};