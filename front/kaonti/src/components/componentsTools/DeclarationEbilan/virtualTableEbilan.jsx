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
import { CgDetailsMore } from "react-icons/cg";
import { RiExchangeBoxFill } from "react-icons/ri";
import PopupAjustRubriqueEbilan from '../FormulaireModifTableauEbilan/popupAjustRubriqueEbilan';
import { FaRegPenToSquare } from "react-icons/fa6";

const VirtualTableEbilan = ({ refreshTable, columns, rows, noCollapsible, state, type, canModify, canAdd, canDelete, canView, deviseParDefaut }) => {
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
    if (row.nature === 'TOTAL' || row.nature === 'TITRE') return;

    let isClickable = false;

    if (row.id_etat === 'BILAN') {
      if (
        column === 'montantbrut' ||
        column === 'montantamort' ||
        (type === "Passif" && column === 'montantnet')
      ) {
        isClickable = true;
      }
    } else {
      if (column === 'montantnet') {
        isClickable = true;
      }
    }

    if (isClickable) {
      setDetailRow(row);
      setDetailColumnHeader(column);
      setDetailValue(value);
      setOpenTableDetail(true);
    }
  };

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
  const totalColumnDetail = (rows, columnId, subtable) => {
    let data = [];
    if (columnId === 'montantbrut') {
      data = rows.filter(item => item.nature === 'BRUT');
    } else if (columnId === 'montantamort') {
      data = rows.filter(item => item.nature === 'AMORT');
    } else if (columnId === 'montantnet') {
      data = rows.filter(item =>
        item.nature === 'BRUT' &&
        (!(item.id_etat === 'BILAN' && subtable === 1) ||
          (item.id_etat === 'BILAN' && subtable === 2)
        )
      );
    }

    const total = data.reduce((acc, item) => {
      const Value = parseFloat(item["montant"]) || 0;
      return acc + Value;
    }, 0);

    return total;
  };

  return (
    <>
      {
        (openTableDetail && canView) ?
          <PopupAjustRubriqueEbilan
            actionState={handleRefreshTableAjust}
            row={detailRow}
            column={detailColumnHeader}
            value={detailValue}
            dataAjust={[]}
            canAdd={canAdd}
            canModify={canModify}
            canDelete={canDelete}
            canView={canView}
            deviseParDefaut={deviseParDefaut}
          />
          :
          null
      }
      <Box sx={{ width: '100%', padding: 0, margin: 0 }}>
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
                        return (
                          <TableCell
                            key={column.id}
                            align={column.align}
                            style={{
                              paddingTop: '5px',
                              paddingBottom: '5px',
                              fontWeight: row.niveau === 1 ? 'bold' : 'normal',
                              // borderRight: '1px solid #ddd', borderLeft: '1px solid #ddd' ,
                              fontSize: 15,
                              cursor: `${(row.type === "TOTAL" || row.type === "TITRE" || row.type === 'TOTAL SOUS-RUBRIQUES' || row.type === 'SOUS-TOTAL' || column.id === targetColumnId || column.id === "note" || column.id === "montantnetn1" || column.id === "variation" || (row.id_etat === "BILAN" && row.subtable === 1 && column.id === "montantnet")) || state || !canModify ? "" : "pointer"}`,
                              ...(column.id !== "note" ? cellStyle : {})
                            }}
                            onClick={() => {
                              if (state || !canModify) return;
                              handleCellClick(row, column.id, value);
                            }}
                          >
                            {column.isNumber
                              ? (row.ajusts && row.ajusts.length > 0 && totalColumnDetail(row.ajusts, column.id, row.subtable) !== 0)
                                ? <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                                  {
                                    column.id === 'montantbrut' || column.id === 'montantamort' || column.id === 'montantnet'
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
                        );
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
                            sx={{ marginLeft: 10 }}
                          >
                            <Chip
                              icon={<CgDetailsMore style={{ color: 'white', width: 20, height: 20, marginLeft: 10 }} />}
                              label={"Détails :"}

                              style={{
                                width: 175,
                                display: 'flex', // ou block, selon le rendu souhaité
                                justifyContent: 'space-between',
                                backgroundColor: '#67AE6E',
                                color: 'white'
                              }}
                            />

                            {(row.infosCompte && row.infosCompte.length > 0) ? (
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
                                  {row.infosCompte.map((detail, index) => (
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
                                    <TableCell style={{ width: 450, border: 'none' }}>

                                    </TableCell>
                                    <TableCell align='right'
                                      style={{
                                        width: 200, border: 'none', fontSize: 14, fontWeight: 'bold'
                                      }}
                                    >
                                      {
                                        totalColumn(row.infosCompte, "soldedebit").toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                      }
                                    </TableCell>
                                    <TableCell align='right'
                                      style={{
                                        width: 200, border: 'none', fontSize: 14, fontWeight: 'bold'
                                      }}
                                    >
                                      {
                                        totalColumn(row.infosCompte, "soldecredit").toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                      }
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
                                    {/* <TableCell style={{width: 75, border:'none'}}>
                                        <Typography style={{fontWeight:'bold'}}>
                                          Nature
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
                                    {/* <TableCell style={{width: 75, border:'none'}}>
                                        <Typography style={{fontWeight:'bold'}}>
                                          
                                        </Typography>
                                      </TableCell> */}
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
                              sx={{ marginLeft: 10, marginTop: 2, marginBottom: 10 }}
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
                                              Nature
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
                                      {/* <TableCell style={{width: 75, border:'none'}}>
                                            <Typography style={{fontWeight:'bold'}}>
                                              
                                            </Typography>
                                          </TableCell> */}
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
    </>
  );
}

export default VirtualTableEbilan;