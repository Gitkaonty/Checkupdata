import { Outlet } from "react-router-dom";
import { useState, useEffect } from "react";
import { Box, CircularProgress } from "@mui/material";
import useRefreshToken from "../hooks/useRefreshToken";
import useAuth from "../hooks/useAuth";

const PersistLogin = () => {
    const [isLoading, setIsLoading] = useState(true);
    const { auth } = useAuth();
    const refresh = useRefreshToken();

    useEffect(() => {
        const verifyRefreshToken = async () => {
            try {
                await refresh(); // rafraîchit et met à jour auth
            } catch (err) {
                console.error("Refresh token failed:", err);
            } finally {
                setIsLoading(false);
            }
        };

        if (!auth?.accessToken) verifyRefreshToken();
        else setIsLoading(false);
    }, []);

    if (isLoading) {
        return (
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    width: "100vw",
                    height: "100vh"
                }}
            >
                <CircularProgress size={50} color="success" />
            </Box>
        );
    }

    return <Outlet />;
};

export default PersistLogin;