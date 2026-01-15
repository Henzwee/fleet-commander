import HireShips from './pages/HireShips';
import Settings from './pages/Settings';
import Tutorial from './pages/Tutorial';
import Jobs from './pages/Jobs';
import FleetManagement from './pages/FleetManagement';
import Main from './pages/Main';
import Market from './pages/Market';
import __Layout from './Layout.jsx';


export const PAGES = {
    "HireShips": HireShips,
    "Settings": Settings,
    "Tutorial": Tutorial,
    "Jobs": Jobs,
    "FleetManagement": FleetManagement,
    "Main": Main,
    "Market": Market,
}

export const pagesConfig = {
    mainPage: "Main",
    Pages: PAGES,
    Layout: __Layout,
};