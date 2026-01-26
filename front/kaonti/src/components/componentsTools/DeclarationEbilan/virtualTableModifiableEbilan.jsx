import React, { useState } from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import { init } from '../../../../init';
import { Box, IconButton, Stack, TableFooter, Tooltip } from '@mui/material';
import { IoMdTrash } from "react-icons/io";
import { IoMdCreate } from "react-icons/io";
import { format } from 'date-fns';
import { TiWarning } from "react-icons/ti";
import { ExpandMore, ExpandLess } from '@mui/icons-material';

const VirtualTableModifiableEbilan = ({ columns, rows, deleteState, modifyState, state, withFooter, withAnomalie, type, canModify, canAdd, canDelete, canView, deviseParDefaut }) => {
  const [openRowsMp, setOpenRowsMp] = useState({});
  const [openRowsBhiapc, setOpenRowsBhiapc] = useState({});
  const initial = init[0];
  const targetColumnId = 'rubriquesmatrix.libelle';

  const handleRowDeleteClick = (row, type) => {
    const newRow = { ...row, type: type };
    deleteState(newRow);
  }

  const handleRowModifClick = (row) => {
    modifyState(row);
  }

  const toggleRowBhiapc = (nif) => setOpenRowsBhiapc(prev => ({ ...prev, [nif]: !prev[nif] }));
  const toggleRowMp = (marche) => setOpenRowsMp(prev => ({ ...prev, [marche]: !prev[marche] }));

  const columnWidths = columns.reduce((acc, column) => {
    acc[column.id] = column.minWidth;
    return acc;
  }, {});

  const totalColumn = (rows, columnId) => {
    return rows.reduce((total, row) => {
      const value = row[columnId];

      if (value != null && !isNaN(value)) {
        total += value;
      }
      return total;
    }, 0);
  };

  const groupedDataBhiapc = rows.reduce((acc, row) => {
    if (!acc[row.nif]) {
      acc[row.nif] = {
        id: row.id,
        id_compte: row.id_compte,
        id_dossier: row.id_dossier,
        id_exercice: row.id_exercice,
        raison_sociale: row.raison_sociale,
        adresse: row.adresse,
        nif: row.nif,
        lignes: [],
        montant_charge: parseFloat(row.montant_charge) || 0,
        montant_beneficiaire: parseFloat(row.montant_beneficiaire) || 0,
        sousTotal: 0
      };
    } else {
      acc[row.nif].montant_charge += parseFloat(row.montant_charge) || 0;
      acc[row.nif].montant_beneficiaire += parseFloat(row.montant_beneficiaire) || 0;
    }

    acc[row.nif].lignes.push(row);

    acc[row.nif].sousTotal = parseFloat(
      (acc[row.nif].montant_charge + acc[row.nif].montant_beneficiaire).toFixed(2)
    );

    return acc;
  }, {})

  const groupedDataMp = rows.reduce((acc, row) => {
    if (!acc[row.marche]) {
      acc[row.marche] = {
        lignes: [],
        marche: row.marche,
        montant_marche_ht: parseFloat(row.montant_marche_ht) || 0,
        montant_paye: parseFloat(row.montant_paye) || 0,
        tmp: parseFloat(row.tmp) || 0,
        niveau: row.niveau,
        sousTotal: 0
      };
    } else {
      acc[row.marche].montant_marche_ht += parseFloat(row.montant_marche_ht) || 0;
      acc[row.marche].montant_paye += parseFloat(row.montant_paye) || 0;
      acc[row.marche].tmp += parseFloat(row.tmp) || 0;
    }

    acc[row.marche].lignes.push(row);

    acc[row.marche].sousTotal =
      acc[row.marche].montant_marche_ht +
      acc[row.marche].montant_paye +
      acc[row.marche].tmp

    return acc;
  }, {})

  return (
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
              {
                type === 'MP' && (
                  <TableCell
                    align="center"
                    className="sticky-action"
                    sx={{
                      fontWeight: 'bold',
                      paddingTop: '5px',
                      paddingBottom: '5px',
                      fontSize: 15,
                      color: 'white',
                      backgroundColor: initial.theme,
                    }}
                  >
                  </TableCell>
                )
              }
              {
                withAnomalie && (
                  <>
                    <TableCell
                      align="center"
                      className="sticky-action"
                      sx={{
                        fontWeight: 'bold',
                        paddingTop: '5px',
                        paddingBottom: '5px',
                        fontSize: 15,
                        color: 'white',
                        backgroundColor: initial.theme,
                      }}
                    >
                    </TableCell>
                    <TableCell
                      align="center"
                      className="sticky-action"
                      sx={{
                        fontWeight: 'bold',
                        paddingTop: '5px',
                        paddingBottom: '5px',
                        fontSize: 15,
                        color: 'white',
                        backgroundColor: initial.theme,
                        minWidth: "50px",
                        borderLeft: '1px solid #ddd',
                      }}
                    >
                      Annomalies
                    </TableCell>
                  </>
                )
              }
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

              <TableCell
                align={"center"}
                style={{
                  fontWeight: 'bold',
                  top: 5,
                  minWidth: "50px",
                  paddingTop: '5px',
                  paddingBottom: '5px',
                  borderRight: '1px solid #ddd',
                  borderLeft: '1px solid #ddd',
                  fontSize: 15,
                  color: 'white'
                }}
              >
                Action
              </TableCell>

            </TableRow>
          </TableHead>
          {
            type === 'BHIAPC' ?
              <TableBody>
                {
                  Object.values(groupedDataBhiapc).map((group, key) => {
                    const commentaires = [];
                    if (!group.nif) commentaires.push("Nif vide")
                    if (!group.raison_sociale) commentaires.push("Raison sociale vide");
                    if (!group.adresse) commentaires.push("Adresse vide");
                    return (
                      <React.Fragment key={key}>
                        <TableRow
                          sx={{
                            position: "sticky",
                            top: 35,
                            zIndex: 2,
                            backgroundColor: "#f5f5f5"
                          }}
                        >
                          {
                            withAnomalie && (
                              <>
                                <TableCell align="center"
                                  style={{
                                    paddingTop: '4px', paddingBottom: '4px', fontSize: '13px', position: "sticky", top: 35
                                  }}
                                >
                                  <IconButton
                                    onClick={() => toggleRowBhiapc(group.nif)}
                                    sx={{
                                      width: 20,
                                      height: 20,
                                    }}
                                    style={{
                                      textTransform: 'none',
                                      outline: 'none',
                                      backgroundColor: "#67AE6E",
                                      color: 'white',
                                    }}
                                  >
                                    {openRowsBhiapc[group.nif] ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
                                  </IconButton>
                                </TableCell>
                                <TableCell
                                  align="center"
                                  style={{ paddingTop: '4px', paddingBottom: '4px', fontSize: '13px', position: "sticky", top: 35 }}
                                >
                                  <Tooltip
                                    title={
                                      commentaires.length > 0
                                        ? commentaires.join("\n")
                                        : "Aucune anomalie trouvée"
                                    }
                                    arrow
                                    slotProps={{
                                      tooltip: {
                                        sx: {
                                          fontSize: "14px",
                                          maxWidth: 400,
                                          whiteSpace: "pre-line"
                                        }
                                      }
                                    }}
                                    placement="right"
                                  >
                                    <span>
                                      <TiWarning size={22} color={`${commentaires.length > 0 ? '#ff086f' : '#39ff08'}`} />
                                    </span>
                                  </Tooltip>
                                </TableCell>
                              </>
                            )
                          }

                          {columns.map((column) => {
                            if (!column.id) return null;
                            let value = group[column.id];

                            if (column.isnumber && (value === null || value === undefined)) {
                              value = 0;
                            }

                            if (['montant_charge', 'montant_beneficiaire', 'nif', 'raison_sociale'].includes(column.id)) {
                              return (
                                <TableCell key={column.id} align={column.align} style={{ paddingTop: '4px', paddingBottom: '4px', fontSize: '13px', position: "sticky", top: 35 }}>
                                  {column.renderCell
                                    ? column.renderCell(value, group)
                                    : column.format && value !== null && value !== undefined
                                      ? typeof value === 'number'
                                        ? column.format(value)
                                        : format(value, "dd/MM/yyyy")
                                      : value}
                                </TableCell>
                              );
                            }
                            return <TableCell key={column.id} align={column.align} style={{ paddingTop: '4px', paddingBottom: '4px', fontSize: '13px', position: "sticky", top: 35 }}></TableCell>
                          })}

                          {
                            !state
                              ?
                              <TableCell align="center" style={{ paddingTop: '4px', paddingBottom: '4px', position: "sticky", top: 35 }}>
                                <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
                                  <IconButton
                                    disabled={!canModify}
                                    onClick={() => handleRowModifClick(group)}
                                    sx={{ p: 0, border: 'none', outline: 'none', '&:focus': { outline: 'none', boxShadow: 'none' } }}
                                    disableFocusRipple
                                  >
                                    <IoMdCreate style={{ width: '22px', height: '22px', color: initial.theme }} />
                                  </IconButton>
                                  <IconButton
                                    disabled={!canDelete}
                                    onClick={() => handleRowDeleteClick(group, 'group')}
                                    sx={{ p: 0, border: 'none', outline: 'none', '&:focus': { outline: 'none', boxShadow: 'none' } }}
                                    disableFocusRipple
                                  >
                                    <IoMdTrash style={{ width: '22px', height: '22px', color: initial.button_delete_color }} />
                                  </IconButton>
                                </Stack>
                              </TableCell>
                              : null
                          }
                        </TableRow>
                        {
                          openRowsBhiapc[group.nif] && group.lignes.map((row, rKey) => (
                            <TableRow key={rKey}>
                              {
                                withAnomalie && (
                                  <>
                                    <TableCell />
                                    <TableCell />
                                  </>
                                )
                              }
                              {columns
                                .map((column) => {
                                  if (!column.id) return null;
                                  let value = row[column.id];

                                  if (["nif", "raison_sociale"].includes(column.id)) {
                                    value = "";
                                  }

                                  if (column.isnumber && (value === null || value === undefined)) {
                                    value = 0;
                                  }

                                  return (
                                    <TableCell
                                      key={column.id}
                                      align={column.align}
                                      style={{ paddingTop: '4px', paddingBottom: '4px', fontSize: '13px' }}
                                    >
                                      {column.renderCell
                                        ? column.renderCell(value, row)
                                        : column.format && value !== null && value !== undefined
                                          ? typeof value === 'number'
                                            ? column.format(value)
                                            : format(value, "dd/MM/yyyy")
                                          : value}
                                    </TableCell>
                                  )
                                })}
                              {
                                !state
                                  ?
                                  <TableCell align="center" style={{ paddingTop: '10px', paddingBottom: '10px' }}>
                                    <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
                                      <Stack
                                        style={{ width: '22px', height: '22px' }}
                                      >
                                      </Stack>
                                      <IconButton
                                        disabled={!canDelete}
                                        onClick={() => handleRowDeleteClick(row, 'row')}
                                        sx={{ p: 0, border: 'none', outline: 'none', '&:focus': { outline: 'none', boxShadow: 'none' } }}
                                        disableFocusRipple
                                      >
                                        <IoMdTrash style={{ width: '22px', height: '22px', color: initial.button_delete_color }} />
                                      </IconButton>
                                    </Stack>
                                  </TableCell>
                                  : null
                              }
                            </TableRow>
                          ))
                        }
                      </React.Fragment>
                    )
                  })
                }
              </TableBody>
              :
              type === 'MP' ?
                <TableBody>
                  {
                    Object.values(groupedDataMp).map((group, key) => {
                      let rowStyle = {};
                      let cellStyle = {};

                      switch (group.niveau) {
                        case 0:
                          rowStyle = { fontWeight: 'bold', backgroundColor: '#f0f0f0' };
                          cellStyle = { fontWeight: 'bold' };
                          break;
                        case 1:
                          rowStyle = { fontWeight: 'bold', backgroundColor: '#f0f0f0' };
                          cellStyle = { fontWeight: 'bold' };
                          break;
                        case 2:
                          rowStyle = { fontWeight: 'normal', color: 'black' };
                          cellStyle = {};
                          break;
                        case 3:
                          rowStyle = { fontStyle: 'italic', color: 'black' };
                          cellStyle = { paddingLeft: '50px' };
                          break;
                        case 4:
                          rowStyle = { fontWeight: 'normal', color: 'white', backgroundColor: '#89A8B2' };
                          cellStyle = {};
                          break;
                        default:
                          rowStyle = { fontWeight: 'normal', color: 'black' };
                          cellStyle = {};
                      }

                      return (
                        <React.Fragment key={key}>
                          <TableRow
                            sx={{
                              position: "sticky",
                              top: 35,
                              zIndex: 2,
                              backgroundColor: "#f5f5f5"
                            }}
                            style={{ ...rowStyle }}
                          >
                            {
                              <>
                                <TableCell align="center"
                                  style={{
                                    paddingTop: '4px', paddingBottom: '4px', fontSize: '13px', position: "sticky", top: 35, ...cellStyle
                                  }}
                                >
                                  <IconButton
                                    onClick={() => toggleRowMp(group.marche)}
                                    sx={{
                                      width: 20,
                                      height: 20,
                                    }}
                                    style={{
                                      textTransform: 'none',
                                      outline: 'none',
                                      backgroundColor: "#67AE6E",
                                      color: 'white',
                                    }}
                                  >
                                    {openRowsMp[group.marche] ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
                                  </IconButton>
                                </TableCell>
                              </>
                            }

                            {columns.map((column) => {
                              if (!column.id) return null;
                              let value = group[column.id];

                              if (column.isnumber && (value === null || value === undefined)) {
                                value = 0;
                              }

                              if (['montant_marche_ht', 'montant_paye', 'tmp', 'marche'].includes(column.id)) {
                                return (
                                  <TableCell key={column.id} align={column.align} style={{ paddingTop: '10px', paddingBottom: '10px', fontSize: '13px', position: "sticky", top: 35, ...cellStyle }}>
                                    {column.renderCell
                                      ? column.renderCell(value, group)
                                      : column.format && value !== null && value !== undefined
                                        ? typeof value === 'number'
                                          ? column.format(value)
                                          : format(value, "dd/MM/yyyy")
                                        : value}
                                  </TableCell>
                                );
                              }
                              return <TableCell key={column.id} align={column.align} style={{ paddingTop: '4px', paddingBottom: '4px', fontSize: '13px', position: "sticky", top: 35, ...cellStyle }}></TableCell>
                            })}

                            {
                              !state
                                ?
                                <TableCell align="center" style={{ paddingTop: '4px', paddingBottom: '4px', position: "sticky", top: 35 }}>

                                </TableCell>
                                : null
                            }
                          </TableRow>
                          {
                            openRowsMp[group.marche] && group.lignes.map((row, rKey) => (
                              <TableRow key={rKey}>
                                <TableCell />
                                <TableCell />
                                {columns
                                  .filter(column => column.id !== 'marche')
                                  .map((column) => {
                                    if (!column.id) return null;
                                    let value = row[column.id];

                                    if (column.isnumber && (value === null || value === undefined)) {
                                      value = 0;
                                    }

                                    return (
                                      <TableCell
                                        key={column.id}
                                        align={column.align}
                                        style={{ paddingTop: '4px', paddingBottom: '4px', fontSize: '13px' }}
                                      >
                                        {column.renderCell
                                          ? column.renderCell(value, row)
                                          : column.format && value !== null && value !== undefined
                                            ? typeof value === 'number'
                                              ? column.format(value)
                                              : format(value, "dd/MM/yyyy")
                                            : value}
                                      </TableCell>
                                    )
                                  })}
                                {
                                  !state
                                    ?
                                    <TableCell align="center" style={{ paddingTop: '10px', paddingBottom: '10px' }}>
                                      <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
                                        <Stack
                                          style={{ width: '22px', height: '22px' }}
                                        >
                                        </Stack>
                                        <IconButton
                                          disabled={!canModify}
                                          onClick={() => handleRowModifClick(row)}
                                          sx={{ p: 0, border: 'none', outline: 'none', '&:focus': { outline: 'none', boxShadow: 'none' } }}
                                          disableFocusRipple
                                        >
                                          <IoMdCreate style={{ width: '22px', height: '22px', color: initial.theme }} />
                                        </IconButton>
                                        <IconButton
                                          disabled={!canDelete}
                                          onClick={() => handleRowDeleteClick(row, 'row')}
                                          sx={{ p: 0, border: 'none', outline: 'none', '&:focus': { outline: 'none', boxShadow: 'none' } }}
                                          disableFocusRipple
                                        >
                                          <IoMdTrash style={{ width: '22px', height: '22px', color: initial.button_delete_color }} />
                                        </IconButton>
                                      </Stack>
                                    </TableCell>
                                    : null
                                }
                              </TableRow>
                            ))
                          }
                        </React.Fragment>
                      )
                    })
                  }
                </TableBody>
                :
                <TableBody>
                  {rows.map((row) => {
                    let rowStyle = {};
                    let cellStyle = {};

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
                      <TableRow
                        hover
                        role="checkbox" tabIndex={-1} key={row.code}
                        style={{ height: '20px', ...rowStyle }}

                      >
                        {columns.map((column) => {
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
                                {column.format && value
                                  ? typeof value === 'number'
                                    ? column.format(value)
                                    : format(value, "dd/MM/yyy")
                                  : value
                                }
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
                                  // borderRight: '1px solid #ddd', borderLeft: '1px solid #ddd' ,
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
                                  // borderRight: '1px solid #ddd', borderLeft: '1px solid #ddd' ,
                                  fontSize: 15,
                                }}
                              >
                                {column.format && value
                                  ? typeof value === 'number'
                                    ? column.format(value)
                                    : format(value, "dd/MM/yyy")
                                  : value
                                }
                              </TableCell>
                            );
                          }
                        })}
                        {
                          !state
                            ? <TableCell
                              key={"boutonModif"}
                              align={"center"}
                              style={{
                                paddingTop: '5px',
                                paddingBottom: '5px',
                                // borderRight: '1px solid #ddd', borderLeft: '1px solid #ddd' ,
                                fontSize: 15,
                              }}
                            >
                              <Stack direction={'row'} alignItems={'center'} spacing={1}>
                                <IconButton
                                  disabled={!canModify}
                                  onClick={() => handleRowModifClick(row)}
                                  variant="contained"
                                  style={{
                                    width: "25px", height: '25px',
                                    borderRadius: "1px", borderColor: "transparent",
                                    backgroundColor: "transparent",
                                    textTransform: 'none', outline: 'none'
                                  }}
                                >
                                  <IoMdCreate style={{ width: '25px', height: '25px', color: initial.theme, position: 'absolute', }} />
                                </IconButton>

                                <IconButton
                                  disabled={!canDelete}
                                  onClick={() => handleRowDeleteClick(row)}
                                  variant="contained"
                                  style={{
                                    width: "25px", height: '25px',
                                    borderRadius: "1px", borderColor: "transparent",
                                    backgroundColor: "transparent",
                                    textTransform: 'none', outline: 'none'
                                  }}
                                >
                                  <IoMdTrash style={{ width: '25px', height: '25px', color: initial.button_delete_color, position: 'absolute', }} />
                                </IconButton>
                              </Stack>

                            </TableCell>
                            : null
                        }
                      </TableRow>
                    );
                  })}
                </TableBody>
          }
          {
            withFooter ?
              <TableFooter
                style={{
                  backgroundColor: '#89A8B2',
                  position: 'sticky',
                  bottom: 0,
                  zIndex: 1,
                }}
              >
                <TableRow>
                  {
                    type === 'MP' && (
                      <TableCell
                        align="center"
                        style={{
                          paddingTop: '4px',
                          paddingBottom: '4px',
                          fontSize: 15,
                          fontWeight: 'bold'
                        }}
                      >
                        Total
                      </TableCell>
                    )
                  }
                  {
                    withAnomalie && (
                      <>
                        <TableCell
                          align="center"
                          style={{
                            paddingTop: '4px',
                            paddingBottom: '4px',
                            fontSize: 15,
                            fontWeight: 'bold'
                          }}
                        >
                          Total
                        </TableCell>
                        <TableCell
                          align="center"
                          style={{
                            paddingTop: '4px',
                            paddingBottom: '4px',
                            fontSize: 15,
                            fontWeight: 'bold'
                          }}
                        ></TableCell>
                      </>
                    )
                  }
                  {columns.map((column) => (
                    <TableCell
                      key={column.id}
                      align={column.align}
                      style={{
                        fontWeight: 'bold',
                        paddingTop: '5px',
                        paddingBottom: '5px',
                        borderTop: '1px solid #ddd',
                        minWidth: columnWidths[column.id],
                        fontSize: 15
                      }}
                    >
                      {
                        column.id === "liste_emprunteur"
                          ? `${withAnomalie ? "" : "Total"}`
                          : column.isnumber
                            ? column.format(totalColumn(rows, column.id))
                            : ""
                      }
                    </TableCell>
                  ))}
                  <TableCell />
                </TableRow>
              </TableFooter> : null
          }
        </Table>
      </TableContainer>
    </Box >
  );
}

export default VirtualTableModifiableEbilan;