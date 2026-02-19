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
import { Box, Chip, Collapse, IconButton, Typography } from '@mui/material';
import AddBoxIcon from '@mui/icons-material/AddBox';
import IndeterminateCheckBoxIcon from '@mui/icons-material/IndeterminateCheckBox';
import { CgDetailsMore } from "react-icons/cg";
import { RiExchangeBoxFill } from "react-icons/ri";
import PopupAjustRubriqueEbilanEtatFinancier from './popup/popupAjustRubriqueEbilanEtatFinancier';
import { FaRegPenToSquare } from "react-icons/fa6";
import { init } from '../../../../init';
import axios from '../../../../config/axios';

const VirtualTableEbilanEtatFinaciere = ({ refreshTable, columns, rows, noCollapsible, state, setIsRefreshed, type, canModify, canAdd, canDelete, canView, deviseParDefaut }) => {
  const initial = init[0];
  const targetColumnId = 'libelle';
  const [openRows, setOpenRows] = useState({});
  const [openTableDetail, setOpenTableDetail] = useState(false);
  const [detailRow, setDetailRow] = useState([]);
  const [detailColumnHeader, setDetailColumnHeader] = useState();
  const [detailValue, setDetailValue] = useState();

  const [rowInfo, setRowInfo] = useState({});

  const toggleRow = (rowKey, row) => {
    axios.post('/administration/etatFinancier/getEtatFinancierDetail', {
      id_compte: row.id_compte,
      id_dossier: row.id_dossier,
      id_exercice: row.id_exercice,
      id_etat: row.id_etat,
      id_rubrique: row.id_rubrique,
      subtable: row.subtable
    })
      .then((response) => {
        const resData = response?.data;
        if (resData?.state) {
          setRowInfo((prev) => ({
            ...prev,
            [rowKey]: resData.detail || []
          }));
        }
      });

    setOpenRows((prev) => ({
      ...prev,
      [rowKey]: !prev[rowKey],
    }));
  };

  //ajout de montant ajustement valeur d'une rubrique
  const handleCellClick = (row, column, value) => {
    if (row.type === 'TOTAL' || row.type === 'TITRE' || row.type === 'TOTAL SOUS-RUBRIQUES' || row.type === 'SOUS-TOTAL') return;

    let isClickable = false;

    if ((row.id_etat === 'BILAN_ACTIF')) {
      if (column === 'montantbrut' || column === 'montantamort') {
        isClickable = true;
      }
    } else {
      if (column === 'montantnet') {
        isClickable = true;
      }
    }

    if (isClickable) {
      setDetailRow(row || []);
      setDetailColumnHeader(column);
      setDetailValue(value);
      setOpenTableDetail(true);
    }
  };

  //traitement des données après action dans le popup ajustement
  const handleRefreshTableAjust = (value) => {
    if (value) {
      setOpenTableDetail(false);
    } else {
      setOpenTableDetail(false);
    }
  }

  //calcul total
  const totalColumn = (rows, columnId) => {
    const total = rows.reduce((acc, item) => {
      const Value = parseFloat(item[columnId]) || 0; // Convertir en nombre
      return acc + Value;
    }, 0);

    return total;
  };

  //calcul total
  const totalColumnAjust = (rows, columnId, nature) => {

    const data = rows.filter(item => item.nature === nature);

    const total = data.reduce((acc, item) => {
      const Value = parseFloat(item[columnId]) || 0; // Convertir en nombre
      return acc + Value;
    }, 0);

    return total;
  };

  //calcul total
  const totalColumnDetail = (rows, columnId) => {
    let data = [];
    if (columnId === 'montantbrut') {
      data = rows.filter(item => item.nature === 'BRUT');
    } else if (columnId === 'montantamort') {
      data = rows.filter(item => item.nature === 'AMORT');
    } else if (columnId === 'montantnet') {
      data = rows.filter(item => item.nature === 'BRUT' && (item.id_etat !== 'BILAN_ACTIF' || item.id_etat === "BILAN_PASSIF"));
    }

    const total = data.reduce((acc, item) => {
      const Value = parseFloat(item["montant"]) || 0;
      return acc + Value;
    }, 0);

    return total;
  };

  return (
    <Box sx={{ width: '100%', padding: 0, margin: 0 }}>
      {
        (openTableDetail && canView) ?
          <PopupAjustRubriqueEbilanEtatFinancier
            actionState={handleRefreshTableAjust}
            row={detailRow}
            column={detailColumnHeader}
            setIsRefreshed={setIsRefreshed}
            canAdd={canAdd}
            canModify={canModify}
            canDelete={canDelete}
            canView={canView}
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

              switch (row.type) {
                case "RUBRIQUE":
                  rowStyle = { fontWeight: 'normal', color: 'black' };
                  cellStyle = {};
                  break;
                case "TITRE":
                  rowStyle = { fontWeight: 'bold', backgroundColor: '#f0f0f0' };
                  cellStyle = { fontWeight: 'bold' };
                  break;
                case "SOUS-RUBRIQUE":
                  rowStyle = { fontStyle: 'italic', color: 'black' };
                  cellStyle = { paddingLeft: '50px' };
                  break;
                case "SOUS-TOTAL":
                  rowStyle = { fontWeight: 'normal', color: 'white', backgroundColor: '#baced3ff' };
                  cellStyle = {};
                  break;
                case "TOTAL":
                  rowStyle = { fontWeight: 'normal', color: 'white', backgroundColor: '#89A8B2' };
                  cellStyle = {};
                  break;
                default:
                  rowStyle = { fontWeight: 'normal', color: 'black' };
                  cellStyle = {};
              }

              return (
                <React.Fragment key={rowKey}>
                  <TableRow
                    style={{ border: 'none', height: '20px', ...rowStyle }}
                  // onClick={() => handleRowClick(row)}
                  >
                    <TableCell
                      style={{
                        fontWeight: 'bold',
                        top: 5,
                        width: 40,
                        paddingTop: '5px',
                        paddingBottom: '5px',
                        // borderRight: '1px solid #ddd', 
                        // borderLeft: '1px solid #ddd',
                        border: 'none',
                        fontSize: 15,
                        color: 'white',
                      }}
                    >
                      {
                        (row.type === "TITRE" || row.type === "TOTAL SOUS-RUBRIQUES" || row.type === 'TOTAL' || row.type === "SOUS-TOTAL")
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
                                e.stopPropagation();
                                toggleRow(rowKey, row);
                              }}
                            >

                              {isOpen ? <IndeterminateCheckBoxIcon color='primary' /> : <AddBoxIcon color='primary' />}
                            </IconButton>
                      }
                    </TableCell>

                    {columns.map((column, idx) => {
                      const value = row[column.id] || 0;

                      return (

                        <TableCell
                          key={column.id}
                          align={column.align}
                          style={{
                            paddingTop: '5px',
                            paddingBottom: '5px',
                            fontWeight: row.type === "TITRE" ? 'bold' : 'normal',
                            fontSize: 15,
                            cursor: `${(row.type === "TOTAL" || row.type === "TITRE" || row.type === 'TOTAL SOUS-RUBRIQUES' || row.type === 'SOUS-TOTAL' || column.id === "libelle" || column.id === "montantnetn1" || column.id === "variation" || (row.id_etat === "BILAN_ACTIF" && column.id === "montantnet")) || state || !canModify ? "" : "pointer"}`,
                            ...(column.id !== 'variation' ? cellStyle : {})
                          }}
                          onClick={() => {
                            if (state || !canModify) return;
                            handleCellClick(row, column.id, value);
                          }}
                        >
                          {
                            row.type === "TITRE" ? column.id === 'libelle' ? value : '' :
                              column.isNumber
                                ? (row.ajusts && row.ajusts.length > 0 && totalColumnDetail(row.ajusts, column.id) !== 0)
                                  ? <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                                    {
                                      column.id === 'montantbrut' || column.id === 'montantamort' || column.id === 'montantnet' || columns.id === "montantnetn1"
                                        ? <FaRegPenToSquare style={{ color: '#f44336', width: 20, heigth: 20 }} />
                                        : null
                                    }
                                    <div style={{ width: '95%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                                      {column.format(value)}
                                    </div>

                                  </div>
                                  : column.format(value)
                                : value
                          }
                        </TableCell>
                      )
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
                      style={{ paddingBottom: 0, paddingTop: 0, border: 'none' }}
                    >
                      <Collapse
                        in={!!isOpen} timeout="auto" unmountOnExit
                      >
                        <Box
                          margin={1}
                          sx={{ marginLeft: 10, marginTop: 5 }}
                        >
                          <Chip
                            icon={<CgDetailsMore style={{ color: 'white', width: 20, height: 20, marginLeft: 10 }} />}
                            label={"Détails :"}

                            style={{
                              width: 175,
                              display: 'flex',
                              justifyContent: 'space-between',
                              backgroundColor: '#67AE6E',
                              color: 'white'
                            }}
                          />

                          {rowInfo[rowKey]?.length > 0 ? (
                            <Table size="small" aria-label="details">
                              <TableHead>
                                <TableRow style={{ border: 'none' }}>
                                  <TableCell style={{ width: 150, border: 'none' }}>
                                    <Typography style={{ fontWeight: 'bold' }}>
                                      N° Compte
                                    </Typography>
                                  </TableCell>
                                  <TableCell style={{ width: 450, border: 'none' }}>
                                    <Typography style={{ fontWeight: 'bold' }}>
                                      Libellé
                                    </Typography>
                                  </TableCell>
                                  <TableCell align={"right"} style={{ width: 200, border: 'none' }}>
                                    <Typography style={{ fontWeight: 'bold' }}>
                                      Solde débit
                                    </Typography>
                                  </TableCell>
                                  <TableCell align={"right"} style={{ width: 200, border: 'none' }}>
                                    <Typography style={{ fontWeight: 'bold' }}>
                                      Solde crédit
                                    </Typography>
                                  </TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {rowInfo[rowKey].map((detail, index) => (
                                  <TableRow
                                    key={index}
                                    style={{
                                      backgroundColor: index % 2 === 0 ? '#ffffff' : '#f5f5f5',
                                    }}
                                  >
                                    <TableCell style={{ border: 'none' }}>{detail.compte}</TableCell>
                                    <TableCell style={{ border: 'none' }}>{detail.libelle}</TableCell>
                                    <TableCell style={{ border: 'none' }} align={"right"}>
                                      {detail.soldedebit.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </TableCell>
                                    <TableCell style={{ border: 'none' }} align={"right"}>
                                      {detail.soldecredit.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </TableCell>
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
                                  <TableCell style={{ width: 150, border: 'none' }}>
                                    <Typography style={{ fontWeight: 'bold' }}>
                                      Total
                                    </Typography>
                                  </TableCell>
                                  <TableCell style={{ width: 450, border: 'none' }}></TableCell>
                                  <TableCell align='right' style={{ width: 200, border: 'none', fontSize: 14, fontWeight: 'bold' }} >
                                    {totalColumn(rowInfo[rowKey], "soldedebit").toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </TableCell>
                                  <TableCell align='right' style={{ width: 200, border: 'none', fontSize: 14, fontWeight: 'bold' }}>
                                    {totalColumn(rowInfo[rowKey], "soldecredit").toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </TableCell>
                                </TableRow>
                              </TableFooter>
                            </Table>
                          ) : (
                            <Typography variant="body2" style={{ fontStyle: 'italic' }}>Aucun détail</Typography>
                          )}
                        </Box>

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

                          {(row.ajusts && row.ajusts.filter(item => item.nature === 'BRUT').length > 0) ? (
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
                                {row.ajusts.filter(item => item.nature === 'BRUT').map((ajust, index) => (
                                  <TableRow
                                    key={index}
                                    style={{
                                      backgroundColor: index % 2 === 0 ? '#ffffff' : '#f5f5f5',
                                    }}
                                  >
                                    <TableCell style={{ border: 'none' }}>{ajust.motif}</TableCell>
                                    {/* <TableCell style={{border:'none'}}>{ajust.nature}</TableCell> */}
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
                                      totalColumnAjust(row.ajusts, "montant", 'BRUT').toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                    }
                                  </TableCell>
                                </TableRow>
                              </TableFooter>
                            </Table>
                          ) : (
                            <Typography variant="body2" style={{ fontStyle: 'italic' }}>Aucun ajustement manuel effectué</Typography>
                          )}
                        </Box>

                        {row.subtable === 1
                          ? <Box margin={1}
                            sx={{ marginLeft: 10, marginTop: 2, marginBottom: 5 }}
                          >
                            <Chip
                              icon={<RiExchangeBoxFill style={{ color: 'white', width: 25, height: 20, marginLeft: 10 }} />}
                              label={"Ajustements Amort :"}

                              style={{
                                width: 175,
                                display: 'flex', // ou block, selon le rendu souhaité
                                justifyContent: 'space-between',
                                backgroundColor: '#67AE6E',
                                color: 'white'
                              }}
                            />

                            {(row.ajusts && row.ajusts.filter(item => item.nature === 'AMORT').length > 0) ? (
                              <Table size="small" aria-label="details">
                                <TableHead>
                                  <TableRow style={{ border: 'none' }}>
                                    <TableCell style={{ width: 375, border: 'none' }}>
                                      <Typography style={{ fontWeight: 'bold' }}>
                                        Motif
                                      </Typography>
                                    </TableCell>
                                    {/* <TableCell style={{width: 75, border:'none'}}>
                                            <Typography style={{fontWeight:'bold'}}>
                                              nature
                                            </Typography>
                                          </TableCell> */}
                                    <TableCell align='right' style={{ width: 200, border: 'none' }}>
                                      <Typography style={{ fontWeight: 'bold' }}>
                                        Montant
                                      </Typography>
                                    </TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {row.ajusts.filter(item => item.nature === 'AMORT').map((ajust, index) => (
                                    <TableRow
                                      key={index}
                                      style={{
                                        backgroundColor: index % 2 === 0 ? '#ffffff' : '#f5f5f5',
                                      }}
                                    >
                                      <TableCell style={{ border: 'none' }}>{ajust.motif}</TableCell>
                                      {/* <TableCell style={{border:'none'}}>{ajust.nature}</TableCell> */}
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
                                        totalColumnAjust(row.ajusts, "montant", 'AMORT').toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                      }
                                    </TableCell>
                                  </TableRow>
                                </TableFooter>
                              </Table>
                            ) : (
                              <Typography variant="body2" style={{ fontStyle: 'italic' }}>Aucun ajustement manuel effectué</Typography>
                            )}
                          </Box>
                          : null
                        }

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

export default VirtualTableEbilanEtatFinaciere;