import React from 'react';
import { View, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from '@/hooks/useTranslation';

export const WarehouseEmptyState: React.FC = () => {
    const { t } = useTranslation();

    return (
        <View className="flex-1 justify-center items-center p-5">
            <Feather name="map-pin" size={64} color="#CCC" />
            <Text className="text-lg font-semibold text-slate-600 mt-4">
                {t('warehouse.noDiagram')}
            </Text>
        </View>
    );
};
