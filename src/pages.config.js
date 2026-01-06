import FleetManagement from './pages/FleetManagement';
import HireShips from './pages/HireShips';
import Jobs from './pages/Jobs';
import Main from './pages/Main';
import Market from './pages/Market';
import Settings from './pages/Settings';
import Tutorial from './pages/Tutorial';
import __Layout from './Layout.jsx';


export const PAGES = {
    "FleetManagement": FleetManagement,
    "HireShips": HireShips,
    "Jobs": Jobs,
    "Main": Main,
    "Market": Market,
    "Settings": Settings,
    "Tutorial": Tutorial,
}

export const pagesConfig = {
    mainPage: "Main",
    Pages: PAGES,
    Layout: __Layout,
};