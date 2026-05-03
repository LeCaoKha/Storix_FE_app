/**
 * Formats a number as VND currency
 * @param amount The amount to format
 * @returns Formatted string (e.g., "1.000.000 ₫")
 */
export const formatVND = (amount: number): string => {
    return amount.toLocaleString('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).replace('₫', '₫'); // Ensure the symbol is correct
};

/**
 * Formats a number as a simple decimal with dots (e.g., "1.000.000")
 * @param amount The amount to format
 * @returns Formatted string
 */
export const formatNumber = (amount: number): string => {
    return amount.toLocaleString('vi-VN');
};
