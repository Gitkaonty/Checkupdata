import { Autocomplete, Box, Checkbox, Chip, FormControlLabel, FormHelperText, Grid, MenuItem, Radio, RadioGroup, Select, Stack, TextField, Typography } from "@mui/material";
import { ErrorMessage, Field } from "formik";
import FormatedInput from "../../FormatedInput";

const FormikTextField = ({ name, label, width, ...props }) => (
    <Grid item>
        <Box sx={{
            width
        }}>
            <Typography sx={{ fontSize: '10px', fontWeight: 800, color: '#94A3B8', mb: 0.5, textTransform: 'uppercase' }}>
                {label}
            </Typography>
            <Field name={name}>
                {({ field, meta }) => (
                    <>
                        <TextField
                            {...field}
                            fullWidth
                            size="small"
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    bgcolor: '#F8FAFC',
                                    borderRadius: '8px',

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
                        {meta.touched && meta.error && (
                            <Typography sx={{ fontSize: '10px', color: 'red', mt: 0.5 }}>{meta.error}</Typography>
                        )}
                    </>
                )}
            </Field>
        </Box>
    </Grid>
);

const FormikSelect = ({ name, label, width, options, values, setFieldValue }) => (
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

const FormikAutocomplete = ({ name, label, width, options, values, setFieldValue }) => {
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

                <Field name={name}>
                    {({ meta }) => (
                        <>
                            <Autocomplete
                                options={options}
                                getOptionLabel={(option) => option.label || option.nom || ''}
                                value={options.find((opt) => opt.value === values[name]) || null}
                                onChange={(e, newValue) => {
                                    setFieldValue(name, newValue ? newValue.value : '');
                                }}
                                isOptionEqualToValue={(option, value) => option.value === value.value}
                                renderOption={(props, option) => {
                                    const { key, ...rest } = props;
                                    return (
                                        <li {...props} key={option.value}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                {option.icon && <Box>{option.icon}</Box>}
                                                {option.label}
                                            </Box>
                                        </li>
                                    )
                                }}
                                renderInput={(params) => {
                                    const selectedOption = options.find(opt => opt.value === values[name]);
                                    return (
                                        <TextField
                                            {...params}
                                            size="small"
                                            sx={{
                                                '& .MuiOutlinedInput-root': {
                                                    borderRadius: '8px',
                                                    bgcolor: '#F8FAFC',
                                                    height: 40,
                                                },
                                                '& .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: '#E2E8F0',
                                                },
                                                '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: '#3B82F6',
                                                },
                                                '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: '#3B82F6',
                                                },
                                            }}
                                            placeholder="Sélectionner..."
                                            InputProps={{
                                                ...params.InputProps,
                                                startAdornment: selectedOption?.icon ? (
                                                    <Box sx={{ ml: 1, mr: 0.5, display: 'flex', alignItems: 'center' }}>
                                                        {selectedOption.icon}
                                                    </Box>
                                                ) : null,
                                            }}
                                        />
                                    )
                                }}
                            />
                            {meta.touched && meta.error && (
                                <Typography sx={{ fontSize: '10px', color: 'red', mt: 0.5 }}>
                                    {meta.error}
                                </Typography>
                            )}
                        </>
                    )}
                </Field>
            </Box>
        </Grid>
    );
};

const FormikRadioGroup = ({ name, options, row = false }) => (
    <Field name={name}>
        {({ field, form }) => (
            <>
                <RadioGroup
                    {...field}
                    row={row}
                    value={field.value || ''}
                    onChange={(e) => form.setFieldValue(name, e.target.value)}
                >
                    {options.map((opt) => (
                        <FormControlLabel
                            key={opt.value}
                            value={opt.value}
                            control={<Radio size="small" />}
                            label={
                                <Typography
                                    component="span"
                                    sx={{ fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                                >
                                    {opt.label}
                                </Typography>
                            }
                        />
                    ))}
                </RadioGroup>
                <FormHelperText error>
                    <ErrorMessage name={name} />
                </FormHelperText>
            </>
        )}
    </Field>
);

const FormikCheckbox = ({ name, label, ...props }) => (
    <Field name={name}>
        {({ field }) => (
            <FormControlLabel
                control={<Checkbox {...field} checked={field.value} {...props} />}
                label={<Typography sx={{ fontSize: '12px', fontWeight: 700 }}>{label}</Typography>}
            />
        )}
    </Field>
);

const FormikAutocompleteMultiple = ({ name, label, width, options, values, setFieldValue }) => {
    return (
        <Grid item>
            <Box
                // sx={{ width }}
                sx={{
                    display: 'inline-flex',
                    flexDirection: 'column',
                    minWidth: 350,
                    maxWidth: '100%',
                }}
            >
                <Typography sx={{ fontSize: '10px', fontWeight: 800, color: '#94A3B8', mb: 0.5, textTransform: 'uppercase' }}>
                    {label}
                </Typography>

                <Autocomplete
                    multiple
                    options={options}
                    getOptionLabel={(option) => option.nom}
                    disableCloseOnSelect
                    value={values[name] || []}
                    onChange={(e, newValue) => {
                        setFieldValue(name, newValue);
                    }}
                    renderTags={(value, getTagProps) =>
                        value.map((option, index) => (
                            <Chip
                                label={option.nom}
                                {...getTagProps({ index })}
                                key={option.id}
                                size="small"
                            />
                        ))
                    }
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    sx={{
                        width: 'auto',
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
            <ErrorMessage name={name} component="div" style={{ color: 'red', fontSize: '10px', marginTop: 2 }} />
        </Grid>
    );
};

const FormikPaveItem = ({ name, label, unit, disabled = false, isCurrency = false, values, setFieldValue }) => {
    return (
        <Box
            sx={{
                width: '220px',
                bgcolor: '#fff',
                p: 2,
                borderRadius: '12px',
                border: '1px solid #E2E8F0',
                '&:hover': { borderColor: '#3B82F6' },
            }}
        >
            <Typography sx={{ fontWeight: 800, color: '#94A3B8', mb: 0.5, fontSize: '10px' }}>
                {label}
            </Typography>
            <Stack direction="row" alignItems="baseline" spacing={0.5}>
                <TextField
                    variant="standard"
                    fullWidth
                    disabled={disabled}
                    value={values[name]}
                    onChange={(e) => {
                        const rawVal = e.target.value || 0;
                        setFieldValue(name, rawVal);

                        if (name === 'montantcapital' || name === 'nbrpart') {
                            const capital = name === 'montantcapital' ? rawVal : values.montantcapital;
                            const parts = name === 'nbrpart' ? rawVal : values.nbrpart;
                            setFieldValue('valeurpart', parts ? parseFloat((capital / parts).toFixed(2)) : 0);
                        }
                    }}
                    InputProps={{
                        disableUnderline: true,
                        sx: {
                            fontWeight: 800,
                            fontSize: '16px',
                            color: '#1E293B',
                            '& input': {
                                p: 0,
                            },
                        },
                        inputComponent: FormatedInput,
                    }}
                />
                {unit && <Typography sx={{ color: '#CBD5E1', fontSize: '12px', fontWeight: 700 }}>{unit}</Typography>}
            </Stack>
        </Box>
    );
};

export { FormikTextField, FormikSelect, FormikAutocomplete, FormikRadioGroup, FormikCheckbox, FormikAutocompleteMultiple, FormikPaveItem }
