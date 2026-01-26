import * as React from 'react';
import { useState } from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import { TableFooter } from '@mui/material';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import { init } from '../../../../init';
import { Box, Chip, Collapse, IconButton, Typography } from '@mui/material';
import AddBoxIcon from '@mui/icons-material/AddBox';
import IndeterminateCheckBoxIcon from '@mui/icons-material/IndeterminateCheckBox';
import { RiExchangeBoxFill } from "react-icons/ri";
import PopupAjustRubriqueDRFEbilan from '../FormulaireModifTableauEbilan/popupAjustRubriqueDRFEbilan';
import { FaRegPenToSquare } from "react-icons/fa6";

const VirtualTableDRFEbilan = ({ refreshTable, columns, rows, noCollapsible, state, canModify, canAdd, canDelete, canView, deviseParDefaut }) => {
  const initial = init[0];
  const targetColumnId = 'rubriquesmatrix.libelle';
  const [openRows, setOpenRows] = React.useState({});
  const [openTableDetail, setOpenTableDetail] = useState(false);
  const [detailRow, setDetailRow] = useState([]);
  const [detailColumnHeader, setDetailColumnHeader] = useState();
  const [detailValue, setDetailValue] = useState();

  const toggleRow = (rowKey) => {
    setOpenRows((prev) => ({
      ...prev,
      [rowKey]: !prev[rowKey],
    }));
  };

  //ajout de montant ajustement valeur d'une rubrique
  const handleCellClick = (row, column, value) => {
    if (column === 'note' || column === 'signe') return;
    if (row.nature !== 'TOTAL' && row.nature !== 'TITRE') {
      setDetailRow(row);
      setDetailColumnHeader(column);
      setDetailValue(value);
      setOpenTableDetail(true);
    }
  }

  //traitement des données après action dans le popup ajustement
  const handleRefreshTableAjust = (value) => {
    refreshTable(value);
    if (value) {
      setOpenTableDetail(false);
    } else {
      setOpenTableDetail(false);
    }
  }

  //calcul total
  const totalColumnAjust = (rows, columnId, nature) => {

    const total = rows.reduce((acc, item) => {
      const Value = parseFloat(item[columnId]) || 0; // Convertir en nombre
      return acc + Value;
    }, 0);

    return total;
  };

  return (
    <Box sx={{ width: '100%', padding: 0, margin: 0 }}>
      {
        (openTableDetail && canView) ?
          <PopupAjustRubriqueDRFEbilan
            canView={canView}
            canAdd={canAdd}
            canDelete={canDelete}
            canModify={canModify}
            actionState={handleRefreshTableAjust}
            row={detailRow}
            column={detailColumnHeader}
            value={detailValue}
            dataAjust={[]}
            deviseParDefaut={deviseParDefaut}
          />
          :
          null
      }
      <TableContainer component={Paper} sx={{ width: '100%', overflowX: 'auto' }}>
        <Table sx={{ width: '100%', border: '1px solid #ddd', }} aria-label="simple table">
          <TableHead
            style={{
              backgroundColor: initial.theme,
              position: 'sticky',
              top: 0,
              zIndex: 1,
            }}
          >
            <TableRow>
              <TableCell
                key={0}
                align={"center"}
                style={{
                  maxWidth: 10,
                  paddingTop: '0px',
                  paddingBottom: '0px',
                  borderRight: '1px solid #ddd',
                  borderLeft: '1px solid #ddd',
                  fontSize: 15,
                  color: 'white'
                }}
              >

              </TableCell>

              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align}
                  style={{
                    fontWeight: 'bold',
                    top: 5,
                    minWidth: column.minWidth,
                    paddingTop: '5px',
                    paddingBottom: '5px',
                    borderRight: '1px solid #ddd',
                    borderLeft: '1px solid #ddd',
                    fontSize: 15,
                    color: 'white'
                  }}
                >
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => {
              let rowStyle = {};
              let cellStyle = {};
              const rowKey = row.id;
              const isOpen = openRows[rowKey] || false;

              switch (row.niveau) {
                case 0:
                  rowStyle = { fontWeight: 'bold', backgroundColor: '#f0f0f0' }; // Pour les titres sans total
                  cellStyle = { fontWeight: 'bold' };
                  break;
                case 1:
                  rowStyle = { fontWeight: 'bold', backgroundColor: '#f0f0f0' }; // Pour les titres avec total
                  cellStyle = { fontWeight: 'bold' };
                  break;
                case 2:
                  rowStyle = { fontWeight: 'normal', color: 'black' }; // Pour les rubriques normales
                  cellStyle = {};
                  break;
                case 3:
                  rowStyle = { fontStyle: 'italic', color: 'black' }; // Pour le sous groupe d'une rubrique
                  cellStyle = { paddingLeft: '50px' };
                  break;
                case 4:
                  rowStyle = { fontWeight: 'normal', color: 'white', backgroundColor: '#89A8B2' }; // pour les lignes totaux
                  cellStyle = {};
                  break;
                default:
                  rowStyle = { fontWeight: 'normal', color: 'black' }; // Valeur par défaut pour d'autres niveaux
                  cellStyle = {};
              }

              return (
                <React.Fragment key={rowKey}>
                  <TableRow
                    style={{ border: 'none', height: '20px', ...rowStyle }}
                  >
                    <TableCell
                      style={{
                        fontWeight: 'bold',
                        top: 5,
                        width: 40,
                        paddingTop: '5px',
                        paddingBottom: '5px',
                        border: 'none',
                        fontSize: 15,
                        color: 'white'
                      }}
                    >
                      {row.niveau === 4 || row.niveau === 0 || row.niveau === 1
                        ? null
                        : row.nature === 'TOTAL'
                          ? null
                          : noCollapsible
                            ? null
                            : <IconButton
                              style={{
                                height: '20px', width: '20px',
                                textTransform: 'none', outline: 'none'
                              }}
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation(); // évite de déclencher handleRowClick
                                toggleRow(rowKey);
                              }}
                            >

                              {isOpen ? <IndeterminateCheckBoxIcon color='primary' /> : <AddBoxIcon color='primary' />}
                            </IconButton>
                      }
                    </TableCell>

                    {columns.map((column, idx) => {
                      const value = row[column.id];

                      if (column.id === targetColumnId) {
                        return (
                          <TableCell
                            key={column.id}
                            align={column.align}
                            style={{
                              paddingTop: '5px',
                              paddingBottom: '5px',
                              fontSize: 15,
                              ...cellStyle,
                            }}
                          >
                            {column.isNumber
                              ? column.format(value)
                              : value}
                          </TableCell>
                        );
                      } else if (column.id !== targetColumnId && row.niveau === 0) {
                        return (
                          <TableCell
                            key={column.id}
                            align={column.align}
                            style={{
                              paddingTop: '5px',
                              paddingBottom: '5px',
                              fontWeight: row.niveau === 1 ? 'bold' : 'normal',
                              fontSize: 15,
                            }}
                          >

                          </TableCell>
                        );
                      } else {
                        return (
                          <TableCell
                            key={column.id}
                            align={column.align}
                            style={{
                              paddingTop: '5px',
                              paddingBottom: '5px',
                              fontWeight: row.niveau === 1 ? 'bold' : 'normal',
                              fontSize: 15,
                              cursor: `${(state || !canModify) || column.id === "note" || column.id === "signe" || row.nature === 'TOTAL' || row.nature === 'TITRE' ? '' : 'pointer'}`
                            }}
                            onClick={() => {
                              if (state || !canModify) return;
                              handleCellClick(row, column.id, value);
                            }}
                          >
                            {column.isNumber
                              ? (row.ajustsDRF && row.ajustsDRF.length > 0)
                                ? <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                                  <FaRegPenToSquare style={{ color: '#f44336', width: 20, heigth: 20 }} />
                                  <div style={{ width: '95%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                                    {column.format(value)}
                                  </div>
                                </div>
                                : column.format(value)
                              : value
                            }
                          </TableCell>
                        );
                      }
                    })}
                  </TableRow>

                  {/* LIGNE COLLAPSIBLE */}
                  <TableRow
                    style={{
                      fontWeight: 'bold',
                      top: 5,
                      marginTop: 20,
                      padding: 0,
                      borderRight: '1px solid #ddd',
                      borderLeft: '1px solid #ddd',
                      fontSize: 15,
                      color: 'white',
                    }}
                  >
                    <TableCell
                      colSpan={columns.length}
                      style={{ paddingBottom: 0, paddingTop: 0 }}
                    >
                      <Collapse
                        in={!!isOpen} timeout="auto" unmountOnExit
                      >
                        <Box margin={1}
                          sx={{ marginLeft: 10, marginTop: 5, marginBottom: 5 }}
                        >
                          <Chip
                            icon={<RiExchangeBoxFill style={{ color: 'white', width: 20, height: 20, marginLeft: 10 }} />}
                            label={row.subtable === 1 ? "Ajustements brut :" : "Ajustements:"}

                            style={{
                              width: 175,
                              display: 'flex', // ou block, selon le rendu souhaité
                              justifyContent: 'space-between',
                              backgroundColor: '#67AE6E',
                              color: 'white'
                            }}
                          />

                          {(row.ajustsDRF && row.ajustsDRF.length > 0) ? (
                            <Table size="small" aria-label="details">
                              <TableHead>
                                <TableRow style={{ border: 'none' }}>
                                  <TableCell style={{ width: 375, border: 'none' }}>
                                    <Typography style={{ fontWeight: 'bold' }}>
                                      Motif
                                    </Typography>
                                  </TableCell>
                                  <TableCell align='right' style={{ width: 200, border: 'none' }}>
                                    <Typography style={{ fontWeight: 'bold' }}>
                                      Montant
                                    </Typography>
                                  </TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {row.ajustsDRF.map((ajust, index) => (
                                  <TableRow
                                    key={index}
                                    style={{
                                      backgroundColor: index % 2 === 0 ? '#ffffff' : '#f5f5f5',
                                    }}
                                  >
                                    <TableCell style={{ border: 'none' }}>{ajust.motif}</TableCell>
                                    <TableCell style={{ border: 'none' }} align={"right"}>{ajust.montant.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>

                              <TableFooter
                                style={{
                                  backgroundColor: '#E4EFE7',
                                  position: 'sticky',
                                  bottom: 0,
                                  zIndex: 1,
                                }}
                              >
                                <TableRow style={{ border: 'none' }}>
                                  <TableCell style={{ width: 850, border: 'none' }}>
                                    <Typography style={{ fontWeight: 'bold' }}>
                                      Total
                                    </Typography>
                                  </TableCell>
                                  <TableCell align='right'
                                    style={{
                                      width: 200, border: 'none', fontSize: 14, fontWeight: 'bold'
                                    }}
                                  >
                                    {
                                      totalColumnAjust(row.ajustsDRF, "montant", 'BRUT').toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                    }
                                  </TableCell>
                                </TableRow>
                              </TableFooter>
                            </Table>
                          ) : (
                            <Typography variant="body2" style={{ fontStyle: 'italic' }}>Aucun ajustement manuel effectué</Typography>
                          )}
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>

                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>

  );
}

export default VirtualTableDRFEbilan;