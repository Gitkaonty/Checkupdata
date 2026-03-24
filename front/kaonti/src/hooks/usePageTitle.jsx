import { useLocation } from 'react-router-dom';
import { pageTitles } from '../utils/pageTitles';

export const usePageTitle = () => {
    const location = useLocation();
    const path = location.pathname;

    const titleKey =
        Object.keys(pageTitles).find(key => path === key || path.startsWith(key));

    return titleKey ? pageTitles[titleKey] : 'Page';
};