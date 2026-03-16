import { Stack, TextField, IconButton, InputAdornment } from "@mui/material";
import { ErrorMessage, Field } from "formik";
import { useEffect, useState } from "react";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

const PasswordField = ({ handleChange, values, setFieldValue, type, password }) => {

    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);

    const handleClickShowPassword = () => {
        setShowPassword((show) => !show);
    }

    const handleMouseDownPassword = (event) => {
        event.preventDefault();
    };

    const handleMouseUpPassword = (event) => {
        event.preventDefault();
    };

    const handleClickShowPasswordConfirmation = () => {
        setShowPasswordConfirmation((show) => !show);
    }

    const handleMouseDownPasswordConfirmation = (event) => {
        event.preventDefault();
    };

    const handleMouseUpPasswordConfirmation = (event) => {
        event.preventDefault();
    };

    useEffect(() => {
        if (!values.avecMotDePasse) {
            setFieldValue("motDePasse", "");
            setFieldValue("motDePasseConfirmation", "");
            setShowPassword(false);
            setShowPasswordConfirmation(false);
        } else {
            if (type === 'EDIT') {
                setFieldValue("motDePasse", password);
                setFieldValue("motDePasseConfirmation", password);
            }
        }
    }, [values.avecMotDePasse, type]);

    return (
        <>
            <Stack spacing={0} direction="row" alignItems="center">
                <Field
                    name="avecMotDePasse"
                    type="checkbox"
                    style={{ width: 18, height: 18, marginRight: 8 }}
                />
                <label style={{ fontSize: 14 }}>Avec mot de passe</label>
            </Stack>

            <Stack spacing={0.5}>
                <label style={{ fontSize: 13, color: 'black' }}>
                    Mot de passe
                </label>

                <input
                    type="password"
                    name="fake_password"
                    autoComplete="new-password"
                    style={{ display: "none" }}
                />

                <Field name="motDePasse">
                    {({ field }) => (
                        <TextField
                            {...field}
                            disabled={!values.avecMotDePasse}
                            sx={{
                                width: 350,
                                '& .MuiInputBase-root': {
                                    height: 32
                                }
                            }}
                            size="small"
                            type={showPassword ? "text" : "password"}
                            onChange={handleChange}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            disabled={!values.avecMotDePasse}
                                            aria-label={showPassword ? 'hide password' : 'show password'}
                                            onClick={handleClickShowPassword}
                                            onMouseDown={handleMouseDownPassword}
                                            onMouseUp={handleMouseUpPassword}
                                            edge="end"
                                        >
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />
                    )}
                </Field>

                <ErrorMessage
                    name="motDePasse"
                    component="div"
                    style={{ color: "red", fontSize: 12 }}
                />
            </Stack>

            <Stack spacing={0.5}>
                <label style={{ fontSize: 13, color: 'black' }}>
                    Confirmation du mot de passe
                </label>

                <Field name="motDePasseConfirmation">
                    {({ field }) => (
                        <TextField
                            {...field}
                            disabled={!values.avecMotDePasse}
                            sx={{
                                width: 350,
                                '& .MuiInputBase-root': {
                                    height: 32
                                }
                            }}
                            size="small"
                            type={showPasswordConfirmation ? "text" : "password"}
                            onChange={handleChange}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            disabled={!values.avecMotDePasse}
                                            aria-label={showPasswordConfirmation ? 'hide password' : 'show password'}
                                            onClick={handleClickShowPasswordConfirmation}
                                            onMouseDown={handleMouseDownPasswordConfirmation}
                                            onMouseUp={handleMouseUpPasswordConfirmation}
                                            edge="end"
                                        >
                                            {showPasswordConfirmation ? (
                                                <VisibilityOff />
                                            ) : (
                                                <Visibility />
                                            )}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />
                    )}
                </Field>

                <ErrorMessage
                    name="motDePasseConfirmation"
                    component="div"
                    style={{ color: "red", fontSize: 12 }}
                />
            </Stack>
        </>
    );
};

export default PasswordField;
