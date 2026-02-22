import {useCallback, useState} from "react";

import { fetchConfig, SharingConfig } from '../services/SharingService';
import {View} from "react-native";


function SharingScreen() {
    const [sharingConfig, setConfig] = useState<SharingConfig | null>(null);

    const loadSettings = useCallback(async () => {
        try {
            const data = await fetchConfig();
            setConfig(data);
        } catch (error) {
            console.warn('Failed to fetch sharing settings:');
        }
    }, []);

    return (
        <View>
    </View>
    );
}


export default SharingScreen;