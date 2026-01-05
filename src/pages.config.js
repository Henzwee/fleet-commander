import FleetManagement from './pages/FleetManagement';
import HireShips from './pages/HireShips';
import Jobs from './pages/Jobs';
import Market from './pages/Market';
import Tutorial from './pages/Tutorial';
import Main from './pages/Main';
import __Layout from './Layout.jsx';


export const PAGES = {
    "FleetManagement": FleetManagement,
    "HireShips": HireShips,
    "Jobs": Jobs,
    "Market": Market,
    "Tutorial": Tutorial,
    "Main": Main,
}

export const pagesConfig = {
    mainPage: "Main",
    Pages: PAGES,
    Layout: __Layout,
};