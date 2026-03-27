import { COLORS } from '@/constants/color';
import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';

interface CalendarProps {
    visible: boolean;
    onClose: () => void;
    onSelectDate: (date: string) => void;
    initialDate?: string;
}

export const Calendar: React.FC<CalendarProps> = ({
    visible,
    onClose,
    onSelectDate,
    initialDate,
}) => {
    const today = new Date();
    const [currentDate, setCurrentDate] = useState(initialDate ? new Date(initialDate) : today);

    const getDaysInMonth = (year: number, month: number) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (year: number, month: number) => {
        return new Date(year, month, 1).getDay();
    };

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const handleSelectDay = (day: number) => {
        const selectedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        const dateString = selectedDate.toISOString().split('T')[0];
        onSelectDate(dateString);
        onClose();
    };

    const renderHeader = () => {
        const monthNames = [
            'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4',
            'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8',
            'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
        ];
        return (
            <View style={styles.header}>
                <TouchableOpacity onPress={handlePrevMonth} style={styles.navButton}>
                    <Feather name="chevron-left" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </Text>
                <TouchableOpacity onPress={handleNextMonth} style={styles.navButton}>
                    <Feather name="chevron-right" size={24} color={COLORS.text} />
                </TouchableOpacity>
            </View>
        );
    };

    const renderDaysOfWeek = () => {
        const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
        return (
            <View style={styles.daysOfWeek}>
                {days.map((day, index) => (
                    <Text key={index} style={[styles.dayOfWeekText, index === 0 && { color: '#EF4444' }]}>
                        {day}
                    </Text>
                ))}
            </View>
        );
    };

    const renderDays = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfMonth(year, month);
        const days = [];

        // Normalize today's date for comparison (midnight)
        const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());

        // Padding for previous month
        for (let i = 0; i < firstDay; i++) {
            days.push(<View key={`empty-${i}`} style={styles.dayCell} />);
        }

        // Days of current month
        for (let i = 1; i <= daysInMonth; i++) {
            const dateObj = new Date(year, month, i);
            const isPast = dateObj < todayMidnight;
            const isToday = i === today.getDate() && month === today.getMonth() && year === today.getFullYear();
            const isSelected = initialDate && new Date(initialDate).getDate() === i &&
                new Date(initialDate).getMonth() === month &&
                new Date(initialDate).getFullYear() === year;

            days.push(
                <TouchableOpacity
                    key={i}
                    style={[
                        styles.dayCell,
                        isSelected && styles.selectedDayCell,
                        isToday && !isSelected && styles.todayCell,
                        isPast && styles.disabledDayCell
                    ]}
                    onPress={() => !isPast && handleSelectDay(i)}
                    disabled={isPast}
                >
                    <Text style={[
                        styles.dayText,
                        isSelected && styles.selectedDayText,
                        isToday && !isSelected && styles.todayText,
                        isPast && styles.disabledDayText
                    ]}>
                        {i}
                    </Text>
                </TouchableOpacity>
            );
        }

        return <View style={styles.daysGrid}>{days}</View>;
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.modalOverlay}>
                    <TouchableWithoutFeedback>
                        <View style={styles.calendarContainer}>
                            {renderHeader()}
                            {renderDaysOfWeek()}
                            {renderDays()}
                            <View style={styles.footer}>
                                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                                    <Text style={styles.closeButtonText}>Đóng</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    calendarContainer: {
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.text,
    },
    navButton: {
        padding: 4,
    },
    daysOfWeek: {
        flexDirection: 'row',
        marginBottom: 10,
    },
    dayOfWeekText: {
        flex: 1,
        textAlign: 'center',
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.textMuted,
    },
    daysGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    dayCell: {
        width: '14.28%',
        aspectRatio: 1,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 20,
        marginVertical: 2,
    },
    dayText: {
        fontSize: 14,
        color: COLORS.text,
    },
    todayCell: {
        backgroundColor: '#F3F4F6',
    },
    todayText: {
        color: COLORS.primary,
        fontWeight: '700',
    },
    selectedDayCell: {
        backgroundColor: COLORS.primary,
    },
    selectedDayText: {
        color: '#fff',
        fontWeight: '700',
    },
    disabledDayCell: {
        opacity: 0.3,
    },
    disabledDayText: {
        color: COLORS.textMuted,
    },
    footer: {
        marginTop: 20,
        alignItems: 'flex-end',
    },
    closeButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
    closeButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.primary,
    },
});
