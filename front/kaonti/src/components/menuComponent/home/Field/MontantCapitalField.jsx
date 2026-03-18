import { TextField } from "@mui/material";
import { Field } from "formik";
import { useRef } from "react";
import FormatedInput from "../../../componentsTools/FormatedInput";

function MontantCapitalField({ setFieldValue, calculateValeurPart, values }) {
    const inputRef = useRef(null);

    return (
        <Field name="montantcapital">
            {({ field }) => (
                <TextField
                    {...field}
                    ref={inputRef}
                    required
                    type="text"
                    placeholder=""
                    onChange={(e) => {
                        const rawInput = e.target.value ?? 0;

                        setFieldValue("montantcapital", rawInput);
                        setFieldValue("valeurpart", calculateValeurPart(rawInput, values.nbrpart ?? 0));
                    }}
                    style={{
                        borderTop: "none",
                        borderLeft: "none",
                        borderRight: "none",
                        outline: "none",
                        borderWidth: "0.5px",
                        width: "120px",
                        textAlign: "right",
                    }}
                    InputProps={{
                        inputComponent: FormatedInput,
                    }}
                    sx={{
                        width: '100%',
                        '& .MuiFormHelperText-root': {
                            marginLeft: 0
                        },
                        '& .MuiInputBase-root': {
                            height: 32
                        },
                        '& .MuiInputBase-input': {
                            fontSize: '14px'
                        },
                    }}
                />
            )}
        </Field>
    );
}

export default MontantCapitalField;
