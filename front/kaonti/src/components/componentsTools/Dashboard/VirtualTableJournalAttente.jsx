import { useState } from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import { Stack, TableFooter } from '@mui/material';
import { init } from '../../../../init';

let initial = init[0];

const COLORS = {
  navy: '#0F172A',
  electric: '#0EA5E9',
  cyan: '#22D3EE',
  success: '#10B981',
  error: '#EF4444',
  border: '#E2E8F0',
  bg: '#F8FAFC'
};

export default function VirtualTableJournalAttente({ tableHeader, tableRow, searchText }) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  const totalColumn = (rows, columnId, page, rowsPerPage) => {
    const visibleRows = rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
    return visibleRows.reduce((total, row) => {
      const value = row[columnId];
      if (value != null && !isNaN(value)) total += value;
      return total;
    }, 0);
  };

  return (

    <Stack width={'100%'} height={'100%'}>
      <TableContainer sx={{ maxHeight: 380 }}>
        <Table stickyHeader aria-label="sticky table" >
          <TableHead>
            <TableRow sx={{ bgcolor: '#F1F5F9' }}>
              {tableHeader.map((column) => (
                <TableCell
                  sx={{
                    textTransform: 'uppercase',
                    bgcolor: '#F1F5F9',
                    fontWeight: 900, fontSize: '0.75rem', py: 1
                  }}
                  key={column.id}
                  align={column.align}
                  style={{ minWidth: column.minWidth }}
                >
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {tableRow
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((row, rowIndex) => {
                return (
                  <TableRow hover role="checkbox" tabIndex={-1} sx={{ py: 2, fontSize: '0.85rem' }} key={`row-${row.id ?? rowIndex}-${page}`}>
                    {tableHeader.map((column) => {
                      const value = row[column.id];
                      return (
                        <TableCell
                          key={column.id}
                          align={column.align}
                          sx={{
                            paddingY: 1,
                            fontWeight: column.id === 'compte' ? 900 : column.id === 'dateecriture' || column.id === 'codejournal' || column.id === 'libelle' ? 600 : 900,
                            color: column.id === 'compte' ? COLORS.electric : column.id === 'dateecriture' || column.id === 'codejournal' || column.id === 'libelle' ? '#64748B' : '',
                          }}
                        >
                          {
                            column.format
                              ? column.format(value)
                              : value
                          }
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })}

          </TableBody>
          <TableFooter
            sx={{
              position: 'sticky',
              bottom: 0,
              zIndex: 1,
            }}
          >
            <TableRow sx={{ bgcolor: '#F1F5F9' }}>
              {tableHeader.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align}
                  sx={{
                    bgcolor: '#F1F5F9',
                    fontWeight: 900, fontSize: '0.75rem', py: 1
                  }}
                >
                  {column.id === 'compte'
                    ? 'Total'
                    : column.id === 'debit' || column.id === 'credit'
                      ? totalColumn(tableRow, column.id, page, rowsPerPage)
                        .toLocaleString('fr-FR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })
                      : ''}
                </TableCell>
              ))}
            </TableRow>
          </TableFooter>

        </Table>
      </TableContainer>
      <TablePagination
        style={{ height: "20%" }}
        rowsPerPageOptions={[10, 25, 50, 100, 500, 1000]}
        component="div"
        count={tableRow.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage="Lignes par page : "
        labelDisplayedRows={({ from, to, count }) =>
          `${from}–${to} sur ${count !== -1 ? count : `plus de ${to}`}`
        }
        sx={{
          "& .MuiIconButton-root": {
            border: "none",
            outline: "none",
            boxShadow: "none",
            "&:focus": {
              outline: "none",
              boxShadow: "none",
            },
          },
        }}
      />
    </Stack>
  );
}