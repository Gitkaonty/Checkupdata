import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import SubMenuList from '../subMenuComponents/SubMenuList';
import SubMenuHeader from '../subMenuComponents/SubMenuHeader';
import { init } from '../../../../init';
import { Stack } from '@mui/material';

const declFiscalesList = [
    {
        text: 'BGE-VCA - Balance générale-ventilation du CA',
        name: "bgevca",
        path: "#",
        urldynamic: false
    },
    {
        text: 'DCom - Droit de communication',
        name: "dcom",
        path: "/tab/declaration/declarationDroitComm",
        urldynamic: true
    },
    {
        text: 'E-bilan',
        name: "ebilan",
        path: "/tab/declaration/declarationEbilan",
        urldynamic: true
    },
    {
        text: 'IR Acompte - impôt sur les revenus',
        name: "iracompte",
        path: "#",
        urldynamic: false
    },
    {
        text: 'IR Liquidation - impôt sur les revenus',
        name: "irliquidation",
        path: "#",
        urldynamic: false
    },
    {
        text: 'IRI - Impôt sur les revenus intermittent',
        name: "iri",
        path: "#",
        urldynamic: false
    },
    {
        text: 'IRSA - Impôts sur les revenus salariaux et assimilés',
        name: "irsa",
        path: "/tab/declaration/declarationIRSA",
        urldynamic: true
    },
    {
        text: 'IRCM - Tmpôt sur le Revenu des Capitaux Mobiliers',
        name: "ircm",
        path: "#",
        urldynamic: false
    },
    {
        text: 'ISI - Impôt synthétique intermittent',
        name: "isi",
        path: "/tab/declaration/declarationISI",
        urldynamic: true
    },
    {
        text: 'TVA - Taxes sur la valeur ajoutée',
        name: "tva",
        path: "/tab/declaration/declarationTVA",
        urldynamic: true
    },
];

const declSocialesList = [
    {
        text: 'Organismes de santé',
        name: "organismesante",
        path: "#"
    },
    {
        text: 'Prévoyances sociales',
        name: "prevoyancesociales",
        path: "#"
    },
];

export default function Declaration({ onWindowState, pathToNavigate, humburgerMenuState, closeDrawer }) {
    let initial = init[0];

    const SendStateToParent = () => {
        onWindowState(false);
    }

    const HandlePath = (newPath) => {
        pathToNavigate(newPath);
    }

    return (
        <Stack
            backgroundColor={initial.theme}
            width={'100%'}
            height={'100vh'}
            zIndex={"10"}
            position={"fixed"}
            visibility={'visible'}
            sx={{ opacity: "0.95" }}
            marginTop={"-40px"}
            marginLeft={"-8px"}
        >
            <SubMenuHeader
                caption={"Déclarations"}
                openWindow={SendStateToParent}
                humburgerMenuState={humburgerMenuState}
                closeDrawer={closeDrawer}
            />

            <Stack
                width={"100%"}
                height={"100%"}
                spacing={2}
                alignItems={"flex-start"}
                direction={"row"}
                marginLeft={"20px"}
                marginTop={"-25px"}
            >
                <Stack width={"40%"} height={"30px"} spacing={0.1} alignItems={"flex-start"} direction={"column"}>
                    <Typography variant='h6' marginLeft={"50px"} color={"white"}>Liasses fiscales</Typography>
                    <SubMenuList list={declFiscalesList} navigatePath={HandlePath} />
                </Stack>

                <Divider orientation='vertical' color={"white"} style={{ height: "100%", opacity: "0.2" }} />

                <Stack width={"40%"} height={"30px"} spacing={0.1} alignItems={"flex-start"} direction={"column"}>
                    <Typography variant='h6' marginLeft={"50px"} color={"white"}>Organismes</Typography>
                    <SubMenuList list={declSocialesList} navigatePath={HandlePath} />
                </Stack>

            </Stack>
        </Stack>
    )
}