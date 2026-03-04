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
      <TableContainer sx={{ height: '100%' }}>
        <Table stickyHeader aria-label="sticky table" >
          <TableHead>
            <TableRow>
              {tableHeader.map((column) => (
                <TableCell
                  sx={{
                    fontSize: 16,
                    fontWeight: "bold",
                    backgroundColor: initial.theme,
                    paddingY: 0.8,
                    borderRadius: 0.5,
                    color: 'white'
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
                  <TableRow hover role="checkbox" tabIndex={-1} key={`row-${row.id ?? rowIndex}-${page}`}>
                    {tableHeader.map((column) => {
                      const value = row[column.id];
                      return (
                        <TableCell
                          key={column.id}
                          align={column.align}
                          sx={{ paddingY: 1 }}
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
          <TableFooter>
            <TableRow>
              {tableHeader.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align}
                  sx={{
                    fontWeight: 'bold',
                    fontSize: 15,
                    paddingY: 0.8,
                    backgroundColor: initial.theme,
                    position: 'sticky',
                    bottom: 0,
                    zIndex: 2,
                    minWidth: column.minWidth || 80,
                    color: 'white'
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