import { Autocomplete, Box, Checkbox, Chip, FormControlLabel, FormHelperText, Grid, MenuItem, Radio, RadioGroup, Select, Stack, TextField, Typography } from "@mui/material";
import { ErrorMessage, Field } from "formik";

const TextFieldState = ({ name, label, width, value, setValue, backgroundColor, color, border, ...props }) => {
    return (
        <Grid item>
            <Box sx={{ width }}>
                <Typography
                    sx={{
                        fontSize: '10px',
                        fontWeight: 800,
                        color: '#94A3B8',
                        mb: 0.5,
                        textTransform: 'uppercase',
                    }}
                >
                    {label}
                </Typography>

                <TextField
                    fullWidth
                    size="small"
                    value={value || ''}
                    onChange={(e) => setValue(e.target.value)}
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            bgcolor: backgroundColor || '#F8FAFC',
                            borderRadius: '8px',
                            color: color || 'black',
                            ...(border && { border }),
                            '&:hover fieldset': {
                                borderColor: '#3B82F6 !important',
                            },

                            '&.Mui-focused fieldset': {
                                borderColor: '#3B82F6',
                            },
                        },
                    }}
                    {...props}
                />
            </Box>
        </Grid>
    );
};

const SelectState = ({ name, label, width, options, values, setFieldValue }) => (
    <Grid item>
        <Box sx={{ width }}>
            <Typography sx={{ fontSize: '10px', fontWeight: 800, color: '#94A3B8', mb: 0.5, textTransform: 'uppercase' }}>
                {label}
            </Typography>
            <Field name={name}>
                {({ field, meta }) => (
                    <>
                        <Select
                            {...field}
                            size="small"
                            fullWidth
                            sx={{
                                height: 40,

                                '& .MuiOutlinedInput-root': {
                                    borderRadius: '8px',
                                    bgcolor: '#F8FAFC',
                                },

                                '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: '#E2E8F0',
                                },

                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                    borderColor: '#3B82F6',
                                },

                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                    borderColor: '#3B82F6',
                                },
                            }}
                        >
                            {options.map((opt) => (
                                <MenuItem key={opt.value} value={opt.value}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        {opt.icon && opt.icon}
                                        {opt.label}
                                    </Box>
                                </MenuItem>
                            ))}
                        </Select>

                        {meta.touched && meta.error && (
                            <Typography sx={{ fontSize: '10px', color: 'red', mt: 0.5 }}>
                                {meta.error}
                            </Typography>
                        )}
                    </>
                )}
            </Field>
            <ErrorMessage name={name} component="div" style={{ color: 'red', fontSize: '10px', marginTop: 2 }} />
        </Box>
    </Grid>
);

const AutocompleteState = ({ label, width, options, value, setValue }) => {
    const selectedOption = options.find(opt => opt.value === value);

    return (
        <Grid item>
            <Box sx={{ width }}>
                <Typography
                    sx={{
                        fontSize: '10px',
                        fontWeight: 800,
                        color: '#94A3B8',
                        mb: 0.5,
                        textTransform: 'uppercase',
                    }}
                >
                    {label}
                </Typography>

                <Autocomplete
                    options={options}
                    getOptionLabel={(option) => option.label || option.nom || ''}
                    value={selectedOption || null}
                    onChange={(e, newValue) => setValue(newValue ? newValue.value : 0)}
                    isOptionEqualToValue={(option, value) => option.value === value.value}
                    renderOption={(props, option) => (
                        <li {...props} key={option.value}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {option.icon && <Box>{option.icon}</Box>}
                                {option.label}
                            </Box>
                        </li>
                    )}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            size="small"
                            sx={{
                                '& .MuiOutlinedInput-root': { borderRadius: '8px', bgcolor: '#F8FAFC', height: 40 },
                                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E2E8F0' },
                                '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#3B82F6' },
                                '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#3B82F6' },
                            }}
                            placeholder="Sélectionner..."
                        />
                    )}
                />
            </Box>
        </Grid>
    );
};

const RadioGroupState = ({ options, row = false, value, onChange }) => {
    return (
        <RadioGroup row={row} value={value || ''} onChange={(e) => onChange(e.target.value)}>
            {options.map((opt) => (
                <FormControlLabel
                    key={opt.value}
                    value={opt.value}
                    control={<Radio size="small" />}
                    disabled={opt.disabled || false}
                    label={
                        <Typography sx={{ fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                            {opt.label}
                        </Typography>
                    }
                />
            ))}
        </RadioGroup>
    );
};

const CheckboxState = ({ name, label, ...props }) => (
    <Field name={name}>
        {({ field }) => (
            <FormControlLabel
                control={<Checkbox {...field} checked={field.value} {...props} />}
                label={<Typography sx={{ fontSize: '12px', fontWeight: 700 }}>{label}</Typography>}
            />
        )}
    </Field>
);

const AutocompleteMultipleState = ({ label, width, options, value, setValue }) => {
    return (
        <Grid item>
            <Box
                sx={{
                    display: 'inline-flex',
                    flexDirection: 'column',
                    minWidth: 350,
                    maxWidth: '100%',
                }}
            >
                <Typography
                    sx={{
                        fontSize: '10px',
                        fontWeight: 800,
                        color: '#94A3B8',
                        mb: 0.5,
                        textTransform: 'uppercase',
                    }}
                >
                    {label}
                </Typography>

                <Autocomplete
                    multiple
                    options={options}
                    getOptionLabel={(option) => option.nom || ''}
                    disableCloseOnSelect
                    value={value}
                    onChange={(_event, newValue) => {
                        setValue(newValue);
                    }}
                    renderTags={(selectedValues, getTagProps) =>
                        selectedValues.map((option, index) => (
                            <Chip
                                label={option.nom || ''}
                                {...getTagProps({ index })}
                                key={option.value || index}
                                size="small"
                            />
                        ))
                    }
                    isOptionEqualToValue={(option, val) => option.value === val.value}
                    sx={{
                        width: width || 'auto',
                        '& .MuiAutocomplete-inputRoot': {
                            minHeight: '38px',
                        },
                    }}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            size="small"
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: '8px',
                                    bgcolor: '#F8FAFC',
                                },
                                '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
                                    borderColor: '#3B82F6',
                                },
                            }}
                        />
                    )}
                />

            </Box>
        </Grid>
    );
};

export { TextFieldState, SelectState, AutocompleteState, RadioGroupState, CheckboxState, AutocompleteMultipleState }
