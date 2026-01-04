import Main from './pages/Main';
import Tutorial from './pages/Tutorial';
import Market from './pages/Market';
import Jobs from './pages/Jobs';
import FleetManagement from './pages/FleetManagement';
import HireShips from './pages/HireShips';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Main": Main,
    "Tutorial": Tutorial,
    "Market": Market,
    "Jobs": Jobs,
    "FleetManagement": FleetManagement,
    "HireShips": HireShips,
}

export const pagesConfig = {
    mainPage: "Main",
    Pages: PAGES,
    Layout: __Layout,
};