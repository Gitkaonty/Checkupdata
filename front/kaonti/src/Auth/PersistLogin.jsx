import { Outlet, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Box, CircularProgress } from "@mui/material";
import useRefreshToken from "../hooks/useRefreshToken";
import useAuth from "../hooks/useAuth";
import useLogout from "../hooks/useLogout";

const PersistLogin = () => {
    const [isLoading, setIsLoading] = useState(true);
    const { auth } = useAuth();
    const refresh = useRefreshToken();
    const navigate = useNavigate();
    const logout = useLogout();

    useEffect(() => {
        const verifyRefreshToken = async () => {
            try {
                await refresh();
            } catch (err) {
                setIsLoading(false);
                try {
                    await logout();
                    navigate('/', { replace: true });
                } catch (err) {
                    console.error(err);
                }
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