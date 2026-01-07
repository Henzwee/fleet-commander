import FleetManagement from './pages/FleetManagement';
import HireShips from './pages/HireShips';
import Main from './pages/Main';
import Market from './pages/Market';
import Settings from './pages/Settings';
import Tutorial from './pages/Tutorial';
import Jobs from './pages/Jobs';
import __Layout from './Layout.jsx';


export const PAGES = {
    "FleetManagement": FleetManagement,
    "HireShips": HireShips,
    "Main": Main,
    "Market": Market,
    "Settings": Settings,
    "Tutorial": Tutorial,
    "Jobs": Jobs,
}

export const pagesConfig = {
    mainPage: "Main",
    Pages: PAGES,
    Layout: __Layout,
};