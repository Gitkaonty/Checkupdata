import * as React from 'react';
import { useState } from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import { FormControl, InputLabel, MenuItem, Select, TableFooter } from '@mui/material';
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
import PopupAjustRubriqueSDREbilan from '../FormulaireModifTableauEbilan/popupAjustRubriqueSDREbilan';
import { FaRegPenToSquare } from "react-icons/fa6";

const VirtualTableSDRbilan = ({ refreshTable, columns, rows, noCollapsible, state, canModify, canAdd, canDelete, canView, deviseParDefaut }) => {
  const initial = init[0];
  const targetColumnId = 'rubriquesmatrix.libelle';
  const [openRows, setOpenRows] = React.useState({});
  const [openTableDetail, setOpenTableDetail] = useState(false);
  const [detailRow, setDetailRow] = useState([]);
  const [detailColumnHeader, setDetailColumnHeader] = useState();
  const [detailValue, setDetailValue] = useState();
  const [colonne, setColonne] = useState('TOUS');

  const toggleRow = (rowKey) => {
    setOpenRows((prev) => ({
      ...prev,
      [rowKey]: !prev[rowKey],
    }));
  };
  //ajout de montant ajustement valeur d'une rubrique
  const handleCellClick = (row, column, value) => {
    if ((column === 'solde_imputable' || column === 'solde_non_imputable') && row.ordre > 8) {

    } else {
      if (column !== "total" && row.id_rubrique !== 8) {
        setDetailRow(row);
        setDetailColumnHeader(column);
        setDetailValue(value);
        setOpenTableDetail(true);
      }
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
    //const data = rows?.filter(item => item.nature === nature);
    const total = rows.reduce((acc, item) => {
      const Value = parseFloat(item[columnId]) || 0; // Convertir en nombre
      return acc + Value;
    }, 0);

    return total;
  };

  //calcul total
  const totalColumnDetail = (rows, columnId) => {
    let data = [];
    if (columnId === 'exercice') {
      data = rows.filter(item => item.nature === 'EXERCICE');
    } else if (columnId === 'n1') {
      data = rows.filter(item => item.nature === 'N1');
    } else if (columnId === 'n2') {
      data = rows.filter(item => item.nature === 'N2');
    } else if (columnId === 'n3') {
      data = rows.filter(item => item.nature === 'N3');
    } else if (columnId === 'n4') {
      data = rows.filter(item => item.nature === 'N4');
    } else if (columnId === 'n5') {
      data = rows.filter(item => item.nature === 'N5');
    } else if (columnId === 'n6') {
      data = rows.filter(item => item.nature === 'N6');
    } else if (columnId === 'solde_imputable') {
      data = rows.filter(item => item.nature === 'SOLDE_IMPUTABLE');
    } else if (columnId === 'solde_non_imputable') {
      data = rows.filter(item => item.nature === 'SOLDE_NON_IMPUTABLE');
    }

    const total = data.reduce((acc, item) => {
      const Value = parseFloat(item["montant"]) || 0; // Convertir en nombre
      return acc + Value;
    }, 0);

    return total;
  };

  return (
    <Box sx={{ width: '100%', padding: 0, margin: 0 }}>
      {
        (openTableDetail && canView)
          ?
          <PopupAjustRubriqueSDREbilan
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
                case 40:
                  rowStyle = { fontWeight: 'normal', color: 'white', backgroundColor: '#B9EFC6' }; // pour les lignes totaux
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
                              // borderRight: '1px solid #ddd', borderLeft: '1px solid #ddd' ,
                              fontSize: 15,
                              ...cellStyle,
                            }}
                          >
                            {column.isNumber
                              ? column.format(value)
                              : value}
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
                              // borderRight: '1px solid #ddd', borderLeft: '1px solid #ddd' ,
                              backgroundColor: ((column.id === 'solde_imputable' || column.id === 'solde_non_imputable') && row.ordre > 8) ? 'white' : 'transparent',
                              fontSize: 15,
                              cursor: `${(state || !canModify) || column.id === "libelle" ? '' : 'pointer'}`
                            }}
                            onClick={() => {
                              if (state || !canModify) return;
                              handleCellClick(row, column.id, value);
                            }}
                          >
                            {column.isNumber
                              ? (row.ajustsSDR && row.ajustsSDR.length > 0 && totalColumnDetail(row.ajustsSDR, column.id) !== 0)
                                ? <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                                  <FaRegPenToSquare style={{ color: '#f44336', width: 20, heigth: 20 }} />
                                  <div style={{ width: '95%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                                    {((column.id === 'solde_imputable' || column.id === 'solde_non_imputable') && row.ordre > 8) ? '' : column.format(value)}
                                  </div>
                                </div>
                                : ((column.id === 'solde_imputable' || column.id === 'solde_non_imputable') && row.ordre > 8) ? '' : column.format(value)
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
                        in={isOpen} timeout="auto" unmountOnExit
                      >
                        <Box margin={1}
                          sx={{ marginLeft: 10, marginTop: 5, marginBottom: 5 }}
                        >
                          <Chip
                            icon={<RiExchangeBoxFill style={{ color: 'white', width: 20, height: 20, marginLeft: 10 }} />}
                            label={'AJustements'}

                            style={{
                              width: 175,
                              display: 'flex', // ou block, selon le rendu souhaité
                              justifyContent: 'space-between',
                              backgroundColor: '#67AE6E',
                              color: 'white'
                            }}
                          />

                          <Box margin={1}
                            sx={{
                              marginLeft: 0,
                              marginTop: 2,
                              marginBottom: 1,
                              display: 'flex',
                              justifyContent: 'flex-end',
                              alignItems: 'center',
                              width: '85%'
                            }}
                          >
                            <FormControl size="small" fullWidth style={{ marginBottom: '0px', width: '250px' }}>
                              <InputLabel style={{ color: 'black' }}>Filtrer par: </InputLabel>
                              <Select
                                label="Ajustements"
                                name="ajustements"
                                value={colonne}
                                fullWidth
                                style={{ marginBottom: '0px', width: '250px', borderBlockColor: 'red' }}
                                onChange={(e) => setColonne(e.target.value)}
                              >
                                <MenuItem key="TOUS" value="TOUS"><em>Tous</em></MenuItem>
                                <MenuItem key="N" value="N">Colonne Exercice</MenuItem>
                                <MenuItem key="N1" value="N1">Colonne N-1</MenuItem>
                                <MenuItem key="N2" value="N2">Colonne N-2</MenuItem>
                                <MenuItem key="N3" value="N3">Colonne N-3</MenuItem>
                                <MenuItem key="N4" value="N4">Colonne N-4</MenuItem>
                                <MenuItem key="N5" value="N5">Colonne N-5</MenuItem>
                                <MenuItem key="N6" value="N6">Colonne N-6</MenuItem>
                                <MenuItem key="SOLDE_IMPUTABLE" value="SOLDE_IMPUTABLE">Solde imputable</MenuItem>
                                <MenuItem key="SOLDE_NON_IMPUTABLE" value="SOLDE_NON_IMPUTABLE">Solde non imputable</MenuItem>
                              </Select>
                            </FormControl>

                          </Box>

                          {(row.ajustsSDR.filter(colonne === 'TOUS' ? item => item.nature !== colonne : item => item.nature === colonne) && row.ajustsSDR.filter(colonne === 'TOUS' ? item => item.nature !== colonne : item => item.nature === colonne).length > 0) ? (
                            <Table size="small" aria-label="details" style={{ width: '85%' }}>
                              <TableHead>
                                <TableRow style={{ border: 'none' }}>
                                  <TableCell style={{ width: 300, border: 'none' }}>
                                    <Typography style={{ fontWeight: 'bold' }}>
                                      Motif
                                    </Typography>
                                  </TableCell>
                                  <TableCell style={{ width: 150, border: 'none' }}>
                                    <Typography style={{ fontWeight: 'bold' }}>
                                      Colonne
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
                                {row.ajustsSDR.filter(colonne === 'TOUS' ? item => item.nature !== colonne : item => item.nature === colonne).map((ajust, index) => (
                                  <TableRow
                                    key={index}
                                    style={{
                                      backgroundColor: index % 2 === 0 ? '#ffffff' : '#f5f5f5',
                                    }}
                                  >
                                    <TableCell style={{ border: 'none' }}>{ajust.motif}</TableCell>
                                    <TableCell style={{ border: 'none' }}>
                                      {
                                        ajust.nature === 'N'
                                          ? 'Exercice N'
                                          : ajust.nature === 'N1'
                                            ? 'Exercice N-1'
                                            : ajust.nature === 'N2'
                                              ? 'Exercice N-2'
                                              : ajust.nature === 'N3'
                                                ? 'Exercice N-3'
                                                : ajust.nature === 'N4'
                                                  ? 'Exercice N-4'
                                                  : ajust.nature === 'N5'
                                                    ? 'Exercice N-5'
                                                    : ajust.nature === 'N6'
                                                      ? 'Exercice N-6'
                                                      : ajust.nature === 'SOLDE_IMPUTABLE'
                                                        ? 'Solde imputable'
                                                        : 'Solde non imputable'
                                      }
                                    </TableCell>
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
                                  <TableCell style={{ width: 800, border: 'none' }}>
                                    <Typography style={{ fontWeight: 'bold' }}>
                                      Total
                                    </Typography>
                                  </TableCell>
                                  <TableCell style={{ width: 75, border: 'none' }}>
                                    <Typography style={{ fontWeight: 'bold' }}>

                                    </Typography>
                                  </TableCell>
                                  <TableCell align='right'
                                    style={{
                                      width: 200, border: 'none', fontSize: 14, fontWeight: 'bold'
                                    }}
                                  >
                                    {
                                      totalColumnAjust(row.ajustsSDR.filter(colonne === 'TOUS' ? item => item.nature !== colonne : item => item.nature === colonne), "montant").toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
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

export default VirtualTableSDRbilan;