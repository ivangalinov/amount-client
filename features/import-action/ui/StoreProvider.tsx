import Store, { ImportContext } from '@/features/import-action/model/store';
import { ReactNode, useMemo } from 'react';

interface IProps {
    children: ReactNode;
}

export default function StoreProvider(props: IProps) {
    const store = useMemo(() => {
        return new Store();
    }, []);
    return (
        <ImportContext.Provider value={store}>
            {props.children}
        </ImportContext.Provider>
    )
}
